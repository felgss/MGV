"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#17130a] px-4 text-sm font-bold text-[#d8b45a] transition hover:bg-[#221b0e]"
    >
      <Printer size={17} /> Salvar como PDF
    </button>
  );
}
