import type { Metadata } from "next";
import { sair } from "@/app/login/acoes";
import Aviso from "@/components/Aviso";
import { estiloBotao } from "@/components/ui/estilos";

export const metadata: Metadata = { title: "Acesso negado | Campo Conectado" };

export default function AcessoNegado() {
  return (
    <Aviso
      codigo="403"
      titulo="Acesso negado"
      texto="Esta página é do perfil Engenheiro."
      acao={
        <form action={sair}>
          <button type="submit" className={estiloBotao()}>
            Sair
          </button>
        </form>
      }
    />
  );
}
