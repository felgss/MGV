import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/modules/auth/session";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return <AppShell user={session}>{children}</AppShell>;
}
