import { ESTILO_TD, ESTILO_TH } from "@/components/ui/estilos";

/** Tabela em cartão, com rolagem horizontal em telas estreitas. */
export function Tabela({
  children,
  semBorda = false,
}: {
  children: React.ReactNode;
  semBorda?: boolean;
}) {
  return (
    <div
      className={`overflow-x-auto ${semBorda ? "[&_td:first-child]:pl-0 [&_td:last-child]:pr-0 [&_th:first-child]:pl-0 [&_th:last-child]:pr-0" : "rounded-lg border border-borda bg-superficie"}`}
    >
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function Cabecalho({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({
  children,
  direita = false,
}: {
  children: React.ReactNode;
  direita?: boolean;
}) {
  return (
    <th scope="col" className={`${ESTILO_TH} ${direita ? "text-right" : ""}`}>
      {children}
    </th>
  );
}

export function Linha({ children }: { children: React.ReactNode }) {
  return (
    <tr className="transition-colors hover:bg-superficie-2 [&:last-child>td]:border-b-0">
      {children}
    </tr>
  );
}

export function Td({
  children,
  direita = false,
  semQuebra = false,
  className = "",
}: {
  children?: React.ReactNode;
  direita?: boolean;
  semQuebra?: boolean;
  className?: string;
}) {
  return (
    <td
      className={`${ESTILO_TD} ${direita ? "text-right" : ""} ${semQuebra ? "whitespace-nowrap" : ""} ${className}`}
    >
      {children}
    </td>
  );
}
