import type { LucideIcon } from "lucide-react";

export function PlaceholderPage({ title, description, icon: Icon }: { title: string; description: string; icon: LucideIcon }) {
  return <div className="pb-20 lg:pb-0"><p className="eyebrow">Fundação pronta</p><h1 className="font-display mt-2 text-4xl text-zinc-100">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">{description}</p><div className="panel mt-8 grid min-h-80 place-items-center p-8 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#d8b45a]/10 text-[#e3c269]"><Icon size={24} /></span><p className="mt-5 font-medium text-zinc-300">Módulo preparado para a próxima fase</p><p className="mt-2 text-sm text-zinc-600">A estrutura de dados e as permissões já estão conectadas.</p></div></div></div>;
}
