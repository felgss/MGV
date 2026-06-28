import { hash } from "@node-rs/argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não configurada. Defina a conexão PostgreSQL antes de rodar o bootstrap.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const tenantName = process.env.TENANT_NAME ?? "Método MGV";
  const tenantSlug = process.env.TENANT_SLUG ?? "metodo-mgv";
  const adminName = process.env.ADMIN_NAME ?? "Administrador";
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@mgv.com").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || adminPassword.length < 8 || adminPassword === "troque-esta-senha") {
    throw new Error("Defina ADMIN_PASSWORD com pelo menos 8 caracteres antes do bootstrap.");
  }

  const tenant = await prisma.tenant.upsert({
    where: { slug: tenantSlug },
    create: {
      name: tenantName,
      slug: tenantSlug,
    },
    update: {
      name: tenantName,
      status: "ACTIVE",
    },
  });

  const passwordHash = await hash(adminPassword);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash,
    },
    update: {
      name: adminName,
      status: "ACTIVE",
    },
  });

  await prisma.membership.upsert({
    where: {
      tenantId_userId: {
        tenantId: tenant.id,
        userId: admin.id,
      },
    },
    create: {
      tenantId: tenant.id,
      userId: admin.id,
      role: "ADMIN",
    },
    update: {
      role: "ADMIN",
    },
  });

  await prisma.metricDefinition.upsert({
    where: {
      tenantId_key: {
        tenantId: tenant.id,
        key: "operating-profit",
      },
    },
    create: {
      tenantId: tenant.id,
      name: "Lucro operacional",
      key: "operating-profit",
      category: "PROFIT",
      isRequired: true,
    },
    update: {
      name: "Lucro operacional",
      category: "PROFIT",
      isRequired: true,
      isActive: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: admin.id,
      action: "PRODUCTION_BOOTSTRAP",
      entityType: "Tenant",
      entityId: tenant.id,
      afterData: JSON.stringify({ adminEmail }),
    },
  });

  console.log(`Bootstrap concluído. Admin: ${adminEmail}`);
}

main()
  .finally(async () => prisma.$disconnect());
