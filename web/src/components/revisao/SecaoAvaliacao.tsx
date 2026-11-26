import Secao from "@/components/ui/Secao";
import Selo, { type TomSelo } from "@/components/ui/Selo";
import { Cabecalho, Linha, Tabela, Td, Th } from "@/components/ui/Tabela";
import type { Avaliacao } from "@/lib/revisao";
import { numero, ROTULO_PARECER, ROTULO_PARECER_FINAL } from "@/lib/rotulos";

const TOM_PARECER: Record<keyof typeof ROTULO_PARECER, TomSelo> = {
  CONFORME: "sucesso",
  CONFORME_COM_RESSALVA: "aviso",
  NAO_CONFORME: "perigo",
};

const TOM_FINAL: Record<keyof typeof ROTULO_PARECER_FINAL, TomSelo> = {
  APROVADA: "sucesso",
  APROVADA_COM_RESSALVA: "aviso",
  REPROVADA: "perigo",
};

function Vazio() {
  return <span className="text-suave">-</span>;
}

/** Condições do ensaio numa linha só, com o que o analista informou. */
function condicoes(avaliacao: Avaliacao): string[] {
  const partes: string[] = [];
  if (avaliacao.velocidade !== null) {
    partes.push(numero(avaliacao.velocidade, "km/h"));
  }
  if (avaliacao.terreno)
    partes.push(`terreno ${avaliacao.terreno.toLowerCase()}`);
  if (avaliacao.horimetroInicial !== null) {
    partes.push(
      `horímetro de ${numero(avaliacao.horimetroInicial, "h")} a ${numero(avaliacao.horimetroFinal, "h")}`,
    );
  }
  if (avaliacao.capacidadeOperacional !== null) {
    partes.push(
      `${numero(avaliacao.capacidadeOperacional, "ha/h")} contra ${numero(avaliacao.capacidadeConcorrente, "ha/h")} da concorrente`,
    );
  }
  return partes;
}

/** Pareceres por critério e o parecer final, como o analista registrou. */
export default function SecaoAvaliacao({
  avaliacao,
}: {
  avaliacao: Avaliacao;
}) {
  const partes = condicoes(avaliacao);
  return (
    <Secao
      titulo="Pareceres"
      contagem={`${avaliacao.progresso.avaliados} de ${avaliacao.progresso.total} critérios`}
    >
      <Tabela semBorda>
        <Cabecalho>
          <Th>Critério</Th>
          <Th>Parecer</Th>
          <Th>Justificativa</Th>
        </Cabecalho>
        <tbody>
          {avaliacao.criterios.map((c) => (
            <Linha key={c.criterio}>
              <Td className="w-[38%]">{c.rotulo}</Td>
              <Td semQuebra>
                {c.parecer ? (
                  <Selo tom={TOM_PARECER[c.parecer]}>
                    {ROTULO_PARECER[c.parecer]}
                  </Selo>
                ) : (
                  <Vazio />
                )}
              </Td>
              <Td>{c.justificativa ?? <Vazio />}</Td>
            </Linha>
          ))}
          <Linha>
            <Td className="font-bold">Parecer final</Td>
            <Td semQuebra>
              {avaliacao.parecerFinal ? (
                <Selo tom={TOM_FINAL[avaliacao.parecerFinal]}>
                  {ROTULO_PARECER_FINAL[avaliacao.parecerFinal]}
                </Selo>
              ) : (
                <Vazio />
              )}
            </Td>
            <Td>{avaliacao.justificativaFinal ?? <Vazio />}</Td>
          </Linha>
        </tbody>
      </Tabela>
      {partes.length > 0 && (
        <p className="text-sm text-suave">Condições: {partes.join(", ")}.</p>
      )}
    </Secao>
  );
}
