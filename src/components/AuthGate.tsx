"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export function AuthGate({ children }: { children: (session: Session) => ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: subscription } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSession(novaSessao);
    });
    return () => subscription.subscription.unsubscribe();
  }, [supabase]);

  if (session === undefined) {
    return null;
  }

  if (session === null) {
    // Componente separado de propósito: ele desmonta ao entrar e monta zerado
    // ao sair, então o formulário nunca reabre na etapa do código anterior.
    return <FormularioLogin supabase={supabase} />;
  }

  return <>{children(session)}</>;
}

function FormularioLogin({ supabase }: { supabase: SupabaseClient }) {
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviarCodigo(evento: FormEvent) {
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

  // Verifica o código de 6 dígitos em vez de depender do link clicável do
  // email — o link é reescrito e pré-acessado por scanners de segurança
  // (Gmail, Outlook), o que consome o token PKCE de uso único antes do
  // usuário clicar e derruba o login com "otp_expired".
  async function confirmarCodigo(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: codigo, type: "email" });
    setEnviando(false);
    if (error) {
      setErro(error.message);
      return;
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="borda-sutil w-full max-w-xs rounded-[24px] bg-surface p-6">
        <div className="brilho-accent flex h-11 w-11 items-center justify-center rounded-2xl bg-accent">
          <span className="font-display text-xl font-bold text-on-accent">S</span>
        </div>
        <h1 className="mt-5 font-display text-3xl font-semibold text-ink">Saldo</h1>
        <p className="mt-2 text-sm text-muted">
          Controle de gastos e cobranças. Entre com seu email para continuar.
        </p>

        {enviado ? (
          <form onSubmit={confirmarCodigo} className="mt-8 flex flex-col gap-3">
            <p className="text-sm text-muted">
              Enviamos um código de acesso para {email}.
            </p>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              placeholder="Código recebido por email"
              value={codigo}
              onChange={(evento) => setCodigo(evento.target.value)}
              className="borda-sutil rounded-2xl bg-surface px-4 py-3 text-center text-lg tracking-[0.3em] text-ink outline-none placeholder:text-sm placeholder:tracking-normal placeholder:text-muted"
            />
            {erro && <p className="text-sm text-negative">{erro}</p>}
            <button
              type="submit"
              disabled={enviando}
              className="brilho-accent mt-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-on-accent transition-transform active:scale-[0.98] disabled:opacity-60 disabled:shadow-none"
            >
              {enviando ? "Confirmando..." : "Confirmar código"}
            </button>
          </form>
        ) : (
          <form onSubmit={enviarCodigo} className="mt-8 flex flex-col gap-3">
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
              className="brilho-accent mt-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-on-accent transition-transform active:scale-[0.98] disabled:opacity-60 disabled:shadow-none"
            >
              {enviando ? "Enviando..." : "Enviar código de acesso"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
