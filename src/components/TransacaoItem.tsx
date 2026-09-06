import type { Transacao } from "@/lib/types";
import { formatarMoeda } from "@/lib/moeda";

const COR_VALOR = {
  despesa: "text-ink",
  a_pagar: "text-negative",
  a_receber: "text-accent",
} as const;

const COR_MARCADOR = {
  despesa: "bg-muted",
  a_pagar: "bg-negative",
  a_receber: "bg-accent",
} as const;

function subtitulo(transacao: Transacao): string {
  const partes: string[] = [];
  if (transacao.pessoa) partes.push(transacao.pessoa.nome);
  if (transacao.parcela_total) {
    partes.push(`${transacao.parcela_atual}/${transacao.parcela_total}`);
  } else {
    partes.push(transacao.status === "quitado" ? "quitado" : "pendente");
  }
  return partes.join(", ");
}

export function TransacaoItem({ transacao }: { transacao: Transacao }) {
  return (
    <li className="borda-sutil flex items-center gap-3 rounded-2xl bg-surface px-4 py-3.5">
      <span className={`h-2 w-2 shrink-0 rounded-full ${COR_MARCADOR[transacao.tipo]}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base text-ink">{transacao.titulo}</p>
        <p className="truncate text-sm text-muted">{subtitulo(transacao)}</p>
      </div>
      <span className={`numeros-tabulares shrink-0 font-mono text-base ${COR_VALOR[transacao.tipo]}`}>
        {formatarMoeda(transacao.valor)}
      </span>
    </li>
  );
}
