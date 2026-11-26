import Alerta from "@/components/ui/Alerta";

/** Lista de mensagens de erro no topo de um formulário. */
export default function Mensagens({ mensagens }: { mensagens: string[] }) {
  if (mensagens.length === 0) return null;
  return (
    <Alerta tom="perigo" alerta>
      <ul className="flex flex-col gap-1">
        {mensagens.map((mensagem) => (
          <li key={mensagem}>{mensagem}</li>
        ))}
      </ul>
    </Alerta>
  );
}
