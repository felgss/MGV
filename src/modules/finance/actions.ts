"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/modules/auth/session";
import { calculateMonthlyPerformance } from "@/modules/finance/calculation";

const financialEntrySchema = z.object({
  clientId: z.string().min(1, "Selecione um cliente."),
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  operatingProfit: z.coerce.number(),
  source: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type FinancialEntryState = {
  ok: boolean;
  message: string;
};

export async function createFinancialEntryAction(_: FinancialEntryState, formData: FormData): Promise<FinancialEntryState> {
  const session = await requireSession();
  const parsed = financialEntrySchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Revise os dados do lançamento." };
  }

  const data = parsed.data;
  const canAccessClient = await prisma.client.findFirst({
    where: {
      id: data.clientId,
      tenantId: session.tenantId,
      status: "ACTIVE",
      ...(session.role === "ADMIN" ? {} : { access: { some: { userId: session.userId } } }),
    },
  });

  if (!canAccessClient) {
    return { ok: false, message: "Cliente não encontrado ou sem acesso para este usuário." };
  }

  if (session.role === "CLIENT") {
    return { ok: false, message: "Perfil cliente pode acompanhar dados, mas não registrar lançamentos." };
  }

  const metric = await prisma.metricDefinition.findUnique({
    where: { tenantId_key: { tenantId: session.tenantId, key: "operating-profit" } },
  });

  if (!metric) {
    return { ok: false, message: "Indicador lucro operacional ainda não está configurado." };
  }

  const existingPeriod = await prisma.financialPeriod.findFirst({
    where: {
      tenantId: session.tenantId,
      clientId: data.clientId,
      businessUnitId: null,
      year: data.year,
      month: data.month,
    },
  });

  const period = existingPeriod
    ? await prisma.financialPeriod.update({
        where: { id: existingPeriod.id },
        data: {
          status: "LOCKED",
          submittedAt: new Date(),
          approvedAt: new Date(),
          lockedAt: new Date(),
        },
      })
    : await prisma.financialPeriod.create({
        data: {
          tenantId: session.tenantId,
          clientId: data.clientId,
          year: data.year,
          month: data.month,
          status: "LOCKED",
          submittedAt: new Date(),
          approvedAt: new Date(),
          lockedAt: new Date(),
          createdById: session.userId,
        },
      });

  await prisma.metricEntry.upsert({
    where: { financialPeriodId_metricDefinitionId: { financialPeriodId: period.id, metricDefinitionId: metric.id } },
    create: {
      tenantId: session.tenantId,
      financialPeriodId: period.id,
      metricDefinitionId: metric.id,
      value: data.operatingProfit,
      source: data.source || "Lançamento manual",
      notes: data.notes || null,
    },
    update: {
      value: data.operatingProfit,
      source: data.source || "Lançamento manual",
      notes: data.notes || null,
    },
  });

  await calculateMonthlyPerformance({
    tenantId: session.tenantId,
    clientId: data.clientId,
    financialPeriodId: period.id,
    actualValue: data.operatingProfit,
    year: data.year,
    month: data.month,
  });

  await prisma.auditLog.create({
    data: {
      tenantId: session.tenantId,
      userId: session.userId,
      action: "FINANCIAL_PERIOD_LOCKED",
      entityType: "FinancialPeriod",
      entityId: period.id,
      afterData: JSON.stringify({ year: data.year, month: data.month, operatingProfit: data.operatingProfit }),
    },
  });

  revalidatePath("/financeiro");
  revalidatePath("/dashboard");

  return { ok: true, message: "Lançamento registrado e participação MGV recalculada." };
}
