"use client";

import { useCallback, useSyncExternalStore } from "react";

export function useMediaQuery(query: string) {
  const assinar = useCallback(
    (aoMudar: () => void) => {
      const lista = window.matchMedia(query);
      lista.addEventListener("change", aoMudar);
      return () => lista.removeEventListener("change", aoMudar);
    },
    [query],
  );

  return useSyncExternalStore(
    assinar,
    () => window.matchMedia(query).matches,
    // No servidor não existe matchMedia. Assumir "não é desktop" faz o
    // primeiro paint sair como mobile e a hidratação corrigir no cliente.
    () => false,
  );
}
