import type { LucideIcon } from "lucide-react";

export function StatCard({ label, value, detail, icon: Icon, tone = "gold" }: { label: string; value: string; detail: string; icon: LucideIcon; tone?: "gold" | "green" | "blue" }) {
  const colors = { gold: "bg-[#d8b45a]/10 text-[#e8c76e]", green: "bg-emerald-500/10 text-emerald-400", blue: "bg-sky-500/10 text-sky-400" };
  return (
    <article className="panel p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-500">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-100">{value}</p>
        </div>
        <span className={`grid size-10 place-items-center rounded-xl ${colors[tone]}`}><Icon size={19} /></span>
      </div>
      <p className="mt-4 text-xs text-zinc-600">{detail}</p>
    </article>
  );
}
