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

function Badge({ transacao }: { transacao: Transacao }) {
  const quitado = transacao.status === "quitado";
  const rotulo = quitado ? "Quitado" : "A vencer";
  const cor = quitado
    ? "border-accent/40 bg-accent/10 text-accent"
    : "border-negative/40 bg-negative/10 text-negative";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${cor}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {rotulo}
    </span>
  );
}

export function TransacaoItem({
  transacao,
  aoAlternarStatus,
}: {
  transacao: Transacao;
  aoAlternarStatus: (transacao: Transacao) => void;
}) {
  const quitado = transacao.status === "quitado";
  const numeroParcela = transacao.parcela_atual ?? 1;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="borda-sutil flex items-center gap-3 rounded-[20px] bg-surface px-3.5 py-3.5"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-accent/25 bg-accent/10 font-mono text-sm font-semibold text-accent"
        aria-hidden
      >
        {numeroParcela}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={`truncate text-[15px] ${quitado ? "text-muted line-through" : "text-ink"}`}>
            {transacao.titulo}
          </p>
          <Badge transacao={transacao} />
        </div>
        <p className="mt-0.5 truncate text-xs text-muted">
          {transacao.pessoa ? `${transacao.pessoa.nome} · ` : ""}
          {transacao.parcela_total
            ? `parcela ${numeroParcela}/${transacao.parcela_total}`
            : "parcela única"}
        </p>
        <p
          className={`numeros-tabulares mt-1 font-mono text-base ${
            quitado ? "text-muted" : COR_VALOR[transacao.tipo]
          }`}
        >
          {formatarMoeda(transacao.valor)}
        </p>
      </div>

      <motion.button
        type="button"
        onClick={() => aoAlternarStatus(transacao)}
        whileTap={{ scale: 0.85 }}
        aria-label={quitado ? "Marcar como pendente" : ROTULO_ACAO[transacao.tipo]}
        aria-pressed={quitado}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
          quitado ? COR_MARCADOR_PREENCHIDO[transacao.tipo] : COR_MARCADOR[transacao.tipo]
        }`}
      >
        {quitado && (
          <motion.svg
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            viewBox="0 0 12 12"
            className="h-3.5 w-3.5 fill-none stroke-on-accent stroke-2"
          >
            <path d="M2 6l2.5 2.5L10 3" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        )}
      </motion.button>
    </motion.li>
  );
}
