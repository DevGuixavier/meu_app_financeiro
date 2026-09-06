import type { TipoTransacao } from "@/lib/types";

const ABAS: { tipo: TipoTransacao; rotulo: string }[] = [
  { tipo: "despesa", rotulo: "Gastos" },
  { tipo: "a_pagar", rotulo: "Devo" },
  { tipo: "a_receber", rotulo: "Me devem" },
];

export function TabBar({
  tipoAtivo,
  aoSelecionar,
}: {
  tipoAtivo: TipoTransacao;
  aoSelecionar: (tipo: TipoTransacao) => void;
}) {
  return (
    <nav className="borda-sutil fixed inset-x-0 bottom-0 mx-auto flex w-full max-w-[420px] gap-1 bg-surface p-2">
      {ABAS.map((aba) => (
        <button
          key={aba.tipo}
          type="button"
          onClick={() => aoSelecionar(aba.tipo)}
          className={`flex-1 rounded-full py-2.5 text-sm transition-colors ${
            tipoAtivo === aba.tipo ? "bg-ink/10 font-medium text-ink" : "text-muted"
          }`}
        >
          {aba.rotulo}
        </button>
      ))}
    </nav>
  );
}
