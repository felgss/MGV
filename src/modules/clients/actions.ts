"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/modules/auth/session";

const optionalMoney = z.preprocess((value) => value === "" ? undefined : value, z.coerce.number().min(0).optional());

const createClientSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do cliente."),
  industry: z.string().trim().optional(),
  email: z.email("Informe um e-mail válido.").optional().or(z.literal("")),
  baselineMethod: z.enum(["FIXED_VALUE", "HISTORICAL_AVERAGE"]),
  fixedBaseline: optionalMoney,
  lookbackMonths: z.preprocess((value) => value === "" ? undefined : value, z.coerce.number().int().min(1).max(24).optional()),
  percentage: z.coerce.number().min(0).max(100),
  minimumFee: optionalMoney,
  maximumFee: optionalMoney,
});

export type CreateClientState = {
  ok: boolean;
  message: string;
};

export async function createClientAction(_: CreateClientState, formData: FormData): Promise<CreateClientState> {
  const session = await requireRole(["ADMIN", "CONSULTANT"]);
  const parsed = createClientSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Revise os dados do cliente." };
  }

  const data = parsed.data;
  if (data.baselineMethod === "FIXED_VALUE" && data.fixedBaseline === undefined) {
    return { ok: false, message: "Informe o baseline fixo." };
  }
  if (data.maximumFee !== undefined && data.minimumFee !== undefined && data.maximumFee < data.minimumFee) {
    return { ok: false, message: "O teto não pode ser menor que o piso." };
  }

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

  const client = await prisma.client.create({
    data: {
      tenantId: session.tenantId,
      name: data.name,
      industry: data.industry || null,
      email: data.email || null,
      startDate: new Date(),
      access: session.role === "CONSULTANT"
        ? { create: { tenantId: session.tenantId, userId: session.userId, accessLevel: "WRITE" } }
        : undefined,
      contracts: {
        create: {
          tenantId: session.tenantId,
          name: "Contrato de performance",
          startDate: new Date(),
          compensationRules: {
            create: {
              version: 1,
              percentage: data.percentage,
              minimumFee: data.minimumFee || null,
              maximumFee: data.maximumFee || null,
              effectiveFrom: new Date(),
            },
          },
          baselinePolicies: {
            create: {
              metricDefinitionId: metric.id,
              method: data.baselineMethod,
              fixedValue: data.baselineMethod === "FIXED_VALUE" ? data.fixedBaseline : null,
              lookbackMonths: data.baselineMethod === "HISTORICAL_AVERAGE" ? data.lookbackMonths ?? 6 : null,
            },
          },
        },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: session.tenantId,
      userId: session.userId,
      action: "CLIENT_CREATED",
      entityType: "Client",
      entityId: client.id,
      afterData: JSON.stringify({ name: client.name }),
    },
  });

  revalidatePath("/clientes");
  revalidatePath("/dashboard");
  revalidatePath("/financeiro");

  return { ok: true, message: "Cliente cadastrado com contrato e regra MGV." };
}
