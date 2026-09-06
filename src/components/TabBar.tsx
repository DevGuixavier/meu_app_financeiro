import type { ReactElement } from "react";
import { motion } from "motion/react";
import type { Aba } from "@/lib/types";

function IconGastos({ ativo }: { ativo: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={ativo ? 2 : 1.6} className="h-6 w-6">
      <rect x="3.5" y="6.5" width="17" height="13" rx="3" stroke="currentColor" />
      <path d="M3.5 10.5h17" stroke="currentColor" strokeLinecap="round" />
      <path d="M7 6.5V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.5" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

function IconDevo({ ativo }: { ativo: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={ativo ? 2 : 1.6} className="h-6 w-6">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" />
      <path d="M12 8v8M9 12.5l3 3.2 3-3.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconMeDevem({ ativo }: { ativo: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={ativo ? 2 : 1.6} className="h-6 w-6">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" />
      <path d="M12 16V8M9 11.5l3-3.2 3 3.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconResumo({ ativo }: { ativo: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={ativo ? 2 : 1.6} className="h-6 w-6">
      <path d="M4 20V13M11 20V4M18 20v-7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ABAS: { valor: Aba; rotulo: string; Icone: (props: { ativo: boolean }) => ReactElement }[] = [
  { valor: "despesa", rotulo: "Gastos", Icone: IconGastos },
  { valor: "a_pagar", rotulo: "Devo", Icone: IconDevo },
  { valor: "a_receber", rotulo: "Me devem", Icone: IconMeDevem },
  { valor: "resumo", rotulo: "Resumo", Icone: IconResumo },
];

export function TabBar({
  abaAtiva,
  aoSelecionar,
}: {
  abaAtiva: Aba;
  aoSelecionar: (aba: Aba) => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 mx-auto flex w-full max-w-[420px] justify-around border-t border-white/10 bg-surface/80 pb-[calc(env(safe-area-inset-bottom)+0.375rem)] pt-1.5 backdrop-blur-xl md:hidden">
      {ABAS.map(({ valor, rotulo, Icone }) => {
        const ativo = abaAtiva === valor;
        return (
          <motion.button
            key={valor}
            type="button"
            onClick={() => aoSelecionar(valor)}
            whileTap={{ scale: 0.88 }}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1 ${
              ativo ? "text-accent" : "text-muted"
            }`}
          >
            {ativo && (
              <motion.div
                layoutId="indicador-aba"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                className="absolute inset-0 -z-10 rounded-2xl bg-accent/10"
              />
            )}
            <Icone ativo={ativo} />
            <span className={`text-[11px] ${ativo ? "font-medium" : ""}`}>{rotulo}</span>
          </motion.button>
        );
      })}
    </nav>
  );
}
