import type { Aba } from "@/lib/types";

const ABAS: { valor: Aba; rotulo: string }[] = [
  { valor: "despesa", rotulo: "Gastos" },
  { valor: "a_pagar", rotulo: "Devo" },
  { valor: "a_receber", rotulo: "Me devem" },
  { valor: "resumo", rotulo: "Resumo" },
];

export function TabBar({
  abaAtiva,
  aoSelecionar,
}: {
  abaAtiva: Aba;
  aoSelecionar: (aba: Aba) => void;
}) {
  return (
    <nav className="borda-sutil fixed inset-x-0 bottom-0 mx-auto flex w-full max-w-[420px] gap-1 bg-surface p-2 md:hidden">
      {ABAS.map((aba) => (
        <button
          key={aba.valor}
          type="button"
          onClick={() => aoSelecionar(aba.valor)}
          className={`flex-1 rounded-full py-2.5 text-sm transition-colors ${
            abaAtiva === aba.valor ? "bg-ink/10 font-medium text-ink" : "text-muted"
          }`}
        >
          {aba.rotulo}
        </button>
      ))}
    </nav>
  );
}
