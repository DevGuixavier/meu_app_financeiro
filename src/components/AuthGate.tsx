"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export function AuthGate({ children }: { children: (session: Session) => ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: subscription } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSession(novaSessao);
    });
    return () => subscription.subscription.unsubscribe();
  }, [supabase]);

  async function enviarLinkDeAcesso(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setEnviando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setEnviado(true);
  }

  if (session === undefined) {
    return null;
  }

  if (session === null) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-xs">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent">
            <span className="font-display text-xl font-semibold text-bg">C</span>
          </div>
          <h1 className="mt-5 font-display text-3xl font-semibold text-ink">Caderno</h1>
          <p className="mt-2 text-sm text-muted">
            Controle de gastos e fiado. Entre com seu email para continuar.
          </p>

          {enviado ? (
            <p className="mt-8 text-sm text-accent">
              Link de acesso enviado para {email}. Abra seu email para entrar.
            </p>
          ) : (
            <form onSubmit={enviarLinkDeAcesso} className="mt-8 flex flex-col gap-3">
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                className="borda-sutil rounded-2xl bg-surface px-4 py-3 text-base text-ink outline-none placeholder:text-muted"
              />
              {erro && <p className="text-sm text-negative">{erro}</p>}
              <button
                type="submit"
                disabled={enviando}
                className="mt-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-bg disabled:opacity-60"
              >
                {enviando ? "Enviando..." : "Enviar link de acesso"}
              </button>
            </form>
          )}
        </div>
      </main>
    );
  }

  return <>{children(session)}</>;
}
