import Link from "next/link";
import {
  estiloBotao,
  type TamanhoBotao,
  type VarianteBotao,
} from "@/components/ui/estilos";

/** Link com a aparência de botão. Para enviar formulários, use BotaoEnviar. */
export default function BotaoLink({
  href,
  variante = "primaria",
  tamanho = "md",
  children,
}: {
  href: string;
  variante?: VarianteBotao;
  tamanho?: TamanhoBotao;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={estiloBotao(variante, tamanho)}>
      {children}
    </Link>
  );
}
