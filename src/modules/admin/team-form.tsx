"use client";

import { useActionState } from "react";
import { KeyRound, Mail, Save, UserPlus } from "lucide-react";
import { ROLE_LABELS, ROLES, type Role } from "@/lib/constants";
import { createUserAction, type AdminFormState } from "@/modules/admin/actions";

type ClientOption = {
  id: string;
  name: string;
};

const initialState: AdminFormState = { ok: false, message: "" };

export function TeamForm({ clients }: { clients: ClientOption[] }) {
  const [state, formAction, pending] = useActionState(createUserAction, initialState);
  const roles = [ROLES.ADMIN, ROLES.CONSULTANT, ROLES.CLIENT] as Role[];

  return (
    <form action={formAction} className="panel p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-[#d8b45a]/10 text-[#e0bd63]"><UserPlus size={18} /></span>
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Novo usuário</h2>
          <p className="mt-1 text-xs text-zinc-600">Crie acessos para administradores, consultores e clientes.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-zinc-500">Nome</span>
          <span className="input-shell"><input name="name" placeholder="Nome completo" required /></span>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-medium text-zinc-500">E-mail</span>
          <span className="input-shell"><Mail size={15} /><input name="email" type="email" placeholder="usuario@empresa.com" required /></span>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">Perfil</span>
            <select name="role" className="field-select" defaultValue={ROLES.CONSULTANT}>
              {roles.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">Cliente vinculado</span>
            <select name="clientId" className="field-select">
              <option value="">Sem vínculo específico</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </label>
        </div>

        <label className="space-y-1.5">
          <span className="text-xs font-medium text-zinc-500">Senha inicial</span>
          <span className="input-shell"><KeyRound size={15} /><input name="password" type="password" placeholder="Mínimo 8 caracteres" required /></span>
        </label>
      </div>

      {state.message ? <p className={`mt-4 text-sm ${state.ok ? "text-emerald-400" : "text-red-300"}`}>{state.message}</p> : null}

      <button className="button-primary mt-5 w-full" disabled={pending}>
        <Save size={17} /> {pending ? "Criando..." : "Criar usuário"}
      </button>
    </form>
  );
}
