"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatarMoeda } from "@/lib/moeda";

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

  // Verifica o código digitado em vez de depender do link clicável do
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
    <main className="relative grid flex-1 lg:grid-cols-[minmax(0,1fr)_1.1fr]">
      <ThemeToggle className="absolute top-4 right-4 z-10" />

      {/* Coluna do formulário: alinhada à esquerda e ancorada no topo em vez
          de um cartão centralizado — o olho começa no canto onde vai digitar. */}
      <div className="flex flex-col justify-center px-6 py-14 sm:px-12 lg:px-16">
        <div className="w-full max-w-[360px]">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary flex size-8 items-center justify-center rounded-[9px]">
              <span className="text-primary-foreground font-display text-sm font-bold">A</span>
            </div>
            <span className="rotulo-hud text-foreground">Antaris</span>
          </div>

          <h1 className="font-display mt-10 text-[2rem] leading-[1.1] font-semibold tracking-[-0.02em]">
            {enviado ? "Confira seu email" : "Entre na sua conta"}
          </h1>
          <p className="text-muted-foreground mt-2.5 text-[15px] leading-relaxed">
            {enviado
              ? `Enviamos um código de acesso para ${email}.`
              : "Sem senha. Enviamos um código de acesso para o seu email."}
          </p>

          {enviado ? (
            <form onSubmit={confirmarCodigo} className="mt-9 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="codigo">Código de acesso</Label>
                <Input
                  id="codigo"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  required
                  placeholder="000000"
                  value={codigo}
                  onChange={(evento) => setCodigo(evento.target.value)}
                  className="numeros-tabulares h-12 text-center font-mono text-lg tracking-[0.35em]"
                />
              </div>
              {erro && (
                <p role="alert" className="text-destructive text-sm">
                  {erro}
                </p>
              )}
              <Button type="submit" size="lg" disabled={enviando}>
                {enviando ? "Confirmando..." : "Entrar"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setEnviado(false);
                  setCodigo("");
                  setErro(null);
                }}
                className="text-muted-foreground hover:text-foreground self-start text-sm underline underline-offset-4 transition-colors"
              >
                Usar outro email
              </button>
            </form>
          ) : (
            <form onSubmit={enviarCodigo} className="mt-9 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(evento) => setEmail(evento.target.value)}
                  className="h-12"
                />
              </div>
              {erro && (
                <p role="alert" className="text-destructive text-sm">
                  {erro}
                </p>
              )}
              <Button type="submit" size="lg" disabled={enviando}>
                {enviando ? "Enviando..." : "Continuar"}
              </Button>
            </form>
          )}
        </div>
      </div>

      <PainelVitrine />
    </main>
  );
}

/* Painel de produto: em vez de espaço vazio ou ilustração genérica, mostra o
   artefato real do app — o razão, com as três naturezas que o Antaris separa. */
function PainelVitrine() {
  const linhas = [
    { titulo: "Mercado do mês", pessoa: "3/5", valor: 284.9, tipo: "despesa" as const },
    { titulo: "Aluguel", pessoa: "1/1", valor: 1450, tipo: "a_pagar" as const },
    { titulo: "Empréstimo — João", pessoa: "2/4", valor: 300, tipo: "a_receber" as const },
    { titulo: "Farmácia", pessoa: "única", valor: 62.4, tipo: "despesa" as const },
  ];
  const cores = {
    despesa: "text-foreground",
    a_pagar: "text-[var(--chart-2)]",
    a_receber: "text-[var(--chart-3)]",
  };

  return (
    <aside className="bg-pane text-pane-foreground relative hidden items-center justify-center overflow-hidden p-16 lg:flex">
      <div className="w-full max-w-[420px]">
        <p className="rotulo-hud text-pane-muted">Setembro · razão</p>

        <div className="mt-5 flex items-baseline gap-3">
          <span className="numeros-tabulares font-display text-[2.75rem] leading-none font-semibold tracking-[-0.03em]">
            {formatarMoeda(2097.3)}
          </span>
          <span className="text-pane-muted text-sm">em aberto</span>
        </div>

        <div className="divide-border mt-9 divide-y overflow-hidden rounded-lg border bg-[var(--card)] text-[var(--card-foreground)]">
          {linhas.map((linha) => (
            <div key={linha.titulo} className="flex items-center gap-3 px-4 py-3">
              <span
                aria-hidden
                className="size-1.5 shrink-0 rounded-full"
                style={{
                  background:
                    linha.tipo === "despesa"
                      ? "var(--chart-1)"
                      : linha.tipo === "a_pagar"
                        ? "var(--chart-2)"
                        : "var(--chart-3)",
                }}
              />
              <span className="min-w-0 flex-1 truncate text-sm">{linha.titulo}</span>
              <span className="text-muted-foreground font-mono text-xs">{linha.pessoa}</span>
              <span className={`numeros-tabulares font-mono text-sm ${cores[linha.tipo]}`}>
                {formatarMoeda(linha.valor)}
              </span>
            </div>
          ))}
        </div>

        <p className="text-pane-muted mt-5 text-sm leading-relaxed">
          Gastos, o que você deve e o que têm a te pagar — separados, parcela a
          parcela, no mesmo lugar.
        </p>
      </div>
    </aside>
  );
}
