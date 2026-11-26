"use client";

import { useActionState } from "react";
import { entrar } from "@/app/login/acoes";
import BotaoEnviar from "@/components/BotaoEnviar";
import Campo, { ESTILO_CONTROLE } from "@/components/Campo";
import CampoSenha from "@/components/CampoSenha";
import Alerta from "@/components/ui/Alerta";
import { LOGIN_VAZIO } from "@/lib/formulario-login";

export default function FormularioLogin() {
  const [estado, acaoDoFormulario] = useActionState(entrar, LOGIN_VAZIO);

  return (
    <form action={acaoDoFormulario} className="flex flex-col gap-4">
      {estado.mensagem && (
        <Alerta tom="perigo" alerta>
          {estado.mensagem}
        </Alerta>
      )}
      <Campo rotulo="E-mail">
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          defaultValue={estado.email}
          className={ESTILO_CONTROLE}
        />
      </Campo>
      <Campo rotulo="Senha">
        <CampoSenha name="senha" autoComplete="current-password" />
      </Campo>
      <BotaoEnviar>Entrar</BotaoEnviar>
    </form>
  );
}
