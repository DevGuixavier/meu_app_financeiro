import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

// Só mobile: no desktop a marca, o tema e o "Sair" já moram na Sidebar. Fica
// fixo no topo e visível em toda aba (inclusive Resumo) — enterrado no fim
// de um scroll longo é a mesma coisa que não ter o controle.
export function TopBarMobile({ aoSair }: { aoSair: () => void }) {
  return (
    <header className="bg-background/80 sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3 backdrop-blur-xl md:hidden">
      <div className="flex items-center gap-2">
        <div className="bg-primary flex size-7 items-center justify-center rounded-[8px]">
          <span className="text-primary-foreground font-display text-xs font-bold">A</span>
        </div>
        <span className="rotulo-hud text-foreground">Antaris</span>
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Button variant="ghost" size="sm" onClick={aoSair} aria-label="Sair">
          <LogOut />
        </Button>
      </div>
    </header>
  );
}
