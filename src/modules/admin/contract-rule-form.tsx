"use client";

import { useActionState } from "react";
import { HandCoins, Percent, Save } from "lucide-react";
import { updateContractRuleAction, type AdminFormState } from "@/modules/admin/actions";

type ClientOption = {
  id: string;
  name: string;
};

const initialState: AdminFormState = { ok: false, message: "" };

export function ContractRuleForm({ clients }: { clients: ClientOption[] }) {
  const [state, formAction, pending] = useActionState(updateContractRuleAction, initialState);

  return (
    <form action={formAction} className="panel p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-300"><HandCoins size={18} /></span>
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Regra comercial</h2>
          <p className="mt-1 text-xs text-zinc-600">Atualize baseline, percentual, piso e teto por cliente.</p>
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
            <span className="text-xs font-medium text-zinc-500">Tipo de baseline</span>
            <select name="baselineMethod" className="field-select" defaultValue="FIXED_VALUE">
              <option value="FIXED_VALUE">Valor fixo</option>
              <option value="HISTORICAL_AVERAGE">Média histórica</option>
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">Baseline fixo</span>
            <span className="input-shell"><input name="fixedBaseline" type="number" min="0" step="0.01" placeholder="42000" /></span>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">Meses da média</span>
            <span className="input-shell"><input name="lookbackMonths" type="number" min="1" max="24" defaultValue="6" /></span>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">Participação (%)</span>
            <span className="input-shell"><Percent size={15} /><input name="percentage" type="number" min="0" max="100" step="0.01" defaultValue="20" required /></span>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">Piso opcional</span>
            <span className="input-shell"><input name="minimumFee" type="number" min="0" step="0.01" placeholder="2000" /></span>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">Teto opcional</span>
            <span className="input-shell"><input name="maximumFee" type="number" min="0" step="0.01" placeholder="15000" /></span>
          </label>
        </div>
      </div>

      {state.message ? <p className={`mt-4 text-sm ${state.ok ? "text-emerald-400" : "text-red-300"}`}>{state.message}</p> : null}

      <button className="button-primary mt-5 w-full" disabled={pending || !clients.length}>
        <Save size={17} /> {pending ? "Atualizando..." : "Atualizar regra"}
      </button>
    </form>
  );
}
