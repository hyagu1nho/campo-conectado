/** Ícones de traço simples; herdam a cor do texto. */
type Props = { className?: string };

const BASE = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function IconeSol({ className }: Props) {
  return (
    <svg {...BASE} className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export function IconeLua({ className }: Props) {
  return (
    <svg {...BASE} className={className}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

export function IconeMonitor({ className }: Props) {
  return (
    <svg {...BASE} className={className}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

export function IconeOlho({ className }: Props) {
  return (
    <svg {...BASE} className={className}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconeOlhoFechado({ className }: Props) {
  return (
    <svg {...BASE} className={className}>
      <path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.2 3.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
    </svg>
  );
}

/**
 * Marca do produto: o medidor de um ensaio em campo (mostrador com ponteiro
 * sobre a linha do chão). Cores fixas da marca, iguais nos dois temas; o
 * mesmo desenho está em app/icon.svg (aba do navegador) e no ícone do app.
 */
export function Logo({
  className,
  tamanho = 28,
  invertido = false,
}: Props & { tamanho?: number; invertido?: boolean }) {
  // Invertido: fundo branco e traço verde, para usar sobre o verde da marca.
  const fundo = invertido ? "#fff" : "#2d6a30";
  const traco = invertido ? "#2d6a30" : "#fff";
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
    >
      <rect width="64" height="64" rx="15" fill={fundo} />
      <g fill="none" stroke={traco} strokeLinecap="round">
        <path
          strokeWidth="2.6"
          d="M15.9 38.6V36.8a16.15 16.15 0 0 1 32.3 0v1.8"
        />
        <path
          strokeWidth="2.4"
          d="M32.05 22.1v4.3M20.2 27.2l2.3 2.4M43.9 27.2l-2.3 2.4"
        />
        <path strokeWidth="2.2" d="M14 41.4h36.1" />
      </g>
      <g fill={traco}>
        <path
          d="M40.7 27.6 33.2 37.3l-2.3-2.2z"
          stroke={traco}
          strokeWidth="0.6"
          strokeLinejoin="round"
        />
        <circle cx="32.05" cy="36.1" r="2.9" />
      </g>
    </svg>
  );
}
