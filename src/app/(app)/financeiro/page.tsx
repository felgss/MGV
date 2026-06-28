import { BarChart3, CircleDollarSign, HandCoins, TrendingUp } from "lucide-react";
import { FinancialEntryForm } from "@/modules/finance/financial-entry-form";
import { StatCard } from "@/components/stat-card";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/money";
import { requireSession } from "@/modules/auth/session";

const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default async function FinancialPage() {
  const session = await requireSession();
  const accessFilter = session.role === "ADMIN" ? {} : { access: { some: { userId: session.userId } } };

  const [clients, calculations] = await Promise.all([
    prisma.client.findMany({
      where: { tenantId: session.tenantId, status: "ACTIVE", ...accessFilter },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.monthlyCalculation.findMany({
      where: { tenantId: session.tenantId, ...(session.role === "ADMIN" ? {} : { client: accessFilter }) },
      include: { client: true, financialPeriod: true },
      orderBy: { calculatedAt: "desc" },
      take: 18,
    }),
  ]);

  const actual = calculations.reduce((sum, item) => sum + Number(item.actualValue), 0);
  const incremental = calculations.reduce((sum, item) => sum + Number(item.eligibleIncrementalProfit), 0);
  const consultancyShare = calculations.reduce((sum, item) => sum + Number(item.consultancyShare), 0);

  return (
    <div className="pb-20 lg:pb-0">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Indicador principal</p>
          <h1 className="font-display mt-2 text-4xl text-zinc-100">Lucro operacional</h1>
          <p className="mt-2 text-sm text-zinc-500">Lançamentos mensais, baseline, lucro incremental e participação MGV.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2.5 text-xs text-zinc-500">
          <BarChart3 size={15} /> {calculations.length} apurações
        </div>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Lucro operacional" value={formatCurrency(actual, session.currency)} detail="Soma das apurações listadas" icon={CircleDollarSign} />
        <StatCard label="Incremental elegível" value={formatCurrency(incremental, session.currency)} detail="Lucro negativo não remunera" icon={TrendingUp} tone="green" />
        <StatCard label="Participação MGV" value={formatCurrency(consultancyShare, session.currency)} detail="Com piso e teto quando configurados" icon={HandCoins} />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[0.85fr_1.55fr]">
        {session.role === "CLIENT" ? (
          <aside className="panel p-5">
            <h2 className="text-sm font-semibold text-zinc-100">Área do cliente</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">Seu perfil acompanha os indicadores e relatórios liberados pela consultoria. Lançamentos são feitos pela equipe MGV.</p>
          </aside>
        ) : (
          <FinancialEntryForm clients={clients} />
        )}

        <article className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.07] p-5">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Histórico de apurações</h2>
              <p className="mt-1 text-xs text-zinc-600">Cálculo automático a partir do lucro operacional.</p>
            </div>
            <CircleDollarSign className="text-zinc-600" size={18} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-white/[0.07] text-xs uppercase tracking-wider text-zinc-600">
                <tr>
                  <th className="px-5 py-4 font-semibold">Cliente</th>
                  <th className="px-5 py-4 font-semibold">Competência</th>
                  <th className="px-5 py-4 font-semibold">Baseline</th>
                  <th className="px-5 py-4 font-semibold">Lucro op.</th>
                  <th className="px-5 py-4 font-semibold">Incremental</th>
                  <th className="px-5 py-4 font-semibold">MGV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {calculations.map((item) => (
                  <tr key={item.id} className="text-zinc-300">
                    <td className="px-5 py-4 font-medium">{item.client.name}</td>
                    <td className="px-5 py-4 text-zinc-500">{monthLabels[item.financialPeriod.month - 1]}/{item.financialPeriod.year}</td>
                    <td className="px-5 py-4">{formatCurrency(Number(item.baselineValue), session.currency)}</td>
                    <td className="px-5 py-4">{formatCurrency(Number(item.actualValue), session.currency)}</td>
                    <td className={`px-5 py-4 ${Number(item.incrementalProfit) < 0 ? "text-red-300" : "text-emerald-300"}`}>{formatCurrency(Number(item.incrementalProfit), session.currency)}</td>
                    <td className="px-5 py-4 font-semibold text-[#e0bd63]">{formatCurrency(Number(item.consultancyShare), session.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!calculations.length ? <p className="p-10 text-center text-sm text-zinc-600">Nenhuma apuração registrada ainda.</p> : null}
        </article>
      </section>
    </div>
  );
}
