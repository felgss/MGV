import { Building2, HandCoins, Landmark, Settings } from "lucide-react";
import { ContractRuleForm } from "@/modules/admin/contract-rule-form";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/money";
import { requireRole } from "@/modules/auth/session";

export default async function SettingsPage() {
  const session = await requireRole(["ADMIN"]);

  const [tenant, clients] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
    prisma.client.findMany({
      where: { tenantId: session.tenantId, status: "ACTIVE" },
      include: {
        contracts: {
          where: { status: "ACTIVE" },
          include: {
            compensationRules: { orderBy: { version: "desc" }, take: 1 },
            baselinePolicies: { take: 1 },
          },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const clientOptions = clients.map((client) => ({ id: client.id, name: client.name }));

  return (
    <div className="pb-20 lg:pb-0">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Administração</p>
          <h1 className="font-display mt-2 text-4xl text-zinc-100">Configurações</h1>
          <p className="mt-2 text-sm text-zinc-500">Ambiente da consultoria, métricas e regras de remuneração.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2.5 text-xs text-zinc-500">
          <Settings size={15} /> {tenant?.currency ?? "BRL"}
        </div>
      </header>

      <section className="mt-8 grid gap-5 xl:grid-cols-[0.85fr_1.55fr]">
        <div className="space-y-5">
          <article className="panel p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[#d8b45a]/10 text-[#e0bd63]"><Building2 size={18} /></span>
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">{tenant?.name ?? session.tenantName}</h2>
                <p className="mt-1 text-xs text-zinc-600">Ambiente multiempresa ativo.</p>
              </div>
            </div>
            <dl className="mt-5 grid gap-3 text-sm">
              <div className="rounded-2xl bg-white/[0.025] p-3">
                <dt className="text-xs text-zinc-600">Moeda</dt>
                <dd className="mt-1 font-semibold text-zinc-200">{tenant?.currency ?? "BRL"}</dd>
              </div>
              <div className="rounded-2xl bg-white/[0.025] p-3">
                <dt className="text-xs text-zinc-600">Fuso horário</dt>
                <dd className="mt-1 font-semibold text-zinc-200">{tenant?.timezone ?? "America/Sao_Paulo"}</dd>
              </div>
              <div className="rounded-2xl bg-white/[0.025] p-3">
                <dt className="text-xs text-zinc-600">Indicador principal</dt>
                <dd className="mt-1 font-semibold text-zinc-200">Lucro operacional</dd>
              </div>
            </dl>
          </article>

          <ContractRuleForm clients={clientOptions} />
        </div>

        <article className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.07] p-5">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Regras por cliente</h2>
              <p className="mt-1 text-xs text-zinc-600">Versão ativa de baseline e participação.</p>
            </div>
            <HandCoins className="text-zinc-600" size={18} />
          </div>

          <div className="divide-y divide-white/[0.06]">
            {clients.map((client) => {
              const contract = client.contracts[0];
              const rule = contract?.compensationRules[0];
              const baseline = contract?.baselinePolicies[0];

              return (
                <div key={client.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_0.85fr_0.85fr]">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-white/[0.04] text-xs font-bold text-[#d8b45a]">{client.name.slice(0, 2).toUpperCase()}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-200">{client.name}</p>
                      <p className="mt-1 text-xs text-zinc-600">{contract ? `Contrato: ${contract.name}` : "Sem contrato ativo"}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/[0.025] p-3">
                    <p className="flex items-center gap-2 text-xs text-zinc-600"><Landmark size={13} /> Baseline</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-200">
                      {baseline?.method === "HISTORICAL_AVERAGE"
                        ? `Média de ${baseline.lookbackMonths ?? 6} meses`
                        : formatCurrency(Number(baseline?.fixedValue ?? 0), session.currency)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/[0.025] p-3">
                    <p className="text-xs text-zinc-600">Participação</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-200">
                      {rule ? `${Number(rule.percentage)}%` : "Sem regra"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Piso {rule?.minimumFee ? formatCurrency(Number(rule.minimumFee), session.currency) : "n/d"} · Teto {rule?.maximumFee ? formatCurrency(Number(rule.maximumFee), session.currency) : "n/d"}
                    </p>
                  </div>
                </div>
              );
            })}

            {!clients.length ? <p className="p-10 text-center text-sm text-zinc-600">Nenhum cliente cadastrado ainda.</p> : null}
          </div>
        </article>
      </section>
    </div>
  );
}
