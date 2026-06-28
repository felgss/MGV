import { Mail, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { TeamForm } from "@/modules/admin/team-form";
import { prisma } from "@/lib/db";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { requireRole } from "@/modules/auth/session";

export default async function TeamPage() {
  const session = await requireRole(["ADMIN"]);

  const [memberships, clients] = await Promise.all([
    prisma.membership.findMany({
      where: { tenantId: session.tenantId },
      include: {
        user: {
          include: {
            clientAccess: {
              where: { tenantId: session.tenantId },
              include: { client: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.client.findMany({
      where: { tenantId: session.tenantId, status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="pb-20 lg:pb-0">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Administração</p>
          <h1 className="font-display mt-2 text-4xl text-zinc-100">Equipe</h1>
          <p className="mt-2 text-sm text-zinc-500">Usuários, perfis e permissões de acesso aos clientes.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2.5 text-xs text-zinc-500">
          <UsersRound size={15} /> {memberships.length} usuários
        </div>
      </header>

      <section className="mt-8 grid gap-5 xl:grid-cols-[0.85fr_1.55fr]">
        <TeamForm clients={clients} />

        <article className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.07] p-5">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Usuários cadastrados</h2>
              <p className="mt-1 text-xs text-zinc-600">Controle inicial de papéis e vínculos com clientes.</p>
            </div>
            <ShieldCheck className="text-zinc-600" size={18} />
          </div>

          <div className="divide-y divide-white/[0.06]">
            {memberships.map((membership) => {
              const role = membership.role as Role;
              const access = membership.user.clientAccess;
              return (
                <div key={membership.id} className="grid gap-4 p-5 lg:grid-cols-[1.1fr_0.7fr_1fr]">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-white/[0.04] text-[#d8b45a]"><UserRound size={18} /></span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-200">{membership.user.name}</p>
                      <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-zinc-600"><Mail size={12} /> {membership.user.email}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/[0.025] p-3">
                    <p className="text-xs text-zinc-600">Perfil</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-200">{ROLE_LABELS[role]}</p>
                  </div>

                  <div className="rounded-2xl bg-white/[0.025] p-3">
                    <p className="text-xs text-zinc-600">Clientes vinculados</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-200">
                      {role === "ADMIN"
                        ? "Todos"
                        : access.length
                          ? access.map((item) => item.client.name).join(", ")
                          : "Sem vínculo específico"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </div>
  );
}
