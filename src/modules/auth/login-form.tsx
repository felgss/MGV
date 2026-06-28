"use client";

import { useActionState } from "react";
import { ArrowRight, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="space-y-5">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-zinc-300">E-mail</span>
        <span className="input-shell">
          <Mail aria-hidden="true" size={18} />
          <input name="email" type="email" autoComplete="email" placeholder="voce@empresa.com" required />
        </span>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-zinc-300">Senha</span>
        <span className="input-shell">
          <LockKeyhole aria-hidden="true" size={18} />
          <input name="password" type="password" autoComplete="current-password" placeholder="••••••••" required />
        </span>
      </label>

      {state.error ? <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{state.error}</p> : null}

      <button className="button-primary w-full" disabled={pending} type="submit">
        {pending ? <LoaderCircle className="animate-spin" size={18} /> : <>Entrar no dashboard <ArrowRight size={18} /></>}
      </button>
    </form>
  );
}
