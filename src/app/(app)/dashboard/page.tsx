import { ArrowUpRight, Building2, CircleDollarSign, HandCoins, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/money";
import { requireSession } from "@/modules/auth/session";

export default async function DashboardPage() {
  const session = await requireSession();
  const clientFilter = session.role === "ADMIN" ? {} : { access: { some: { userId: session.userId } } };

  const [clients, calculations] = await Promise.all([
    prisma.client.findMany({ where: { tenantId: session.tenantId, status: "ACTIVE", ...clientFilter }, orderBy: { name: "asc" }, take: 5 }),
    prisma.monthlyCalculation.findMany({
      where: { tenantId: session.tenantId, ...(session.role === "ADMIN" ? {} : { client: clientFilter }) },
      include: { client: true, financialPeriod: true },
      orderBy: [{ financialPeriod: { year: "asc" } }, { financialPeriod: { month: "asc" } }],
      take: 12,
    }),
  ]);

  const actual = calculations.reduce((sum, item) => sum + Number(item.actualValue), 0);
  const incremental = calculations.reduce((sum, item) => sum + Number(item.incrementalProfit), 0);
  const consultancyShare = calculations.reduce((sum, item) => sum + Number(item.consultancyShare), 0);
  const chartValues = calculations.slice(-7).map((item) => Number(item.actualValue));
  const max = Math.max(...chartValues, 1);

  return (
    <div className="pb-20 lg:pb-0">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Visão executiva</p>
          <h1 className="font-display mt-2 text-4xl text-zinc-100">Olá, {session.name.split(" ")[0]}.</h1>
          <p className="mt-2 text-sm text-zinc-500">Aqui está a evolução financeira da sua carteira.</p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2.5 text-xs text-zinc-500">Últimos 7 meses</div>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Clientes ativos" value={String(clients.length)} detail="Carteira com acesso liberado" icon={Building2} tone="blue" />
        <StatCard label="Lucro operacional" value={formatCurrency(actual, session.currency)} detail="Acumulado no período" icon={CircleDollarSign} />
        <StatCard label="Lucro incremental" value={formatCurrency(incremental, session.currency)} detail="Resultado acima do baseline" icon={TrendingUp} tone="green" />
        <StatCard label="Participação MGV" value={formatCurrency(consultancyShare, session.currency)} detail="Valor calculado pelos contratos" icon={HandCoins} />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_0.75fr]">
        <article className="panel min-h-[390px] p-6">
          <div className="flex items-start justify-between">
            <div><p className="text-sm font-semibold text-zinc-200">Evolução do lucro operacional</p><p className="mt-1 text-xs text-zinc-600">Resultado consolidado da carteira</p></div>
            <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">+18,4%</span>
          </div>
          <div className="mt-9 flex h-64 items-end gap-3 border-b border-white/[0.06] px-2">
            {chartValues.length ? chartValues.map((value, index) => (
              <div key={index} className="group flex h-full flex-1 items-end">
                <div className="relative w-full rounded-t-md bg-gradient-to-t from-[#9b7b2d]/50 to-[#e0bd63] transition hover:brightness-110" style={{ height: `${Math.max(12, (value / max) * 92)}%` }}>
                  <span className="absolute -top-7 left-1/2 hidden -translate-x-1/2 text-[10px] text-zinc-400 group-hover:block">{formatCurrency(value)}</span>
                </div>
              </div>
            )) : <div className="m-auto text-sm text-zinc-600">Os dados aparecerão após a primeira apuração.</div>}
          </div>
          <div className="mt-3 flex justify-between px-2 text-[10px] uppercase tracking-wider text-zinc-700"><span>Início</span><span>Período atual</span></div>
        </article>

        <article className="panel p-6">
          <div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-zinc-200">Clientes</p><p className="mt-1 text-xs text-zinc-600">Atividade recente</p></div><Building2 size={18} className="text-zinc-600" /></div>
          <div className="mt-6 divide-y divide-white/[0.06]">
            {clients.map((client, index) => (
              <div key={client.id} className="flex items-center gap-3 py-4">
                <span className="grid size-9 place-items-center rounded-xl bg-white/[0.04] text-xs font-bold text-[#d8b45a]">{client.name.slice(0, 2).toUpperCase()}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-zinc-300">{client.name}</span><span className="mt-1 block text-xs text-zinc-600">{index === 0 ? "Apuração atualizada" : "Cliente ativo"}</span></span>
                <ArrowUpRight size={16} className="text-zinc-700" />
              </div>
            ))}
            {!clients.length ? <p className="py-12 text-center text-sm text-zinc-600">Nenhum cliente disponível.</p> : null}
          </div>
        </article>
      </section>
    </div>
  );
}
