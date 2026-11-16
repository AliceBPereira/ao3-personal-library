import type { Metadata } from "next";
import "./globals.css";
import { OfflineServiceWorkerRegister } from "@/components/ao3/OfflineServiceWorkerRegister";
import { GlobalThemeWrapper } from "@/components/ao3/GlobalThemeWrapper";

export const metadata: Metadata = {
  title: "Arquivo de Nossa Autoria — Biblioteca Pessoal de Livros & Fanfics",
  description:
    "Aplicação Web Offline-First para leitura e organização de livros e fanfics pessoais inspirada no Archive of Our Own (AO3), com suporte a EPUB, PDF, MOBI e HTML.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">
        <OfflineServiceWorkerRegister />
        <GlobalThemeWrapper>{children}</GlobalThemeWrapper>
      </body>
    </html>
  );
}
