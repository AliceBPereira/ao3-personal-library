import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arquivo de Nossa Autoria — Biblioteca Pessoal de Livros & Fanfics",
  description:
    "Aplicação Web para leitura e organização de livros e fanfics pessoais inspirada no Archive of Our Own (AO3), com suporte a EPUB, PDF, MOBI e HTML.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased bg-white text-[#2a2a2a]">
        {children}
      </body>
    </html>
  );
}
