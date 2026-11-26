import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import Abertura from "@/components/Abertura";
import Cabecalho from "@/components/Cabecalho";
import GuardaAlteracoes from "@/components/GuardaAlteracoes";
import { SCRIPT_ABERTURA } from "@/lib/abertura";
import { SCRIPT_TEMA } from "@/lib/tema";
import "./globals.css";

// Servida pelo próprio Next (baixada no build), sem chamada ao Google no navegador.
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--fonte-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Campo Conectado",
  description: "Gestão de ensaios de campo de máquinas agrícolas",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: os scripts abaixo definem data-theme e data-abertura antes do React.
    <html
      lang="pt-BR"
      className={`${montserrat.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_ABERTURA }} />
      </head>
      <body className="flex min-h-full flex-col">
        <Abertura />
        <Cabecalho />
        <GuardaAlteracoes />
        {children}
      </body>
    </html>
  );
}
