"use client";

import { useActionState } from "react";
import { Calculator, Save } from "lucide-react";
import { createFinancialEntryAction, type FinancialEntryState } from "@/modules/finance/actions";

type ClientOption = {
  id: string;
  name: string;
};

const initialState: FinancialEntryState = { ok: false, message: "" };
const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function FinancialEntryForm({ clients }: { clients: ClientOption[] }) {
  const [state, formAction, pending] = useActionState(createFinancialEntryAction, initialState);
  const now = new Date();

  return (
    <form action={formAction} className="panel p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-300"><Calculator size={18} /></span>
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Lançamento mensal</h2>
          <p className="mt-1 text-xs text-zinc-600">Informe o lucro operacional e o sistema calcula o MGV.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-zinc-500">Cliente</span>
          <select name="clientId" className="field-select" required>
            <option value="">Selecione</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">Mês</span>
            <select name="month" className="field-select" defaultValue={String(now.getMonth() + 1)}>
              {months.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">Ano</span>
            <span className="input-shell"><input name="year" type="number" min="2020" defaultValue={now.getFullYear()} required /></span>
          </label>
        </div>

        <label className="space-y-1.5">
          <span className="text-xs font-medium text-zinc-500">Lucro operacional</span>
          <span className="input-shell"><input name="operatingProfit" type="number" step="0.01" placeholder="67500" required /></span>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-medium text-zinc-500">Fonte</span>
          <span className="input-shell"><input name="source" placeholder="DRE gerencial, planilha, ERP..." /></span>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-medium text-zinc-500">Observações</span>
          <span className="input-shell"><input name="notes" placeholder="Comentário opcional" /></span>
        </label>
      </div>

      {state.message ? <p className={`mt-4 text-sm ${state.ok ? "text-emerald-400" : "text-red-300"}`}>{state.message}</p> : null}

      <button className="button-primary mt-5 w-full" disabled={pending || !clients.length}>
        <Save size={17} /> {pending ? "Calculando..." : "Registrar e calcular"}
      </button>
    </form>
  );
}
