import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Role } from "@/lib/constants";

type ReportSession = {
  tenantId: string;
  userId: string;
  role: Role;
};

export async function getClientReportData(session: ReportSession, clientId: string) {
  const accessFilter = session.role === "ADMIN" ? {} : { access: { some: { userId: session.userId } } };

  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      tenantId: session.tenantId,
      status: "ACTIVE",
      ...accessFilter,
    },
    include: {
      contracts: {
        where: { status: "ACTIVE" },
        include: {
          compensationRules: { orderBy: { version: "desc" }, take: 1 },
          baselinePolicies: { take: 1, include: { metricDefinition: true } },
        },
        take: 1,
      },
      calculations: {
        include: { financialPeriod: true },
        orderBy: [
          { financialPeriod: { year: "asc" } },
          { financialPeriod: { month: "asc" } },
        ],
        take: 12,
      },
    },
  });

  if (!client) notFound();

  const calculations = client.calculations;
  const totals = calculations.reduce(
    (acc, item) => {
      acc.actual += Number(item.actualValue);
      acc.baseline += Number(item.baselineValue);
      acc.incremental += Number(item.incrementalProfit);
      acc.eligible += Number(item.eligibleIncrementalProfit);
      acc.consultancy += Number(item.consultancyShare);
      acc.client += Number(item.clientShare);
      return acc;
    },
    { actual: 0, baseline: 0, incremental: 0, eligible: 0, consultancy: 0, client: 0 },
  );

  const contract = client.contracts[0] ?? null;
  const rule = contract?.compensationRules[0] ?? null;
  const baselinePolicy = contract?.baselinePolicies[0] ?? null;

  return {
    client,
    calculations,
    totals,
    contract,
    rule,
    baselinePolicy,
  };
}
