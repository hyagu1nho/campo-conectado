import Link from "next/link";
import Navegacao from "@/components/Navegacao";
import SeletorTema from "@/components/SeletorTema";
import { Logo } from "@/components/ui/Icones";
import { obterUsuario } from "@/lib/sessao";

/**
 * Barra grafite do engenheiro. Sem sessão não aparece: a única página aberta
 * é o login, que tem o próprio layout. Esconder link não é proteção; cada
 * página confere a sessão.
 */
export default async function Cabecalho() {
  const usuario = await obterUsuario();
  if (!usuario) return null;

  const itens =
    usuario.perfil === "ENGENHEIRO"
      ? [
          { href: "/ensaios", rotulo: "Ensaios" },
          { href: "/maquinas", rotulo: "Máquinas" },
          { href: "/areas", rotulo: "Áreas" },
        ]
      : [];

  return (
    <header className="bg-grafite text-sobre-grafite">
      <div className="mx-auto flex min-h-16 w-full max-w-[76rem] flex-wrap items-center gap-x-1 px-4 sm:px-8">
        <Link
          href="/"
          className="mr-6 flex items-center gap-2.5 py-3 text-[17px] font-bold"
        >
          <Logo />
          Campo Conectado
        </Link>
        <Navegacao
          itens={[
            ...itens,
            {
              href: "/perfil",
              rotulo: usuario.nome.split(" ")[0],
              direita: true,
            },
          ]}
          tema={<SeletorTema />}
        />
      </div>
    </header>
  );
}
