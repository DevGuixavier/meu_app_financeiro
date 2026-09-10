import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { rotuloMes } from "@/lib/mes";
import { formatarMoeda } from "@/lib/moeda";
import { cn } from "@/lib/utils";

// Mesmas marcas do resto do app (TransacaoItem, gráficos): o valor de "a
// pagar" é vermelho e o de "a receber" é verde em qualquer tela onde apareça.
const COR_POR_TIPO = {
  despesa: "text-foreground",
  a_pagar: "text-[var(--chart-2)]",
  a_receber: "text-[var(--chart-3)]",
} as const;

const PONTO_POR_TIPO = {
  despesa: "var(--chart-1)",
  a_pagar: "var(--chart-2)",
  a_receber: "var(--chart-3)",
} as const;

const ROTULO_POR_TIPO = {
  despesa: "Total de gastos",
  a_pagar: "Total a pagar",
  a_receber: "Total a receber",
} as const;

/** Cruz de 1px nas interseções da grade. Detalhe pequeno e proposital: é o
 * que faz a composição ler como desenhada em cima de um sistema em vez de
 * três divs empilhadas. */
function MarcaGrade({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("pointer-events-none absolute size-3", className)}>
      <span className="bg-foreground/20 absolute top-1/2 left-1/2 h-px w-3 -translate-x-1/2 -translate-y-1/2" />
      <span className="bg-foreground/20 absolute top-1/2 left-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2" />
    </span>
  );
}

export function Header({
  chaveMes,
  total,
  tipoAtivo,
  quantidade,
  aoNavegar,
}: {
  chaveMes: string;
  total: number;
  tipoAtivo: keyof typeof COR_POR_TIPO;
  quantidade: number;
  aoNavegar: (deslocamento: -1 | 1) => void;
}) {
  return (
    // Full-bleed de propósito, sem borda e sem card: o hero precisa romper a
    // pilha de caixas de peso igual, senão a tela inteira tem o mesmo ritmo.
    <header className="aura grade-tecnica relative overflow-hidden px-5 pt-7 pb-8 md:px-6">
      {/* Nas faixas de padding do próprio header — área que o fluxo normal
          nunca ocupa, então nunca colide com rótulo, número ou contagem. */}
      <MarcaGrade className="top-2 right-2" />
      <MarcaGrade className="right-2 bottom-2" />
      <MarcaGrade className="top-2 right-[140px] hidden lg:block" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => aoNavegar(-1)}
            aria-label="Mês anterior"
            className="text-muted-foreground hover:text-foreground -ml-1.5 flex size-7 items-center justify-center rounded-full transition-colors active:scale-90 [&_svg]:size-4"
          >
            <MdChevronLeft />
          </button>
          <span className="rotulo-hud text-muted-foreground">{rotuloMes(chaveMes)}</span>
          <button
            type="button"
            onClick={() => aoNavegar(1)}
            aria-label="Próximo mês"
            className="text-muted-foreground hover:text-foreground flex size-7 items-center justify-center rounded-full transition-colors active:scale-90 [&_svg]:size-4"
          >
            <MdChevronRight />
          </button>
        </div>

        <p className="text-muted-foreground numeros-tabulares shrink-0 pt-1 font-mono text-[11px]">
          {quantidade} {quantidade === 1 ? "lançamento" : "lançamentos"}
        </p>
      </div>

      <div className="mt-7 flex items-center gap-2">
        <span
          aria-hidden
          className="size-1.5 shrink-0 rounded-full"
          style={{ background: PONTO_POR_TIPO[tipoAtivo] }}
        />
        <p className="rotulo-hud text-muted-foreground">{ROTULO_POR_TIPO[tipoAtivo]}</p>
      </div>

      {/* Grande e leve, não grande e bold — o contraste vem do tamanho e do
          tracking apertado, não do peso. */}
      <p
        className={cn(
          "numeral-hero mt-2.5 truncate text-[clamp(2.75rem,13vw,4rem)]",
          COR_POR_TIPO[tipoAtivo],
        )}
      >
        {formatarMoeda(total)}
      </p>
    </header>
  );
}
