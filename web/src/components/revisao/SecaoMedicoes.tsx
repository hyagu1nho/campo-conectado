import Secao from "@/components/ui/Secao";
import { Cabecalho, Linha, Tabela, Td, Th } from "@/components/ui/Tabela";
import type { Pagina } from "@/lib/api";
import type { Grandeza, Medicao } from "@/lib/revisao";
import { dataHoraBrasileira, numero, ROTULO_GRANDEZA } from "@/lib/rotulos";

/** Resumo por grandeza e, sob demanda, a lista completa. */
export default function SecaoMedicoes({ pagina }: { pagina: Pagina<Medicao> }) {
  const medicoes = pagina.dados;
  const resumo = (Object.keys(ROTULO_GRANDEZA) as Grandeza[]).map(
    (grandeza) => {
      const daGrandeza = medicoes.filter((m) => m.grandeza === grandeza);
      const ultima = daGrandeza.reduce<string | null>(
        (maisNova, m) =>
          !maisNova || m.registradaEm > maisNova ? m.registradaEm : maisNova,
        null,
      );
      return {
        grandeza,
        quantidade: daGrandeza.length,
        maxima: daGrandeza.length
          ? Math.max(...daGrandeza.map((m) => m.valor))
          : null,
        ultima,
      };
    },
  );

  return (
    <Secao titulo="Medições" contagem={pagina.total}>
      <Tabela semBorda>
        <Cabecalho>
          <Th>Grandeza</Th>
          <Th direita>Registros</Th>
          <Th direita>Maior valor</Th>
          <Th direita>Último registro</Th>
        </Cabecalho>
        <tbody>
          {resumo.map(({ grandeza, quantidade, maxima, ultima }) => (
            <Linha key={grandeza}>
              <Td>{ROTULO_GRANDEZA[grandeza].rotulo}</Td>
              <Td
                direita
                className={
                  quantidade === 0 ? "font-semibold text-aviso-texto" : ""
                }
              >
                {quantidade === 0 ? "Falta" : quantidade}
              </Td>
              <Td direita semQuebra>
                {numero(maxima, ROTULO_GRANDEZA[grandeza].unidade)}
              </Td>
              <Td direita semQuebra className="text-suave">
                {ultima ? dataHoraBrasileira(ultima) : "-"}
              </Td>
            </Linha>
          ))}
        </tbody>
      </Tabela>

      {medicoes.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-primaria">
            {medicoes.length === 1
              ? "Ver a medição"
              : `Ver as ${medicoes.length} medições`}
            {pagina.total > medicoes.length && ` de ${pagina.total}`}
          </summary>
          <div className="mt-3">
            <Tabela semBorda>
              <Cabecalho>
                <Th>Quando</Th>
                <Th>Grandeza</Th>
                <Th direita>Valor</Th>
                <Th direita>Horímetro</Th>
                <Th>Observação</Th>
              </Cabecalho>
              <tbody>
                {medicoes.map((m) => (
                  <Linha key={m.id}>
                    <Td semQuebra>{dataHoraBrasileira(m.registradaEm)}</Td>
                    <Td>{ROTULO_GRANDEZA[m.grandeza].rotulo}</Td>
                    <Td direita semQuebra>
                      {numero(m.valor, ROTULO_GRANDEZA[m.grandeza].unidade)}
                    </Td>
                    <Td direita semQuebra>
                      {numero(m.horimetro, "h")}
                    </Td>
                    <Td>{m.observacao ?? ""}</Td>
                  </Linha>
                ))}
              </tbody>
            </Tabela>
          </div>
        </details>
      )}
    </Secao>
  );
}
