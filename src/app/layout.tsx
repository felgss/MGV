import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "MGV Dashboard", template: "%s | MGV Dashboard" },
  description: "Gestão financeira, evolução e lucro incremental para consultorias empresariais.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
