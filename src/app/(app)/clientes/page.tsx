import { Building2, HandCoins, Landmark, PlusCircle } from "lucide-react";
import { ClientForm } from "@/modules/clients/client-form";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/money";
import { requireRole } from "@/modules/auth/session";

export default async function ClientsPage() {
  const session = await requireRole(["ADMIN", "CONSULTANT"]);
  const accessFilter = session.role === "ADMIN" ? {} : { access: { some: { userId: session.userId } } };

  const clients = await prisma.client.findMany({
    where: { tenantId: session.tenantId, status: "ACTIVE", ...accessFilter },
    include: {
      contracts: {
        where: { status: "ACTIVE" },
        include: {
          compensationRules: { orderBy: { version: "desc" }, take: 1 },
          baselinePolicies: { take: 1 },
        },
        take: 1,
      },
      calculations: { orderBy: { calculatedAt: "desc" }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="pb-20 lg:pb-0">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Carteira</p>
          <h1 className="font-display mt-2 text-4xl text-zinc-100">Clientes</h1>
          <p className="mt-2 text-sm text-zinc-500">Cadastro, contrato de performance e regras comerciais da consultoria.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2.5 text-xs text-zinc-500">
          <PlusCircle size={15} /> {clients.length} clientes ativos
        </div>
      </header>

      <section className="mt-8 grid gap-5 xl:grid-cols-[0.9fr_1.5fr]">
        <ClientForm />

        <article className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.07] p-5">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Contratos ativos</h2>
              <p className="mt-1 text-xs text-zinc-600">Baseline e participação definidos por cliente.</p>
            </div>
            <Building2 className="text-zinc-600" size={18} />
          </div>

          <div className="divide-y divide-white/[0.06]">
            {clients.map((client) => {
              const contract = client.contracts[0];
              const rule = contract?.compensationRules[0];
              const baseline = contract?.baselinePolicies[0];
              const latestCalculation = client.calculations[0];

              return (
                <div key={client.id} className="grid gap-4 p-5 lg:grid-cols-[1.15fr_0.85fr_0.85fr]">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-xl bg-white/[0.04] text-xs font-bold text-[#d8b45a]">{client.name.slice(0, 2).toUpperCase()}</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-200">{client.name}</p>
                        <p className="mt-1 text-xs text-zinc-600">{client.industry ?? "Segmento não informado"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/[0.025] p-3">
                    <p className="flex items-center gap-2 text-xs font-semibold text-zinc-400"><Landmark size={14} /> Baseline</p>
                    <p className="mt-2 text-sm text-zinc-200">
                      {baseline?.method === "HISTORICAL_AVERAGE"
                        ? `Média de ${baseline.lookbackMonths ?? 6} meses`
                        : formatCurrency(Number(baseline?.fixedValue ?? 0), session.currency)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/[0.025] p-3">
                    <p className="flex items-center gap-2 text-xs font-semibold text-zinc-400"><HandCoins size={14} /> Participação</p>
                    <p className="mt-2 text-sm text-zinc-200">
                      {rule ? `${Number(rule.percentage)}%` : "Sem regra"}
                      {rule?.minimumFee ? ` · piso ${formatCurrency(Number(rule.minimumFee), session.currency)}` : ""}
                      {rule?.maximumFee ? ` · teto ${formatCurrency(Number(rule.maximumFee), session.currency)}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Último MGV: {latestCalculation ? formatCurrency(Number(latestCalculation.consultancyShare), session.currency) : "sem apuração"}
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
