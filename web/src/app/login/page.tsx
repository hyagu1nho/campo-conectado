import type { Metadata } from "next";
import { redirect } from "next/navigation";
import FormularioLogin from "@/components/FormularioLogin";
import Alerta from "@/components/ui/Alerta";
import { Logo } from "@/components/ui/Icones";
import { consultarSaude } from "@/lib/saude";
import { obterUsuario } from "@/lib/sessao";

export const metadata: Metadata = { title: "Entrar | Campo Conectado" };

const AVISO_SAUDE = {
  "banco-indisponivel": "Banco de dados indisponível.",
  "fora-do-ar": "API fora do ar.",
} as const;

/** Medidor grande do painel verde, o mesmo desenho do ícone. */
function Medidor() {
  return (
    <svg
      viewBox="0 0 340 200"
      aria-hidden="true"
      className="w-full max-w-[340px] opacity-90"
    >
      <path
        d="M30 170V160a140 140 0 0 1 280 0v10"
        fill="none"
        stroke="#fff"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d="M170 36v34M68 80l22 22M272 80l-22 22"
        stroke="#fff"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path d="M248 74 176 168l-18-16z" fill="#e8a317" />
      <circle cx="167" cy="160" r="20" fill="#fff" />
    </svg>
  );
}

export default async function Login() {
  const usuario = await obterUsuario();
  if (usuario) redirect("/");
  const saude = await consultarSaude();

  return (
    <main className="flex flex-1 flex-wrap">
      <div className="flex flex-[1_1_520px] flex-col justify-between gap-12 bg-[#2d6a30] px-8 py-12 text-white sm:px-16 sm:py-14">
        <div className="flex items-center gap-3 text-lg font-bold">
          <Logo tamanho={36} invertido />
          Campo Conectado
        </div>
        <Medidor />
      </div>
      <div className="flex flex-[1_1_440px] items-center justify-center px-8 py-12">
        <div className="flex w-full max-w-[380px] flex-col gap-5">
          <h1 className="text-[2rem] font-bold tracking-[-0.02em]">Entrar</h1>
          {saude !== "ok" && <Alerta tom="perigo">{AVISO_SAUDE[saude]}</Alerta>}
          <FormularioLogin />
        </div>
      </div>
    </main>
  );
}
