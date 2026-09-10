import Image from "next/image";
import { MdAccountBalanceWallet, MdBarChart, MdCallMade, MdCallReceived, MdLogout, MdAdd } from "react-icons/md";
import type { IconType } from "react-icons";
import type { Aba } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const ITENS: { valor: Aba; rotulo: string; Icone: IconType }[] = [
  { valor: "despesa", rotulo: "Gastos", Icone: MdAccountBalanceWallet },
  { valor: "a_pagar", rotulo: "A pagar", Icone: MdCallMade },
  { valor: "a_receber", rotulo: "A receber", Icone: MdCallReceived },
  { valor: "resumo", rotulo: "Resumo", Icone: MdBarChart },
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
        <Image src="/logo.png" alt="" width={36} height={36} className="size-9" priority />
        <span className="rotulo-hud text-foreground">Antaris</span>
      </div>

      <Button onClick={aoNovoLancamento} disabled={abaAtiva === "resumo"}>
        <MdAdd />
        Novo lançamento
      </Button>

      <nav className="flex flex-col gap-1">
        {ITENS.map(({ valor, rotulo, Icone }) => {
          const ativo = abaAtiva === valor;
          return (
            <button
              key={valor}
              type="button"
              onClick={() => aoSelecionar(valor)}
              aria-current={ativo ? "page" : undefined}
              className={cn(
                "focus-visible:ring-ring/50 flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors outline-none focus-visible:ring-[3px] [&_svg]:size-4",
                ativo
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              <Icone />
              {rotulo}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={aoSair} className="self-start">
          <MdLogout />
          Sair
        </Button>
        <ThemeToggle />
      </div>
    </aside>
  );
}
