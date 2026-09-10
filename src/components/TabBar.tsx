import { MdAccountBalanceWallet, MdBarChart, MdCallMade, MdCallReceived } from "react-icons/md";
import type { IconType } from "react-icons";
import { motion } from "motion/react";
import type { Aba } from "@/lib/types";
import { cn } from "@/lib/utils";

const ABAS: { valor: Aba; rotulo: string; Icone: IconType }[] = [
  { valor: "despesa", rotulo: "Gastos", Icone: MdAccountBalanceWallet },
  { valor: "a_pagar", rotulo: "A pagar", Icone: MdCallMade },
  { valor: "a_receber", rotulo: "A receber", Icone: MdCallReceived },
  { valor: "resumo", rotulo: "Resumo", Icone: MdBarChart },
];

export function TabBar({
  abaAtiva,
  aoSelecionar,
}: {
  abaAtiva: Aba;
  aoSelecionar: (aba: Aba) => void;
}) {
  return (
    <nav className="bg-background/80 fixed inset-x-0 bottom-0 mx-auto flex w-full max-w-[420px] justify-around border-t pt-1.5 pb-[calc(env(safe-area-inset-bottom)+0.375rem)] backdrop-blur-xl md:hidden">
      {ABAS.map(({ valor, rotulo, Icone }) => {
        const ativo = abaAtiva === valor;
        return (
          <motion.button
            key={valor}
            type="button"
            onClick={() => aoSelecionar(valor)}
            whileTap={{ scale: 0.88 }}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "focus-visible:ring-ring/50 relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 outline-none focus-visible:ring-[3px]",
              ativo ? "text-primary" : "text-muted-foreground",
            )}
          >
            {ativo && (
              <motion.div
                layoutId="indicador-aba"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                className="bg-accent absolute inset-0 -z-10 rounded-xl"
              />
            )}
            <Icone className="size-5" />
            <span className={cn("text-[10px] tracking-wide", ativo && "font-semibold")}>
              {rotulo}
            </span>
          </motion.button>
        );
      })}
    </nav>
  );
}
