import { MdCheck } from "react-icons/md";
import { motion } from "motion/react";
import type { Transacao } from "@/lib/types";
import { formatarMoeda } from "@/lib/moeda";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const COR_VALOR = {
  despesa: "text-foreground",
  a_pagar: "text-[var(--chart-2)]",
  a_receber: "text-[var(--chart-3)]",
} as const;

const ROTULO_ACAO = {
  despesa: "Marcar como pago",
  a_pagar: "Marcar como pago",
  a_receber: "Marcar como recebido",
} as const;

export function TransacaoItem({
  transacao,
  aoAlternarStatus,
  aoEditar,
}: {
  transacao: Transacao;
  aoAlternarStatus: (transacao: Transacao) => void;
  aoEditar: (transacao: Transacao) => void;
}) {
  const quitado = transacao.status === "quitado";
  const numeroParcela = transacao.parcela_atual ?? 1;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      onClick={() => aoEditar(transacao)}
      className="hover:bg-accent/40 flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors"
    >
      {/* O selo só mostra número quando existe parcelamento — num lançamento
          avulso, um "1" ali sugeriria uma parcela que não existe. */}
      <span
        className="text-muted-foreground bg-muted flex size-8 shrink-0 items-center justify-center rounded-md font-mono text-xs font-semibold"
        aria-hidden
      >
        {transacao.parcela_total ? (
          numeroParcela
        ) : (
          <span className="bg-muted-foreground/50 size-1.5 rounded-full" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "truncate text-[15px]",
              quitado ? "text-muted-foreground line-through" : "text-foreground",
            )}
          >
            {transacao.titulo}
          </p>
          <Badge variant={quitado ? "success" : "secondary"} className="shrink-0">
            {quitado ? "Quitado" : "A vencer"}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 truncate text-xs">
          {transacao.categoria && (
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ background: transacao.categoria.cor ?? "var(--muted-foreground)" }}
              aria-hidden
            />
          )}
          {transacao.categoria ? `${transacao.categoria.nome} · ` : ""}
          {transacao.pessoa ? `${transacao.pessoa.nome} · ` : ""}
          {transacao.parcela_total
            ? `parcela ${numeroParcela}/${transacao.parcela_total}`
            : "parcela única"}
        </p>
        <p
          className={cn(
            "numeros-tabulares mt-1 font-mono text-[17px] font-semibold tracking-tight",
            quitado ? "text-muted-foreground" : COR_VALOR[transacao.tipo],
          )}
        >
          {formatarMoeda(transacao.valor)}
        </p>
      </div>

      <motion.button
        type="button"
        onClick={(evento) => {
          // Sem isso, clicar no botão de status também dispararia o onClick
          // do <li> por baixo e abriria a edição por cima do toggle.
          evento.stopPropagation();
          aoAlternarStatus(transacao);
        }}
        whileTap={{ scale: 0.85 }}
        aria-label={quitado ? "Marcar como pendente" : ROTULO_ACAO[transacao.tipo]}
        aria-pressed={quitado}
        className={cn(
          "focus-visible:ring-ring/50 flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors outline-none focus-visible:ring-[3px]",
          quitado
            ? "border-[var(--chart-3)] bg-[var(--chart-3)] text-white"
            : "border-muted-foreground/40 hover:border-primary",
        )}
      >
        {quitado && <MdCheck className="size-4" />}
      </motion.button>
    </motion.li>
  );
}
