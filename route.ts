import { hash } from "@node-rs/argon2";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const configuredSecret = process.env.BOOTSTRAP_SECRET;
  const receivedSecret = request.nextUrl.searchParams.get("secret");

  if (!configuredSecret || configuredSecret === "troque-este-segredo") {
    return NextResponse.json(
      { ok: false, message: "BOOTSTRAP_SECRET não configurado." },
      { status: 500 },
    );
  }

  if (!receivedSecret || receivedSecret !== configuredSecret) {
    return NextResponse.json(
      { ok: false, message: "Segredo inválido." },
      { status: 401 },
    );
  }

  const tenantName = process.env.TENANT_NAME ?? "Método MGV";
  const tenantSlug = process.env.TENANT_SLUG ?? "metodo-mgv";
  const adminName = process.env.ADMIN_NAME ?? "Administrador";
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@mgv.com").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || adminPassword.length < 8 || adminPassword === "troque-esta-senha") {
    return NextResponse.json(
      { ok: false, message: "ADMIN_PASSWORD precisa ter pelo menos 8 caracteres." },
      { status: 500 },
    );
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
      passwordHash,
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
      action: "VERCEL_BOOTSTRAP",
      entityType: "Tenant",
      entityId: tenant.id,
      afterData: JSON.stringify({ adminEmail }),
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Bootstrap concluído.",
    adminEmail,
  });
}
