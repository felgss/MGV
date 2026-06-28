import { hash } from "@node-rs/argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não configurada. Defina a conexão PostgreSQL antes de rodar o seed.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.monthlyCalculation.deleteMany();
  await prisma.metricEntry.deleteMany();
  await prisma.financialPeriod.deleteMany();
  await prisma.baselinePolicy.deleteMany();
  await prisma.compensationRule.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.metricDefinition.deleteMany();
  await prisma.businessUnit.deleteMany();
  await prisma.clientAccess.deleteMany();
  await prisma.client.deleteMany();
  await prisma.session.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  const tenant = await prisma.tenant.create({
    data: { name: "Método MGV", slug: "metodo-mgv", document: "00.000.000/0001-00" },
  });

  const passwordHash = await hash("Mgv@2026");
  const [admin, consultant, clientUser] = await Promise.all([
    prisma.user.create({ data: { name: "Felipe Grossi", email: "admin@mgv.com", passwordHash } }),
    prisma.user.create({ data: { name: "Marina Consultora", email: "consultor@mgv.com", passwordHash } }),
    prisma.user.create({ data: { name: "Carlos Cliente", email: "cliente@mgv.com", passwordHash } }),
  ]);

  await prisma.membership.createMany({ data: [
    { tenantId: tenant.id, userId: admin.id, role: "ADMIN" },
    { tenantId: tenant.id, userId: consultant.id, role: "CONSULTANT" },
    { tenantId: tenant.id, userId: clientUser.id, role: "CLIENT" },
  ] });

  const clientNames = ["Horizonte Solar", "Lumina Tech", "Vértice Saúde", "Orbe Logística"];
  const clients = [];
  for (const [index, name] of clientNames.entries()) {
    clients.push(await prisma.client.create({
      data: { tenantId: tenant.id, name, industry: ["Energia", "Tecnologia", "Saúde", "Logística"][index], startDate: new Date(2026, index, 1) },
    }));
  }

  await prisma.clientAccess.createMany({ data: [
    ...clients.map((client) => ({ tenantId: tenant.id, clientId: client.id, userId: consultant.id, accessLevel: "WRITE" })),
    { tenantId: tenant.id, clientId: clients[0].id, userId: clientUser.id, accessLevel: "READ" },
  ] });

  const metric = await prisma.metricDefinition.create({
    data: { tenantId: tenant.id, name: "Lucro operacional", key: "operating-profit", category: "PROFIT", isRequired: true },
  });

  const contract = await prisma.contract.create({
    data: { tenantId: tenant.id, clientId: clients[0].id, name: "Contrato de performance 2026", startDate: new Date(2026, 0, 1) },
  });
  const rule = await prisma.compensationRule.create({
    data: { contractId: contract.id, version: 1, percentage: 20, minimumFee: 2000, maximumFee: 15000, effectiveFrom: new Date(2026, 0, 1) },
  });
  await prisma.baselinePolicy.create({
    data: { contractId: contract.id, metricDefinitionId: metric.id, method: "FIXED_VALUE", fixedValue: 42000 },
  });

  const actualValues = [43500, 47200, 49800, 54100, 58600, 62200, 67500];
  for (const [index, actual] of actualValues.entries()) {
    const incremental = actual - 42000;
    const rawShare = incremental * 0.2;
    const share = Math.min(15000, Math.max(2000, rawShare));
    const period = await prisma.financialPeriod.create({
      data: { tenantId: tenant.id, clientId: clients[0].id, year: 2026, month: index + 1, status: "LOCKED", submittedAt: new Date(2026, index, 8), approvedAt: new Date(2026, index, 10), lockedAt: new Date(2026, index, 10), createdById: admin.id },
    });
    await prisma.metricEntry.create({ data: { tenantId: tenant.id, financialPeriodId: period.id, metricDefinitionId: metric.id, value: actual, source: "DRE gerencial" } });
    await prisma.monthlyCalculation.create({
      data: {
        tenantId: tenant.id,
        clientId: clients[0].id,
        financialPeriodId: period.id,
        contractId: contract.id,
        compensationRuleId: rule.id,
        baselineValue: 42000,
        actualValue: actual,
        incrementalProfit: incremental,
        eligibleIncrementalProfit: incremental,
        consultancyShare: share,
        clientShare: incremental - share,
        calculationDetails: JSON.stringify({ baselineMethod: "FIXED_VALUE", percentage: 20, minimumFee: 2000, maximumFee: 15000 }),
      },
    });
  }

  await prisma.auditLog.create({
    data: { tenantId: tenant.id, userId: admin.id, action: "SEED_CREATED", entityType: "Tenant", entityId: tenant.id, afterData: JSON.stringify({ version: "foundation" }) },
  });
}

main()
  .then(() => console.log("Base de demonstração criada."))
  .finally(async () => prisma.$disconnect());
