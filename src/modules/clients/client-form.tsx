"use client";

import { useActionState } from "react";
import { Building2, Percent, Save } from "lucide-react";
import { createClientAction, type CreateClientState } from "@/modules/clients/actions";

const initialState: CreateClientState = { ok: false, message: "" };

export function ClientForm() {
  const [state, formAction, pending] = useActionState(createClientAction, initialState);

  return (
    <form action={formAction} className="panel p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-[#d8b45a]/10 text-[#e0bd63]"><Building2 size={18} /></span>
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Novo cliente</h2>
          <p className="mt-1 text-xs text-zinc-600">Cria cliente, contrato, baseline e participação.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-zinc-500">Nome do cliente</span>
          <span className="input-shell"><input name="name" placeholder="Ex.: Clínica Horizonte" required /></span>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">Segmento</span>
            <span className="input-shell"><input name="industry" placeholder="Ex.: Saúde" /></span>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">E-mail</span>
            <span className="input-shell"><input name="email" type="email" placeholder="financeiro@cliente.com" /></span>
          </label>
        </div>

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

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">Meses da média</span>
            <span className="input-shell"><input name="lookbackMonths" type="number" min="1" max="24" defaultValue="6" /></span>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">Participação (%)</span>
            <span className="input-shell"><Percent size={15} /><input name="percentage" type="number" min="0" max="100" step="0.01" defaultValue="20" required /></span>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">Piso opcional</span>
            <span className="input-shell"><input name="minimumFee" type="number" min="0" step="0.01" placeholder="2000" /></span>
          </label>
        </div>

        <label className="space-y-1.5">
          <span className="text-xs font-medium text-zinc-500">Teto opcional</span>
          <span className="input-shell"><input name="maximumFee" type="number" min="0" step="0.01" placeholder="15000" /></span>
        </label>
      </div>

      {state.message ? <p className={`mt-4 text-sm ${state.ok ? "text-emerald-400" : "text-red-300"}`}>{state.message}</p> : null}

      <button className="button-primary mt-5 w-full" disabled={pending}>
        <Save size={17} /> {pending ? "Salvando..." : "Cadastrar cliente"}
      </button>
    </form>
  );
}
