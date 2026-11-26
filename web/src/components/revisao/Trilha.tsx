import type { Ensaio } from "@/lib/ensaios";
import { dataHoraBrasileira } from "@/lib/rotulos";

type Etapa = {
  rotulo: string;
  estado: "feita" | "atual" | "futura";
  perigo?: boolean;
};

const ORDEM = {
  PLANEJADO: 0,
  EM_ANDAMENTO: 1,
  DEVOLVIDO: 1,
  ENVIADO: 2,
  CONCLUIDO: 3,
} as const;

/**
 * Caminho do ensaio: Planejado, Em andamento, Enviado e Concluído.
 * Devolvido ocupa o lugar de Em andamento, em vermelho, porque o ensaio
 * voltou para o analista.
 */
function etapas(ensaio: Ensaio): Etapa[] {
  const atual = ORDEM[ensaio.situacao];
  const estado = (i: number): Etapa["estado"] =>
    i < atual ? "feita" : i === atual ? "atual" : "futura";
  const enviado =
    ensaio.enviadoEm && atual >= 2
      ? `Enviado em ${dataHoraBrasileira(ensaio.enviadoEm)}`
      : "Enviado";
  const concluido = ensaio.concluidoEm
    ? `Concluído em ${dataHoraBrasileira(ensaio.concluidoEm)}`
    : "Concluído";
  return [
    { rotulo: "Planejado", estado: estado(0) },
    ensaio.situacao === "DEVOLVIDO"
      ? { rotulo: "Devolvido", estado: "atual", perigo: true }
      : { rotulo: "Em andamento", estado: estado(1) },
    { rotulo: enviado, estado: estado(2) },
    { rotulo: concluido, estado: estado(3) },
  ];
}

function Ponto({ etapa }: { etapa: Etapa }) {
  if (etapa.estado === "futura") {
    return (
      <span className="size-3 flex-none rounded-full border-2 border-borda-forte" />
    );
  }
  if (etapa.estado === "feita") {
    return <span className="size-3 flex-none rounded-full bg-primaria" />;
  }
  return (
    <span
      className={`size-3 flex-none rounded-full ring-4 ${
        etapa.perigo
          ? "bg-perigo ring-perigo-fundo"
          : "bg-atencao ring-aviso-fundo"
      }`}
    />
  );
}

export default function Trilha({ ensaio }: { ensaio: Ensaio }) {
  const lista = etapas(ensaio);
  return (
    <ol
      aria-label="Situação do ensaio"
      className="flex flex-wrap items-center gap-y-2 text-sm"
    >
      {lista.map((etapa, i) => (
        <li
          key={etapa.rotulo}
          className="flex flex-1 items-center last:flex-none"
        >
          <span
            aria-current={etapa.estado === "atual" ? "step" : undefined}
            className={`flex items-center gap-2 whitespace-nowrap ${
              etapa.estado === "atual"
                ? "font-bold"
                : etapa.estado === "futura"
                  ? "text-suave"
                  : ""
            }`}
          >
            <Ponto etapa={etapa} />
            {etapa.rotulo}
          </span>
          {i < lista.length - 1 && (
            <span
              aria-hidden="true"
              className={`mx-3 h-0.5 min-w-7 flex-1 ${
                lista[i + 1].estado === "futura" ? "bg-borda" : "bg-primaria"
              }`}
            />
          )}
        </li>
      ))}
    </ol>
  );
}
