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
    <nav className="linha-pauta fixed inset-x-0 bottom-0 mx-auto flex w-full max-w-[420px] border-t bg-paper">
      {ABAS.map((aba) => (
        <button
          key={aba.tipo}
          type="button"
          onClick={() => aoSelecionar(aba.tipo)}
          className={`flex-1 py-3 text-sm ${
            tipoAtivo === aba.tipo ? "font-medium text-ink" : "text-graphite"
          }`}
        >
          {aba.rotulo}
        </button>
      ))}
    </nav>
  );
}
