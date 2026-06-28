import Link from "next/link";
import { BarChart3, Building2, FileText, LayoutDashboard, LogOut, Settings, UsersRound } from "lucide-react";
import { Brand } from "./brand";
import { logoutAction } from "@/modules/auth/actions";
import type { Role } from "@/lib/constants";

const items = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard, roles: ["ADMIN", "CONSULTANT", "CLIENT"] },
  { href: "/clientes", label: "Clientes", icon: Building2, roles: ["ADMIN", "CONSULTANT"] },
  { href: "/financeiro", label: "Indicadores", icon: BarChart3, roles: ["ADMIN", "CONSULTANT", "CLIENT"] },
  { href: "/relatorios", label: "Relatórios", icon: FileText, roles: ["ADMIN", "CONSULTANT", "CLIENT"] },
  { href: "/equipe", label: "Equipe", icon: UsersRound, roles: ["ADMIN"] },
  { href: "/configuracoes", label: "Configurações", icon: Settings, roles: ["ADMIN"] },
] as const;

type ShellUser = {
  name: string;
  email: string;
  tenantName: string;
  role: Role;
  roleLabel: string;
};

export function AppShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const visibleItems = items.filter((item) => (item.roles as readonly string[]).includes(user.role));
  const initials = user.name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-white/[0.07] bg-[#101112]/95 px-5 py-7 lg:flex lg:flex-col">
        <div className="px-2"><Brand /></div>
        <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
          <p className="truncate text-xs font-semibold text-zinc-300">{user.tenantName}</p>
          <p className="mt-1 text-[11px] text-zinc-600">Ambiente da consultoria</p>
        </div>
        <nav className="mt-7 space-y-1.5">
          {visibleItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-white/[0.05] hover:text-white">
              <Icon size={18} /> {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/[0.07] pt-5">
          <div className="flex items-center gap-3 px-2">
            <span className="grid size-9 place-items-center rounded-full bg-[#d8b45a]/15 text-xs font-bold text-[#e7c978]">{initials}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-zinc-200">{user.name}</span>
              <span className="block text-xs text-zinc-600">{user.roleLabel}</span>
            </span>
            <form action={logoutAction}>
              <button type="submit" aria-label="Sair" title="Sair" className="cursor-pointer border-0 bg-transparent p-2 text-zinc-600 transition hover:text-zinc-200"><LogOut size={17} /></button>
            </form>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-white/[0.07] bg-[#0d0e0f]/90 px-5 backdrop-blur lg:hidden">
          <Brand />
          <form action={logoutAction}><button type="submit" aria-label="Sair" className="text-zinc-400"><LogOut size={19} /></button></form>
        </header>
        <main className="mx-auto max-w-[1500px] px-5 py-7 md:px-8 md:py-9 xl:px-10">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-white/10 bg-[#111214]/95 px-2 py-2 backdrop-blur lg:hidden">
          {visibleItems.slice(0, 4).map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex min-w-16 flex-col items-center gap-1 py-1 text-[10px] text-zinc-500"><Icon size={18} />{label}</Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
