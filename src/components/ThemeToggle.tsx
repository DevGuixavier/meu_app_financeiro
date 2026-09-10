"use client";

import { useCallback, useSyncExternalStore, type MouseEvent } from "react";
import { MdDarkMode, MdLightMode } from "react-icons/md";
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

  const alternar = useCallback((evento: MouseEvent<HTMLButtonElement>) => {
    const novo: Tema = obterTema() === "dark" ? "light" : "dark";
    const aplicar = () => {
      localStorage.setItem("tema", novo);
      document.documentElement.setAttribute("data-theme", novo);
    };

    const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduzMovimento || !document.startViewTransition) {
      aplicar();
      return;
    }

    // Centro da revelação circular = ponto clicado, em porcentagem da tela
    // (o clip-path do keyframe em globals.css lê essas variáveis).
    const { clientX, clientY } = evento;
    document.documentElement.style.setProperty("--tema-x", `${(clientX / window.innerWidth) * 100}%`);
    document.documentElement.style.setProperty("--tema-y", `${(clientY / window.innerHeight) * 100}%`);
    document.startViewTransition(aplicar);
  }, []);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={alternar}
      aria-label={tema === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
      className={className}
    >
      <span className="relative flex size-4 items-center justify-center [&_svg]:absolute [&_svg]:size-4 [&_svg]:transition-all [&_svg]:duration-300">
        <MdLightMode
          className={
            tema === "dark"
              ? "scale-100 rotate-0 opacity-100"
              : "scale-50 -rotate-90 opacity-0"
          }
        />
        <MdDarkMode
          className={
            tema === "dark"
              ? "scale-50 rotate-90 opacity-0"
              : "scale-100 rotate-0 opacity-100"
          }
        />
      </span>
    </Button>
  );
}
