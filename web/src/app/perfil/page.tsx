import type { Metadata } from "next";
import { sair } from "@/app/login/acoes";
import { EscolhaTema } from "@/components/SeletorTema";
import CabecalhoPagina from "@/components/ui/CabecalhoPagina";
import { estiloBotao } from "@/components/ui/estilos";
import Pagina from "@/components/ui/Pagina";
import Secao from "@/components/ui/Secao";
import { exigirUsuario } from "@/lib/sessao";

export const metadata: Metadata = { title: "Sua conta | Campo Conectado" };

const ROTULO_PERFIL = { ENGENHEIRO: "Engenheiro", ANALISTA: "Analista" };

function Dado({
  rotulo,
  children,
}: {
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className="text-suave">{rotulo}</dt>
      <dd className="m-0 font-semibold break-words">{children}</dd>
    </>
  );
}

export default async function Perfil() {
  const usuario = await exigirUsuario();

  return (
    <Pagina largura="estreita">
      <CabecalhoPagina titulo="Sua conta" />
      <section className="rounded-lg border border-borda bg-superficie px-5 py-5 sm:px-6">
        <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-4 gap-y-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <Dado rotulo="Nome">{usuario.nome}</Dado>
          <Dado rotulo="E-mail">{usuario.email}</Dado>
          <Dado rotulo="Perfil">{ROTULO_PERFIL[usuario.perfil]}</Dado>
        </dl>
      </section>
      <Secao titulo="Aparência">
        <EscolhaTema />
      </Secao>
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-borda bg-superficie px-5 py-5 sm:px-6">
        <h2 className="text-lg font-bold">Sessão</h2>
        <form action={sair}>
          <button type="submit" className={estiloBotao("secundaria")}>
            Sair
          </button>
        </form>
      </section>
    </Pagina>
  );
}
