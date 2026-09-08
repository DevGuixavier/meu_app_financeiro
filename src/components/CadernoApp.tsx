"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import type { SupabaseClient, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Aba, Categoria, Pessoa, Transacao, TipoTransacao } from "@/lib/types";
import { chaveMesAtual, deslocarMes, limitesDoMes } from "@/lib/mes";
import { gerarLancamentos, type NovaTransacaoInput } from "@/lib/parcelamento";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import { Sidebar } from "@/components/Sidebar";
import { TransacaoItem } from "@/components/TransacaoItem";
import { NovoLancamentoSheet } from "@/components/NovoLancamentoSheet";
import { ResumoPainel } from "@/components/ResumoPainel";

async function buscarTransacoes(
  supabase: SupabaseClient,
  tipo: TipoTransacao,
  chaveMes: string,
): Promise<Transacao[]> {
  const { inicio, fimExclusivo } = limitesDoMes(chaveMes);
  const { data } = await supabase
    .from("transacao")
    .select("*, pessoa:pessoa_id(id, nome, telefone), categoria:categoria_id(id, nome, cor)")
    .eq("tipo", tipo)
    .gte("data_vencimento", inicio)
    .lt("data_vencimento", fimExclusivo)
    .order("data_vencimento", { ascending: true });
  return (data as Transacao[] | null) ?? [];
}

export function CadernoApp({ session }: { session: Session }) {
  const [supabase] = useState(() => createClient());
  const [abaAtiva, setAbaAtiva] = useState<Aba>("despesa");
  const [chaveMes, setChaveMes] = useState(chaveMesAtual());
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [formAberto, setFormAberto] = useState(false);

  useEffect(() => {
    if (abaAtiva === "resumo") return;
    const tipo: TipoTransacao = abaAtiva;
    let cancelado = false;
    async function carregar() {
      setCarregando(true);
      const dados = await buscarTransacoes(supabase, tipo, chaveMes);
      if (!cancelado) {
        setTransacoes(dados);
        setCarregando(false);
      }
    }
    carregar();
    return () => {
      cancelado = true;
    };
  }, [supabase, abaAtiva, chaveMes]);

  useEffect(() => {
    supabase
      .from("pessoa")
      .select("id, nome, telefone")
      .order("nome")
      .then(({ data }) => setPessoas((data as Pessoa[] | null) ?? []));
    supabase
      .from("categoria")
      .select("id, nome, cor")
      .order("nome")
      .then(({ data }) => setCategorias((data as Categoria[] | null) ?? []));
  }, [supabase]);

  async function criarPessoa(nome: string): Promise<Pessoa> {
    const { data, error } = await supabase
      .from("pessoa")
      .insert({ nome, user_id: session.user.id })
      .select("id, nome, telefone")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Não foi possível criar a pessoa.");
    return data as Pessoa;
  }

  async function criarCategoria(nome: string): Promise<Categoria> {
    const { data, error } = await supabase
      .from("categoria")
      .insert({ nome, user_id: session.user.id })
      .select("id, nome, cor")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Não foi possível criar a categoria.");
    return data as Categoria;
  }

  async function salvarLancamento(input: NovaTransacaoInput) {
    const lancamentos = gerarLancamentos(input).map((lancamento) => ({
      ...lancamento,
      user_id: session.user.id,
    }));
    const { error } = await supabase.from("transacao").insert(lancamentos);
    if (error) throw new Error(error.message);
    setTransacoes(await buscarTransacoes(supabase, input.tipo, chaveMes));
  }

  async function alternarStatus(transacao: Transacao) {
    const novoStatus = transacao.status === "quitado" ? "pendente" : "quitado";
    const novaDataQuitacao = novoStatus === "quitado" ? new Date().toISOString().slice(0, 10) : null;

    setTransacoes((atual) =>
      atual.map((item) =>
        item.id === transacao.id
          ? { ...item, status: novoStatus, data_quitacao: novaDataQuitacao }
          : item,
      ),
    );

    const { error } = await supabase
      .from("transacao")
      .update({ status: novoStatus, data_quitacao: novaDataQuitacao })
      .eq("id", transacao.id);

    if (error) {
      setTransacoes((atual) =>
        atual.map((item) => (item.id === transacao.id ? transacao : item)),
      );
    }
  }

  const total = transacoes.reduce((soma, transacao) => soma + transacao.valor, 0);

  const mensagemVazio: Record<TipoTransacao, string> = {
    despesa: "Nenhum gasto neste mês.",
    a_pagar: "Nada a pagar neste mês.",
    a_receber: "Nada a receber neste mês.",
  };

  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col pb-32 md:max-w-5xl md:flex-row md:items-start md:gap-10 md:px-6 md:py-10 md:pb-10">
      <Sidebar
        abaAtiva={abaAtiva}
        aoSelecionar={setAbaAtiva}
        aoNovoLancamento={() => setFormAberto(true)}
        aoSair={() => supabase.auth.signOut()}
      />

      <div className="flex w-full flex-1 flex-col md:min-w-0">
        {abaAtiva === "resumo" ? (
          <ResumoPainel supabase={supabase} pessoas={pessoas} />
        ) : (
          <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col md:mx-0 md:max-w-xl">
            <Header
              chaveMes={chaveMes}
              total={total}
              tipoAtivo={abaAtiva}
              quantidade={transacoes.length}
              aoNavegar={(deslocamento) => setChaveMes((atual) => deslocarMes(atual, deslocamento))}
            />

            <ul
              className={`flex flex-1 flex-col gap-2 px-4 py-4 transition-opacity md:px-0 ${carregando ? "opacity-50" : ""}`}
            >
              {!carregando && transacoes.length === 0 && (
                <li className="py-10 text-center text-sm text-muted">{mensagemVazio[abaAtiva]}</li>
              )}
              {transacoes.map((transacao) => (
                <TransacaoItem key={transacao.id} transacao={transacao} aoAlternarStatus={alternarStatus} />
              ))}
            </ul>

            <button
              type="button"
              onClick={() => setFormAberto(true)}
              aria-label="Novo lançamento"
              className="fixed right-5 bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] z-10 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl text-on-accent shadow-[0_8px_24px_rgba(227,166,75,0.35)] transition-transform active:scale-90 md:hidden"
            >
              +
            </button>

            <AnimatePresence>
              {formAberto && (
                <NovoLancamentoSheet
                  key="novo-lancamento"
                  tipo={abaAtiva}
                  pessoas={pessoas}
                  categorias={categorias}
                  aoFechar={() => setFormAberto(false)}
                  aoSalvar={salvarLancamento}
                  aoCriarPessoa={criarPessoa}
                  aoCriarCategoria={criarCategoria}
                />
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <TabBar abaAtiva={abaAtiva} aoSelecionar={setAbaAtiva} />
    </div>
  );
}
