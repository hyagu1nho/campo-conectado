import Aviso from "@/components/Aviso";
import BotaoLink from "@/components/ui/Botao";

export default function NaoEncontrado() {
  return (
    <Aviso
      codigo="404"
      titulo="Página não encontrada"
      texto="O endereço não existe."
      acao={<BotaoLink href="/">Voltar ao início</BotaoLink>}
    />
  );
}
