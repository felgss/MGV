"use server";

import { hash } from "@node-rs/argon2";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ROLES } from "@/lib/constants";
import { requireRole } from "@/modules/auth/session";

const roleSchema = z.enum([ROLES.ADMIN, ROLES.CONSULTANT, ROLES.CLIENT]);

const createUserSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do usuário."),
  email: z.email("Informe um e-mail válido.").transform((value) => value.trim().toLowerCase()),
  role: roleSchema,
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
  clientId: z.string().optional(),
});

const optionalMoney = z.preprocess((value) => value === "" ? undefined : value, z.coerce.number().min(0).optional());

const updateContractRuleSchema = z.object({
  clientId: z.string().min(1, "Selecione um cliente."),
  baselineMethod: z.enum(["FIXED_VALUE", "HISTORICAL_AVERAGE"]),
  fixedBaseline: optionalMoney,
  lookbackMonths: z.preprocess((value) => value === "" ? undefined : value, z.coerce.number().int().min(1).max(24).optional()),
  percentage: z.coerce.number().min(0).max(100),
  minimumFee: optionalMoney,
  maximumFee: optionalMoney,
});

export type AdminFormState = {
  ok: boolean;
  message: string;
};

export async function createUserAction(_: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const session = await requireRole(["ADMIN"]);
  const parsed = createUserSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Revise os dados do usuário." };
  }

  const data = parsed.data;

  if (data.role === ROLES.CLIENT && !data.clientId) {
    return { ok: false, message: "Para perfil cliente, selecione qual cliente ele poderá acessar." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    const existingMembership = await prisma.membership.findUnique({
      where: { tenantId_userId: { tenantId: session.tenantId, userId: existingUser.id } },
    });

    if (existingMembership) {
      return { ok: false, message: "Este e-mail já faz parte da equipe." };
    }
  }

  const passwordHash = await hash(data.password);
  const user = existingUser ?? await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
    },
  });

  await prisma.membership.create({
    data: {
      tenantId: session.tenantId,
      userId: user.id,
      role: data.role,
    },
  });

  if (data.role !== ROLES.ADMIN && data.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: data.clientId, tenantId: session.tenantId, status: "ACTIVE" },
    });

    if (client) {
      await prisma.clientAccess.upsert({
        where: { clientId_userId: { clientId: client.id, userId: user.id } },
        create: {
          tenantId: session.tenantId,
          clientId: client.id,
          userId: user.id,
          accessLevel: data.role === ROLES.CONSULTANT ? "WRITE" : "READ",
        },
        update: {
          accessLevel: data.role === ROLES.CONSULTANT ? "WRITE" : "READ",
        },
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      tenantId: session.tenantId,
      userId: session.userId,
      action: "USER_CREATED",
      entityType: "User",
      entityId: user.id,
      afterData: JSON.stringify({ email: user.email, role: data.role }),
    },
  });

  revalidatePath("/equipe");
  return { ok: true, message: "Usuário criado e permissões aplicadas." };
}

export async function updateContractRuleAction(_: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const session = await requireRole(["ADMIN"]);
  const parsed = updateContractRuleSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Revise as regras comerciais." };
  }

  const data = parsed.data;

  if (data.baselineMethod === "FIXED_VALUE" && data.fixedBaseline === undefined) {
    return { ok: false, message: "Informe o baseline fixo." };
  }
  if (data.maximumFee !== undefined && data.minimumFee !== undefined && data.maximumFee < data.minimumFee) {
    return { ok: false, message: "O teto não pode ser menor que o piso." };
  }

  const client = await prisma.client.findFirst({
    where: { id: data.clientId, tenantId: session.tenantId, status: "ACTIVE" },
  });
  if (!client) return { ok: false, message: "Cliente não encontrado." };

  const metric = await prisma.metricDefinition.upsert({
    where: { tenantId_key: { tenantId: session.tenantId, key: "operating-profit" } },
    create: {
      tenantId: session.tenantId,
      name: "Lucro operacional",
      key: "operating-profit",
      category: "PROFIT",
      isRequired: true,
    },
    update: { isActive: true, isRequired: true },
  });

  const contract = await prisma.contract.findFirst({
    where: { tenantId: session.tenantId, clientId: client.id, status: "ACTIVE" },
    include: {
      compensationRules: { orderBy: { version: "desc" }, take: 1 },
      baselinePolicies: { take: 1 },
    },
  });

  const activeContract = contract ?? await prisma.contract.create({
    data: {
      tenantId: session.tenantId,
      clientId: client.id,
      name: "Contrato de performance",
      startDate: new Date(),
    },
    include: {
      compensationRules: { orderBy: { version: "desc" }, take: 1 },
      baselinePolicies: { take: 1 },
    },
  });

  const latestRule = activeContract.compensationRules[0];
  await prisma.compensationRule.create({
    data: {
      contractId: activeContract.id,
      version: (latestRule?.version ?? 0) + 1,
      percentage: data.percentage,
      minimumFee: data.minimumFee ?? null,
      maximumFee: data.maximumFee ?? null,
      effectiveFrom: new Date(),
    },
  });

  const baselinePolicy = activeContract.baselinePolicies[0];
  const baselineData = {
    metricDefinitionId: metric.id,
    method: data.baselineMethod,
    fixedValue: data.baselineMethod === "FIXED_VALUE" ? data.fixedBaseline : null,
    lookbackMonths: data.baselineMethod === "HISTORICAL_AVERAGE" ? data.lookbackMonths ?? 6 : null,
  };

  if (baselinePolicy) {
    await prisma.baselinePolicy.update({
      where: { id: baselinePolicy.id },
      data: baselineData,
    });
  } else {
    await prisma.baselinePolicy.create({
      data: {
        contractId: activeContract.id,
        ...baselineData,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      tenantId: session.tenantId,
      userId: session.userId,
      action: "CONTRACT_RULE_UPDATED",
      entityType: "Client",
      entityId: client.id,
      afterData: JSON.stringify({
        baselineMethod: data.baselineMethod,
        percentage: data.percentage,
        minimumFee: data.minimumFee ?? null,
        maximumFee: data.maximumFee ?? null,
      }),
    },
  });

  revalidatePath("/configuracoes");
  revalidatePath("/clientes");
  revalidatePath("/financeiro");
  revalidatePath("/relatorios");

  return { ok: true, message: "Regra comercial atualizada. Próximos lançamentos usarão esta configuração." };
}
