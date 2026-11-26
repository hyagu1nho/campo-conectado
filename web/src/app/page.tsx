import { redirect } from "next/navigation";
import { obterUsuario } from "@/lib/sessao";

/** O início do engenheiro é o quadro de ensaios. */
export default async function Inicio() {
  const usuario = await obterUsuario();
  if (!usuario) redirect("/login");
  redirect(usuario.perfil === "ENGENHEIRO" ? "/ensaios" : "/acesso-negado");
}
