import type { ReactElement } from "react";
import type { Aba } from "@/lib/types";

function IconGastos() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.4} className="h-[18px] w-[18px]">
      <rect x="3.5" y="6.5" width="17" height="13" rx="3" stroke="currentColor" />
      <path d="M3.5 10.5h17" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

function IconAPagar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.4} className="h-[18px] w-[18px]">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" />
      <path d="M12 8v8M9 12.5l3 3.2 3-3.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconAReceber() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.4} className="h-[18px] w-[18px]">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" />
      <path d="M12 16V8M9 11.5l3-3.2 3 3.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconResumo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.4} className="h-[18px] w-[18px]">
      <path d="M4 20V13M11 20V4M18 20v-7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ITENS: { valor: Aba; rotulo: string; Icone: () => ReactElement }[] = [
  { valor: "despesa", rotulo: "Gastos", Icone: IconGastos },
  { valor: "a_pagar", rotulo: "A pagar", Icone: IconAPagar },
  { valor: "a_receber", rotulo: "A receber", Icone: IconAReceber },
  { valor: "resumo", rotulo: "Resumo", Icone: IconResumo },
];

export function Sidebar({
  abaAtiva,
  aoSelecionar,
  aoNovoLancamento,
  aoSair,
}: {
  abaAtiva: Aba;
  aoSelecionar: (aba: Aba) => void;
  aoNovoLancamento: () => void;
  aoSair: () => void;
}) {
  return (
    <aside className="sticky top-8 hidden w-56 shrink-0 flex-col gap-7 md:flex">
      <div className="flex items-center gap-2.5">
        <div className="brilho-accent flex h-9 w-9 items-center justify-center rounded-2xl bg-accent">
          <span className="font-display text-base font-bold text-on-accent">A</span>
        </div>
        <span className="rotulo-hud text-ink">Antaris</span>
      </div>

      <button
        type="button"
        onClick={aoNovoLancamento}
        disabled={abaAtiva === "resumo"}
        className="brilho-accent rounded-full bg-accent py-2.5 text-sm font-semibold text-on-accent transition-transform active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
      >
        + Novo lançamento
      </button>

      <nav className="flex flex-col gap-1">
        {ITENS.map(({ valor, rotulo, Icone }) => {
          const ativo = abaAtiva === valor;
          return (
            <button
              key={valor}
              type="button"
              onClick={() => aoSelecionar(valor)}
              className={`group flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                ativo
                  ? "border-accent/30 bg-accent/10 font-medium text-accent"
                  : "border-transparent text-muted hover:border-[color:var(--borda)] hover:text-ink"
              }`}
            >
              <Icone />
              {rotulo}
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={aoSair}
        className="mt-auto self-start text-sm text-muted transition-colors hover:text-ink"
      >
        Sair
      </button>
    </aside>
  );
}
