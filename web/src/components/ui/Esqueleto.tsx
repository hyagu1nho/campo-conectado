import Pagina from "@/components/ui/Pagina";

export function Esqueleto({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-borda-fina ${className}`}
    />
  );
}

/** Carregando de páginas de lista: título, filtros e conteúdo. */
export function CarregandoLista() {
  return (
    <Pagina ocupado>
      <Esqueleto className="h-10 w-56" />
      <Esqueleto className="h-10 w-96 max-w-full" />
      <Esqueleto className="h-64" />
    </Pagina>
  );
}
