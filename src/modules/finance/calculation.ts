import { prisma } from "@/lib/db";

type CalculationInput = {
  tenantId: string;
  clientId: string;
  financialPeriodId: string;
  actualValue: number;
  year: number;
  month: number;
};

function clampWithOptionalBounds(value: number, minimumFee: number | null, maximumFee: number | null) {
  if (value <= 0) return 0;
  const withMinimum = minimumFee === null ? value : Math.max(minimumFee, value);
  return maximumFee === null ? withMinimum : Math.min(maximumFee, withMinimum);
}

export async function calculateMonthlyPerformance(input: CalculationInput) {
  const contract = await prisma.contract.findFirst({
    where: {
      tenantId: input.tenantId,
      clientId: input.clientId,
      status: "ACTIVE",
      startDate: { lte: new Date(input.year, input.month - 1, 28) },
      OR: [{ endDate: null }, { endDate: { gte: new Date(input.year, input.month - 1, 1) } }],
    },
    include: {
      compensationRules: {
        where: {
          effectiveFrom: { lte: new Date(input.year, input.month - 1, 28) },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date(input.year, input.month - 1, 1) } }],
        },
        orderBy: { version: "desc" },
        take: 1,
      },
      baselinePolicies: {
        include: { metricDefinition: true },
        take: 1,
      },
    },
  });

  if (!contract || !contract.compensationRules[0] || !contract.baselinePolicies[0]) {
    throw new Error("Cliente sem contrato, regra de participação ou baseline configurado.");
  }

  const rule = contract.compensationRules[0];
  const baselinePolicy = contract.baselinePolicies[0];

  let baselineValue = Number(baselinePolicy.fixedValue ?? 0);

  if (baselinePolicy.method === "HISTORICAL_AVERAGE") {
    const lookbackMonths = baselinePolicy.lookbackMonths ?? 6;
    const historicalEntries = await prisma.metricEntry.findMany({
      where: {
        tenantId: input.tenantId,
        metricDefinitionId: baselinePolicy.metricDefinitionId,
        financialPeriod: {
          clientId: input.clientId,
          OR: [
            { year: { lt: input.year } },
            { year: input.year, month: { lt: input.month } },
          ],
        },
      },
      include: { financialPeriod: true },
      orderBy: [
        { financialPeriod: { year: "desc" } },
        { financialPeriod: { month: "desc" } },
      ],
      take: lookbackMonths,
    });

    baselineValue = historicalEntries.length
      ? historicalEntries.reduce((sum, entry) => sum + Number(entry.value), 0) / historicalEntries.length
      : 0;
  }

  const incrementalProfit = input.actualValue - baselineValue;
  const eligibleIncrementalProfit = Math.max(0, incrementalProfit);
  const rawShare = eligibleIncrementalProfit * (Number(rule.percentage) / 100);
  const consultancyShare = clampWithOptionalBounds(rawShare, rule.minimumFee === null ? null : Number(rule.minimumFee), rule.maximumFee === null ? null : Number(rule.maximumFee));
  const clientShare = eligibleIncrementalProfit - consultancyShare;

  return prisma.monthlyCalculation.upsert({
    where: { financialPeriodId: input.financialPeriodId },
    create: {
      tenantId: input.tenantId,
      clientId: input.clientId,
      financialPeriodId: input.financialPeriodId,
      contractId: contract.id,
      compensationRuleId: rule.id,
      baselineValue,
      actualValue: input.actualValue,
      incrementalProfit,
      eligibleIncrementalProfit,
      consultancyShare,
      clientShare,
      calculationDetails: JSON.stringify({
        baselineMethod: baselinePolicy.method,
        lookbackMonths: baselinePolicy.lookbackMonths,
        percentage: Number(rule.percentage),
        minimumFee: rule.minimumFee === null ? null : Number(rule.minimumFee),
        maximumFee: rule.maximumFee === null ? null : Number(rule.maximumFee),
      }),
    },
    update: {
      baselineValue,
      actualValue: input.actualValue,
      incrementalProfit,
      eligibleIncrementalProfit,
      consultancyShare,
      clientShare,
      calculatedAt: new Date(),
      calculationDetails: JSON.stringify({
        baselineMethod: baselinePolicy.method,
        lookbackMonths: baselinePolicy.lookbackMonths,
        percentage: Number(rule.percentage),
        minimumFee: rule.minimumFee === null ? null : Number(rule.minimumFee),
        maximumFee: rule.maximumFee === null ? null : Number(rule.maximumFee),
      }),
    },
  });
}
