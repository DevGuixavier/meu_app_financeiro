import { rotuloMes } from "@/lib/mes";
import { formatarMoeda } from "@/lib/moeda";

const CORES_POR_TIPO = {
  despesa: "text-ink",
  a_pagar: "text-negative",
  a_receber: "text-accent",
} as const;

export function Header({
  chaveMes,
  total,
  tipoAtivo,
  aoNavegar,
}: {
  chaveMes: string;
  total: number;
  tipoAtivo: keyof typeof CORES_POR_TIPO;
  aoNavegar: (deslocamento: -1 | 1) => void;
}) {
  return (
    <header className="linha-divisoria flex flex-col gap-3 px-5 pb-5 pt-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => aoNavegar(-1)}
          aria-label="Mês anterior"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-lg text-muted"
        >
          ‹
        </button>
        <span className="font-display text-lg font-medium text-ink">{rotuloMes(chaveMes)}</span>
        <button
          type="button"
          onClick={() => aoNavegar(1)}
          aria-label="Próximo mês"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-lg text-muted"
        >
          ›
        </button>
      </div>
      <p className={`numeros-tabulares text-center font-mono text-3xl ${CORES_POR_TIPO[tipoAtivo]}`}>
        {formatarMoeda(total)}
      </p>
    </header>
  );
}
