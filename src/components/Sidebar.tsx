import type { Aba } from "@/lib/types";

const ITENS: { valor: Aba; rotulo: string }[] = [
  { valor: "despesa", rotulo: "Gastos" },
  { valor: "a_pagar", rotulo: "Devo" },
  { valor: "a_receber", rotulo: "Me devem" },
  { valor: "resumo", rotulo: "Resumo" },
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
    <aside className="sticky top-8 hidden w-56 shrink-0 flex-col gap-8 md:flex">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-accent">
          <span className="font-display text-base font-semibold text-on-accent">C</span>
        </div>
        <span className="font-display text-lg font-medium text-ink">Caderno</span>
      </div>

      <button
        type="button"
        onClick={aoNovoLancamento}
        disabled={abaAtiva === "resumo"}
        className="rounded-full bg-accent py-2.5 text-sm font-semibold text-on-accent transition-transform active:scale-[0.98] disabled:opacity-40"
      >
        + Novo lançamento
      </button>

      <nav className="flex flex-col gap-1">
        {ITENS.map((item) => (
          <button
            key={item.valor}
            type="button"
            onClick={() => aoSelecionar(item.valor)}
            className={`rounded-xl px-3 py-2 text-left text-sm transition-colors ${
              abaAtiva === item.valor ? "bg-surface font-medium text-ink" : "text-muted hover:text-ink"
            }`}
          >
            {item.rotulo}
          </button>
        ))}
      </nav>

      <button
        type="button"
        onClick={aoSair}
        className="mt-auto self-start text-sm text-muted hover:text-ink"
      >
        Sair
      </button>
    </aside>
  );
}
