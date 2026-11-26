import Secao from "@/components/ui/Secao";
import Selo, { type TomSelo } from "@/components/ui/Selo";
import type { Pagina } from "@/lib/api";
import type { Falha, Severidade } from "@/lib/revisao";
import { dataHoraBrasileira, numero, ROTULO_SEVERIDADE } from "@/lib/rotulos";

const TOM: Record<Severidade, TomSelo> = {
  CRITICA: "perigo",
  MAIOR: "aviso",
  MENOR: "neutro",
};

/** Componente, horímetro e momento, separados por vírgula. */
function detalhes(falha: Falha): string {
  const partes: string[] = [];
  if (falha.componente) partes.push(falha.componente);
  if (falha.horimetro !== null) {
    partes.push(`horímetro ${numero(falha.horimetro, "h")}`);
  }
  partes.push(dataHoraBrasileira(falha.ocorridaEm));
  return partes.join(", ");
}

export default function SecaoFalhas({ pagina }: { pagina: Pagina<Falha> }) {
  return (
    <Secao titulo="Falhas" contagem={pagina.total}>
      {pagina.dados.length === 0 ? (
        <p className="text-sm text-suave">Nenhuma falha.</p>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {pagina.dados.map((falha) => (
            <li key={falha.id} className="flex items-start gap-3.5">
              <span className="mt-0.5">
                <Selo tom={TOM[falha.severidade]}>
                  {ROTULO_SEVERIDADE[falha.severidade]}
                </Selo>
              </span>
              <div className="min-w-0">
                <p className="font-semibold whitespace-pre-line">
                  {falha.descricao}
                </p>
                <p className="text-sm text-suave">{detalhes(falha)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Secao>
  );
}
