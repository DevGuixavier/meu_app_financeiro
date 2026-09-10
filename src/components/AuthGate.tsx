"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-10">
      <Card className="w-full max-w-sm gap-5">
        <CardHeader>
          <div className="bg-primary mb-1 flex size-11 items-center justify-center rounded-xl">
            <span className="text-primary-foreground font-display text-xl font-bold">A</span>
          </div>
          <h1 data-slot="card-title" className="font-display text-3xl leading-none font-semibold">
            Antaris
          </h1>
          <CardDescription>
            Controle de gastos e cobranças. Entre com seu email para continuar.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {enviado ? (
            <form onSubmit={confirmarCodigo} className="flex flex-col gap-4">
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
                  className="numeros-tabulares text-center font-mono text-lg tracking-[0.35em]"
                />
                <p className="text-muted-foreground text-sm">Enviamos para {email}.</p>
              </div>
              {erro && (
                <p role="alert" className="text-destructive text-sm">
                  {erro}
                </p>
              )}
              <Button type="submit" size="lg" disabled={enviando}>
                {enviando ? "Confirmando..." : "Confirmar código"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEnviado(false);
                  setCodigo("");
                  setErro(null);
                }}
              >
                Usar outro email
              </Button>
            </form>
          ) : (
            <form onSubmit={enviarCodigo} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(evento) => setEmail(evento.target.value)}
                />
              </div>
              {erro && (
                <p role="alert" className="text-destructive text-sm">
                  {erro}
                </p>
              )}
              <Button type="submit" size="lg" disabled={enviando}>
                {enviando ? "Enviando..." : "Enviar código de acesso"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
