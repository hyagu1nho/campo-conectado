import Selo, { type TomSelo } from "@/components/ui/Selo";
import { ROTULO_SITUACAO, Situacao } from "@/lib/rotulos";

const TONS: Record<Situacao, TomSelo> = {
  PLANEJADO: "neutro",
  EM_ANDAMENTO: "info",
  ENVIADO: "aviso",
  DEVOLVIDO: "perigo",
  CONCLUIDO: "sucesso",
};

export default function SeloSituacao({ situacao }: { situacao: Situacao }) {
  return <Selo tom={TONS[situacao]}>{ROTULO_SITUACAO[situacao]}</Selo>;
}
