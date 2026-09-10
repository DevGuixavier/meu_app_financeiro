"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type Tema = "light" | "dark";

function obterTema(): Tema {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function assinar(aoMudar: () => void) {
  // Reage tanto a troca feita pelo próprio toggle (MutationObserver no
  // atributo) quanto à troca do tema do sistema operacional, mas só se
  // a pessoa nunca escolheu manualmente (senão a escolha explícita venceria
  // o sistema de qualquer forma via CSS, e recalcular aqui seria enganoso).
  const consultaSistema = window.matchMedia("(prefers-color-scheme: dark)");
  const aoMudarSistema = () => {
    if (!localStorage.getItem("tema")) {
      document.documentElement.setAttribute("data-theme", consultaSistema.matches ? "dark" : "light");
    }
  };
  const observer = new MutationObserver(aoMudar);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  consultaSistema.addEventListener("change", aoMudarSistema);
  return () => {
    observer.disconnect();
    consultaSistema.removeEventListener("change", aoMudarSistema);
  };
}

export function ThemeToggle({ className }: { className?: string }) {
  // getServerSnapshot fixo em "light": bate com o :root sem atributo do HTML
  // vindo do servidor. O script beforeInteractive já corrigiu o DOM antes da
  // pintura; esse valor só precisa bater no primeiro render pra não disparar
  // aviso de hydration — o ícone corrige sozinho no frame seguinte.
  const tema = useSyncExternalStore(assinar, obterTema, () => "light" as Tema);

  const alternar = useCallback(() => {
    const novo: Tema = obterTema() === "dark" ? "light" : "dark";
    localStorage.setItem("tema", novo);
    document.documentElement.setAttribute("data-theme", novo);
  }, []);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={alternar}
      aria-label={tema === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
      className={className}
    >
      {tema === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
