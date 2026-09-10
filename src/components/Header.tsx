import { rotuloMes } from "@/lib/mes";
import { formatarMoeda } from "@/lib/moeda";

const CORES_POR_TIPO = {
  despesa: "text-foreground",
  a_pagar: "text-destructive",
  a_receber: "text-primary",
} as const;

const ROTULO_POR_TIPO = {
  despesa: "Total de gastos",
  a_pagar: "Total a pagar",
  a_receber: "Total a receber",
} as const;

export function Header({
  chaveMes,
  total,
  tipoAtivo,
  quantidade,
  aoNavegar,
}: {
  chaveMes: string;
  total: number;
  tipoAtivo: keyof typeof CORES_POR_TIPO;
  quantidade: number;
  aoNavegar: (deslocamento: -1 | 1) => void;
}) {
  return (
    <header className="px-4 pt-6 pb-2">
      <div className="border rounded-lg bg-card px-4 py-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => aoNavegar(-1)}
            aria-label="Mês anterior"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--border)] text-lg text-muted-foreground transition-transform active:scale-90"
          >
            ‹
          </button>
          <span className="rotulo-hud text-muted-foreground">{rotuloMes(chaveMes)}</span>
          <button
            type="button"
            onClick={() => aoNavegar(1)}
            aria-label="Próximo mês"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--border)] text-lg text-muted-foreground transition-transform active:scale-90"
          >
            ›
          </button>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="rotulo-hud text-muted-foreground">{ROTULO_POR_TIPO[tipoAtivo]}</p>
            <p
              className={`numeros-tabulares mt-1.5 truncate font-mono text-[28px] leading-none font-semibold ${CORES_POR_TIPO[tipoAtivo]}`}
            >
              {formatarMoeda(total)}
            </p>
          </div>
          <p className="shrink-0 text-xs text-muted-foreground">
            {quantidade} {quantidade === 1 ? "lançamento" : "lançamentos"}
          </p>
        </div>
      </div>
    </header>
  );
}
