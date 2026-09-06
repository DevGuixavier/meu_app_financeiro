import type { Transacao } from "@/lib/types";
import { formatarMoeda } from "@/lib/moeda";

const COR_VALOR = {
  despesa: "text-graphite",
  a_pagar: "text-rust",
  a_receber: "text-moss",
} as const;

const COR_MARCADOR = {
  despesa: "bg-graphite",
  a_pagar: "bg-rust",
  a_receber: "bg-moss",
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
    <li className="linha-pauta flex items-center gap-3 px-5 py-4">
      <span className={`h-2 w-2 shrink-0 rounded-full ${COR_MARCADOR[transacao.tipo]}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base text-ink">{transacao.titulo}</p>
        <p className="truncate text-sm text-graphite">{subtitulo(transacao)}</p>
      </div>
      <span className={`numeros-tabulares shrink-0 font-mono text-base ${COR_VALOR[transacao.tipo]}`}>
        {formatarMoeda(transacao.valor)}
      </span>
    </li>
  );
}
