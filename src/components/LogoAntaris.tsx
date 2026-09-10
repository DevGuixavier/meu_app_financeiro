import { cn } from "@/lib/utils";

/** Selo da marca.
 *
 * O arquivo é uma silhueta preta em fundo transparente, usada como MÁSCARA
 * CSS — não como imagem. A cor vem do `background-color` do elemento, então
 * o mesmo arquivo serve preto no tema claro e claro no tema escuro, sem
 * precisar de duas variantes (e sem o logo sumir num dos temas).
 *
 * A cor padrão é `bg-foreground` (preto no claro, quase branco no escuro).
 * Para pintar de outra cor é só passar uma classe de fundo no className,
 * ex.: <LogoAntaris className="bg-brand" />.
 */
export function LogoAntaris({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("bg-foreground inline-block shrink-0", className)}
      style={{
        maskImage: "url(/images/logo-antaris-mono.png)",
        WebkitMaskImage: "url(/images/logo-antaris-mono.png)",
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    />
  );
}
