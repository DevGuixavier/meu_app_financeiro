import { rotuloMes } from "@/lib/mes";
import { formatarMoeda } from "@/lib/moeda";

const CORES_POR_TIPO = {
  despesa: "text-graphite",
  a_pagar: "text-rust",
  a_receber: "text-moss",
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
    <header className="linha-pauta flex flex-col gap-3 px-5 pb-4 pt-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => aoNavegar(-1)}
          aria-label="Mês anterior"
          className="px-2 py-1 text-lg text-graphite"
        >
          ‹
        </button>
        <span className="font-display text-lg text-ink">{rotuloMes(chaveMes)}</span>
        <button
          type="button"
          onClick={() => aoNavegar(1)}
          aria-label="Próximo mês"
          className="px-2 py-1 text-lg text-graphite"
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
