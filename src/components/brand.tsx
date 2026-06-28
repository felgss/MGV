import { TrendingUp } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-xl border border-[#d8b45a]/35 bg-[#d8b45a]/10 text-[#e4c36f]">
        <TrendingUp size={21} strokeWidth={2.3} />
      </span>
      {!compact ? (
        <span>
          <span className="font-display block text-xl leading-none text-white">MGV</span>
          <span className="mt-1 block text-[9px] font-bold tracking-[0.24em] text-zinc-500">DASHBOARD</span>
        </span>
      ) : null}
    </div>
  );
}
