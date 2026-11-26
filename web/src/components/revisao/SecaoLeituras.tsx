import Secao from "@/components/ui/Secao";
import type { Avaliacao } from "@/lib/revisao";
import { numero } from "@/lib/rotulos";

type Temperatura = Avaliacao["evidencias"]["temperaturaMotor"];

/**
 * Régua de uma temperatura: a barra vai até a maior medição e o traço
 * escuro marca o limite da ficha. Acima do limite, tudo em vermelho.
 */
function Regua({ rotulo, dado }: { rotulo: string; dado: Temperatura }) {
  const { maxima, limite, excedeu } = dado;
  const escala = Math.max(maxima ?? 0, limite ?? 0) * 1.2 || 1;
  const pct = (v: number) => `${Math.min(100, (v / escala) * 100)}%`;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-1 text-sm sm:grid-cols-[13rem_5.5rem_minmax(0,1fr)_6.5rem]">
      <span>{rotulo}</span>
      <b className={`text-right sm:text-left ${excedeu ? "text-perigo" : ""}`}>
        {numero(maxima, "°C")}
      </b>
      <div className="relative col-span-2 h-2.5 rounded-sm bg-borda-fina sm:col-span-1">
        {maxima !== null && (
          <div
            className={`absolute inset-y-0 left-0 rounded-sm ${excedeu ? "bg-perigo" : "bg-primaria"}`}
            style={{ width: pct(maxima) }}
          />
        )}
        {limite !== null && (
          <div
            className="absolute -inset-y-1.5 w-0.5 bg-texto"
            style={{ left: pct(limite) }}
          />
        )}
      </div>
      <span className="col-span-2 text-suave sm:col-span-1">
        limite {numero(limite, "°C")}
      </span>
    </div>
  );
}

function Dado({
  rotulo,
  children,
}: {
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-suave">{rotulo}</div>
      <b className="font-semibold">{children}</b>
    </div>
  );
}

function Comparacao({ diferenca }: { diferenca: number | null }) {
  if (diferenca === null) return <>-</>;
  const valor = Math.abs(diferenca).toLocaleString("pt-BR");
  if (diferenca > 0) {
    return (
      <span className="text-sucesso-texto">{valor}% mais área por hora</span>
    );
  }
  if (diferenca < 0) {
    return <span className="text-perigo">{valor}% menos área por hora</span>;
  }
  return <>mesma área por hora</>;
}

/** Evidências calculadas pela API para a Pulverização. */
export default function SecaoLeituras({ avaliacao }: { avaliacao: Avaliacao }) {
  const { evidencias } = avaliacao;
  const falhas = evidencias.falhasPorSeveridade;
  return (
    <Secao titulo="Leituras do ensaio">
      <Regua rotulo="Temperatura do motor" dado={evidencias.temperaturaMotor} />
      <Regua
        rotulo="Temperatura do hidráulico"
        dado={evidencias.temperaturaHidraulico}
      />
      <div className="grid gap-4 border-t border-borda-fina pt-3.5 text-sm sm:grid-cols-3">
        <Dado rotulo="Falhas">
          crítica {falhas.CRITICA}, maior {falhas.MAIOR}, menor {falhas.MENOR}
        </Dado>
        <Dado rotulo="Horas trabalhadas">
          {numero(evidencias.horasTrabalhadas, "h")}
        </Dado>
        <Dado rotulo="Comparada com a concorrente">
          <Comparacao diferenca={evidencias.diferencaConcorrente} />
        </Dado>
      </div>
    </Secao>
  );
}
