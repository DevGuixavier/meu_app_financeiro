import { motion } from "motion/react";
import type { Transacao } from "@/lib/types";
import { formatarMoeda } from "@/lib/moeda";

const COR_VALOR = {
  despesa: "text-ink",
  a_pagar: "text-negative",
  a_receber: "text-accent",
} as const;

const COR_MARCADOR = {
  despesa: "border-muted",
  a_pagar: "border-negative",
  a_receber: "border-accent",
} as const;

const COR_MARCADOR_PREENCHIDO = {
  despesa: "border-muted bg-muted",
  a_pagar: "border-negative bg-negative",
  a_receber: "border-accent bg-accent",
} as const;

const ROTULO_ACAO = {
  despesa: "Marcar como pago",
  a_pagar: "Marcar como pago",
  a_receber: "Marcar como recebido",
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

export function TransacaoItem({
  transacao,
  aoAlternarStatus,
}: {
  transacao: Transacao;
  aoAlternarStatus: (transacao: Transacao) => void;
}) {
  const quitado = transacao.status === "quitado";

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="borda-sutil flex items-center gap-3 rounded-[20px] bg-surface px-4 py-3.5"
    >
      <motion.button
        type="button"
        onClick={() => aoAlternarStatus(transacao)}
        whileTap={{ scale: 0.85 }}
        aria-label={quitado ? "Marcar como pendente" : ROTULO_ACAO[transacao.tipo]}
        aria-pressed={quitado}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
          quitado ? COR_MARCADOR_PREENCHIDO[transacao.tipo] : COR_MARCADOR[transacao.tipo]
        }`}
      >
        {quitado && (
          <motion.svg
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            viewBox="0 0 12 12"
            className="h-3 w-3 fill-none stroke-on-accent stroke-2"
          >
            <path d="M2 6l2.5 2.5L10 3" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        )}
      </motion.button>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-base ${quitado ? "text-muted line-through" : "text-ink"}`}>
          {transacao.titulo}
        </p>
        <p className="truncate text-sm text-muted">{subtitulo(transacao)}</p>
      </div>
      <span
        className={`numeros-tabulares shrink-0 font-mono text-base ${
          quitado ? "text-muted" : COR_VALOR[transacao.tipo]
        }`}
      >
        {formatarMoeda(transacao.valor)}
      </span>
    </motion.li>
  );
}
