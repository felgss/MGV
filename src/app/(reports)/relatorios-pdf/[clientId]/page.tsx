import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BarChart3, FileText, HandCoins, TrendingUp } from "lucide-react";
import { Brand } from "@/components/brand";
import { formatCurrency } from "@/lib/money";
import { requireSession } from "@/modules/auth/session";
import { getClientReportData } from "@/modules/reports/report-data";
import { PrintButton } from "@/modules/reports/print-button";

type ReportPageProps = {
  params: Promise<{ clientId: string }>;
};

const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default async function ClientPdfReportPage({ params }: ReportPageProps) {
  const session = await requireSession();
  const { clientId } = await params;
  const report = await getClientReportData(session, clientId);

  if (!report.client) notFound();

  const maxValue = Math.max(...report.calculations.map((item) => Number(item.actualValue)), 1);
  const periodStart = report.calculations[0]?.financialPeriod;
  const periodEnd = report.calculations.at(-1)?.financialPeriod;
  const rule = report.rule;
  const baselinePolicy = report.baselinePolicy;
  const generatedAt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date());

  return (
    <main className="min-h-screen bg-[#f5f1e7] text-[#17130a]">
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          html, body { background: #f5f1e7 !important; }
          .no-print { display: none !important; }
          .print-page { box-shadow: none !important; margin: 0 !important; max-width: none !important; border-radius: 0 !important; }
          .break-avoid { break-inside: avoid; }
        }
      `}</style>

      <div className="no-print mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <Link href="/relatorios" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 transition hover:text-zinc-950">
          <ArrowLeft size={17} /> Voltar
        </Link>
        <PrintButton />
      </div>

      <section className="print-page mx-auto mb-10 max-w-5xl overflow-hidden rounded-[2rem] bg-[#fbf8ef] shadow-2xl shadow-black/20">
        <header className="relative overflow-hidden bg-[#111214] px-8 py-8 text-white md:px-12">
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-[#d8b45a]/15 blur-3xl" />
          <div className="relative flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div>
              <Brand />
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.24em] text-[#d8b45a]">Relatório executivo MGV</p>
              <h1 className="font-display mt-3 text-4xl leading-tight text-white">{report.client.name}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                Evolução do lucro operacional, lucro incremental gerado e participação da consultoria conforme regra contratual.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm">
              <p className="text-zinc-500">Gerado em</p>
              <p className="mt-1 font-semibold text-zinc-100">{generatedAt}</p>
              <p className="mt-4 text-zinc-500">Período</p>
              <p className="mt-1 font-semibold text-zinc-100">
                {periodStart && periodEnd
                  ? `${monthLabels[periodStart.month - 1]}/${periodStart.year} a ${monthLabels[periodEnd.month - 1]}/${periodEnd.year}`
                  : "Sem apurações"}
              </p>
            </div>
          </div>
        </header>

        <div className="px-8 py-8 md:px-12">
          <section className="grid gap-4 md:grid-cols-3">
            <article className="break-avoid rounded-3xl bg-white p-5 shadow-sm">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500"><BarChart3 size={15} /> Lucro operacional</p>
              <p className="mt-4 text-2xl font-bold">{formatCurrency(report.totals.actual, session.currency)}</p>
              <p className="mt-2 text-xs text-zinc-500">Soma das competências apuradas.</p>
            </article>
            <article className="break-avoid rounded-3xl bg-white p-5 shadow-sm">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500"><TrendingUp size={15} /> Incremental elegível</p>
              <p className="mt-4 text-2xl font-bold text-emerald-700">{formatCurrency(report.totals.eligible, session.currency)}</p>
              <p className="mt-2 text-xs text-zinc-500">Lucro negativo não gera participação.</p>
            </article>
            <article className="break-avoid rounded-3xl bg-[#17130a] p-5 text-white shadow-sm">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#d8b45a]"><HandCoins size={15} /> Participação MGV</p>
              <p className="mt-4 text-2xl font-bold text-[#f1d37f]">{formatCurrency(report.totals.consultancy, session.currency)}</p>
              <p className="mt-2 text-xs text-zinc-400">Calculada com percentual, piso e teto.</p>
            </article>
          </section>

          <section className="break-avoid mt-8 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold">Evolução mensal</p>
                <p className="mt-1 text-xs text-zinc-500">Lucro operacional por competência.</p>
              </div>
              <FileText size={18} className="text-zinc-400" />
            </div>

            <div className="mt-8 flex h-56 items-end gap-3 border-b border-zinc-200 px-1">
              {report.calculations.length ? report.calculations.map((item) => {
                const value = Number(item.actualValue);
                return (
                  <div key={item.id} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <div className="w-full rounded-t-lg bg-gradient-to-t from-[#8d6d22] to-[#e0bd63]" style={{ height: `${Math.max(8, (value / maxValue) * 92)}%` }} />
                    <span className="text-[10px] font-semibold text-zinc-500">{monthLabels[item.financialPeriod.month - 1]}</span>
                  </div>
                );
              }) : <p className="m-auto text-sm text-zinc-500">Sem dados suficientes para o gráfico.</p>}
            </div>
          </section>

          <section className="mt-8 grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
            <article className="break-avoid rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-sm font-bold">Regra contratual</p>
              <dl className="mt-5 space-y-4 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-zinc-500">Baseline</dt>
                  <dd className="mt-1 font-semibold">
                    {baselinePolicy?.method === "HISTORICAL_AVERAGE"
                      ? `Média histórica de ${baselinePolicy.lookbackMonths ?? 6} meses`
                      : formatCurrency(Number(baselinePolicy?.fixedValue ?? 0), session.currency)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-zinc-500">Participação</dt>
                  <dd className="mt-1 font-semibold">{rule ? `${Number(rule.percentage)}% sobre o incremental elegível` : "Sem regra configurada"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-zinc-500">Piso e teto</dt>
                  <dd className="mt-1 font-semibold">
                    Piso: {rule?.minimumFee ? formatCurrency(Number(rule.minimumFee), session.currency) : "não definido"} · Teto: {rule?.maximumFee ? formatCurrency(Number(rule.maximumFee), session.currency) : "não definido"}
                  </dd>
                </div>
              </dl>
            </article>

            <article className="break-avoid rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-sm font-bold">Resumo da distribuição</p>
              <div className="mt-5 space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-zinc-500"><span>Cliente</span><span>{formatCurrency(report.totals.client, session.currency)}</span></div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-zinc-100">
                    <div className="h-full rounded-full bg-emerald-600" style={{ width: `${report.totals.eligible ? Math.max(4, (report.totals.client / report.totals.eligible) * 100) : 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold text-zinc-500"><span>MGV</span><span>{formatCurrency(report.totals.consultancy, session.currency)}</span></div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-zinc-100">
                    <div className="h-full rounded-full bg-[#d8b45a]" style={{ width: `${report.totals.eligible ? Math.max(4, (report.totals.consultancy / report.totals.eligible) * 100) : 0}%` }} />
                  </div>
                </div>
              </div>
              <p className="mt-5 text-xs leading-5 text-zinc-500">
                Memória: lucro operacional menos baseline = lucro incremental. Apenas valores positivos entram na base elegível. A participação MGV aplica percentual e respeita piso/teto quando configurados.
              </p>
            </article>
          </section>

          <section className="mt-8 overflow-hidden rounded-3xl bg-white shadow-sm">
            <div className="border-b border-zinc-100 p-6">
              <p className="text-sm font-bold">Memória de cálculo mensal</p>
              <p className="mt-1 text-xs text-zinc-500">Valores por competência.</p>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 text-[10px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-5 py-3">Mês</th>
                  <th className="px-5 py-3">Baseline</th>
                  <th className="px-5 py-3">Lucro op.</th>
                  <th className="px-5 py-3">Incremental</th>
                  <th className="px-5 py-3">Elegível</th>
                  <th className="px-5 py-3">MGV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {report.calculations.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3 font-semibold">{monthLabels[item.financialPeriod.month - 1]}/{item.financialPeriod.year}</td>
                    <td className="px-5 py-3">{formatCurrency(Number(item.baselineValue), session.currency)}</td>
                    <td className="px-5 py-3">{formatCurrency(Number(item.actualValue), session.currency)}</td>
                    <td className={`px-5 py-3 font-semibold ${Number(item.incrementalProfit) < 0 ? "text-red-700" : "text-emerald-700"}`}>{formatCurrency(Number(item.incrementalProfit), session.currency)}</td>
                    <td className="px-5 py-3">{formatCurrency(Number(item.eligibleIncrementalProfit), session.currency)}</td>
                    <td className="px-5 py-3 font-bold text-[#8d6d22]">{formatCurrency(Number(item.consultancyShare), session.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!report.calculations.length ? <p className="p-8 text-center text-sm text-zinc-500">Nenhuma apuração registrada.</p> : null}
          </section>

          <footer className="mt-8 flex items-center justify-between border-t border-zinc-200 pt-5 text-xs text-zinc-500">
            <span>MGV Dashboard · relatório gerado automaticamente</span>
            <span>{session.tenantName}</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
