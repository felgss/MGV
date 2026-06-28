import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { LoginForm } from "@/modules/auth/login-form";
import { getCurrentSession } from "@/modules/auth/session";

export default async function LoginPage() {
  if (await getCurrentSession()) redirect("/dashboard");

  return (
    <main className="relative grid min-h-screen overflow-hidden lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden border-r border-white/[0.07] p-14 lg:flex lg:flex-col lg:justify-between xl:p-20">
        <Brand />
        <div className="relative z-10 max-w-2xl">
          <p className="eyebrow">Mentalidade · Gestão · Vendas</p>
          <h1 className="font-display mt-6 text-6xl leading-[1.04] tracking-tight text-zinc-100 xl:text-7xl">Crescimento que pode ser <span className="text-[#dfbd67]">medido.</span></h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-zinc-500">Acompanhe a evolução financeira dos clientes e transforme resultado em clareza, previsibilidade e valor compartilhado.</p>
        </div>
        <p className="text-xs tracking-wide text-zinc-700">MGV Dashboard · Gestão inteligente para negócios lucrativos</p>
        <div className="absolute -bottom-44 -left-36 size-[34rem] rounded-full border border-[#d8b45a]/10" />
        <div className="absolute -bottom-28 -left-20 size-[24rem] rounded-full border border-[#d8b45a]/10" />
      </section>

      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden"><Brand /></div>
          <p className="eyebrow">Acesso seguro</p>
          <h2 className="font-display mt-3 text-4xl text-zinc-100">Bem-vindo de volta</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-500">Entre para acompanhar resultados e decisões que movem seus clientes.</p>
          <div className="mt-9"><LoginForm /></div>
          <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 text-xs leading-5 text-zinc-600">
            <strong className="text-zinc-400">Acesso de demonstração</strong><br />admin@mgv.com · Mgv@2026
          </div>
        </div>
      </section>
    </main>
  );
}
