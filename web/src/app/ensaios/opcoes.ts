import "server-only";
import type { Opcao } from "@/components/FormularioEnsaio";
import { opcoesDeAreas } from "@/lib/areas";
import { listarAnalistas } from "@/lib/ensaios";
import { opcoesDeMaquinas } from "@/lib/maquinas";
import { ROTULO_LINHA } from "@/lib/rotulos";

/** As três listas do formulário de ensaio, buscadas em paralelo. */
export async function opcoesDoFormulario(token: string): Promise<{
  maquinas: Opcao[];
  areas: Opcao[];
  analistas: Opcao[];
}> {
  const [maquinas, areas, analistas] = await Promise.all([
    opcoesDeMaquinas(token),
    opcoesDeAreas(token),
    listarAnalistas(token),
  ]);
  return {
    maquinas: maquinas.map((m) => ({
      id: m.id,
      rotulo: `${m.modelo}, ${m.numeroSerie}, ${ROTULO_LINHA[m.linha]}`,
    })),
    areas: areas.map((a) => ({ id: a.id, rotulo: a.nome })),
    analistas: analistas.map((a) => ({ id: a.id, rotulo: a.nome })),
  };
}
