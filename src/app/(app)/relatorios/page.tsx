import Link from "next/link";
import { ArrowUpRight, FileText, HandCoins, Printer, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/money";
import { requireSession } from "@/modules/auth/session";

export default async function ReportsPage() {
  const session = await requireSession();
  const accessFilter = session.role === "ADMIN" ? {} : { access: { some: { userId: session.userId } } };

  const clients = await prisma.client.findMany({
    where: { tenantId: session.tenantId, status: "ACTIVE", ...accessFilter },
    include: {
      calculations: {
        orderBy: { calculatedAt: "desc" },
        take: 12,
      },
    },
    orderBy: { name: "asc" },
  });

  const totals = clients.reduce(
    (acc, client) => {
      for (const item of client.calculations) {
        acc.incremental += Number(item.eligibleIncrementalProfit);
        acc.consultancy += Number(item.consultancyShare);
      }
      return acc;
    },
    { incremental: 0, consultancy: 0 },
  );

  return (
    <div className="pb-20 lg:pb-0">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Relatórios executivos</p>
          <h1 className="font-display mt-2 text-4xl text-zinc-100">PDFs MGV</h1>
          <p className="mt-2 text-sm text-zinc-500">Relatórios por cliente com memória de cálculo e visual pronto para impressão.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2.5 text-xs text-zinc-500">
          <Printer size={15} /> Salvar pelo navegador
        </div>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Clientes com relatório" value={String(clients.length)} detail="Acesso conforme perfil" icon={FileText} tone="blue" />
        <StatCard label="Incremental elegível" value={formatCurrency(totals.incremental, session.currency)} detail="Base positiva para remuneração" icon={TrendingUp} tone="green" />
        <StatCard label="Participação MGV" value={formatCurrency(totals.consultancy, session.currency)} detail="Total nas apurações listadas" icon={HandCoins} />
      </section>

      <section className="panel mt-5 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.07] p-5">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Relatórios disponíveis</h2>
            <p className="mt-1 text-xs text-zinc-600">Abra o relatório e use “Salvar como PDF”.</p>
          </div>
          <FileText className="text-zinc-600" size={18} />
        </div>

        <div className="divide-y divide-white/[0.06]">
          {clients.map((client) => {
            const incremental = client.calculations.reduce((sum, item) => sum + Number(item.eligibleIncrementalProfit), 0);
            const consultancy = client.calculations.reduce((sum, item) => sum + Number(item.consultancyShare), 0);
            const latest = client.calculations[0];

            return (
              <Link
                key={client.id}
                href={`/relatorios-pdf/${client.id}`}
                target="_blank"
                className="grid gap-4 p-5 transition hover:bg-white/[0.025] md:grid-cols-[1.2fr_0.8fr_0.8fr_auto]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-white/[0.04] text-xs font-bold text-[#d8b45a]">{client.name.slice(0, 2).toUpperCase()}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-zinc-200">{client.name}</span>
                    <span className="mt-1 block text-xs text-zinc-600">{client.industry ?? "Segmento não informado"}</span>
                  </span>
                </div>
                <div>
                  <p className="text-xs text-zinc-600">Incremental elegível</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-300">{formatCurrency(incremental, session.currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600">Participação MGV</p>
                  <p className="mt-1 text-sm font-semibold text-[#e0bd63]">{formatCurrency(consultancy, session.currency)}</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                  {latest ? "Abrir PDF" : "Sem apuração"} <ArrowUpRight size={16} />
                </div>
              </Link>
            );
          })}

          {!clients.length ? <p className="p-10 text-center text-sm text-zinc-600">Nenhum cliente disponível para relatório.</p> : null}
        </div>
      </section>
    </div>
  );
}
