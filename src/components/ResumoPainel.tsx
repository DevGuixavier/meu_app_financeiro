"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Pessoa, TipoTransacao } from "@/lib/types";
import { agruparPorCategoria, agruparPorMesETipo, type GastoPorCategoria } from "@/lib/resumo";
import { chaveMesAtual, deslocarMes, limitesDoMes, rotuloMesAbreviado } from "@/lib/mes";
import { formatarMoeda } from "@/lib/moeda";

const QUANTIDADE_MESES_EVOLUCAO = 6;

interface DadosResumo {
  totalGastosMes: number;
  totalAPagarPendente: number;
  totalAReceberPendente: number;
  gastosPorCategoria: GastoPorCategoria[];
  evolucao: Record<TipoTransacao, number[]>;
  saldoPorPessoa: { pessoa: Pessoa; saldo: number }[];
}

async function buscarDadosResumo(supabase: SupabaseClient, pessoas: Pessoa[]): Promise<DadosResumo> {
  const chaveMes = chaveMesAtual();
  const { inicio, fimExclusivo } = limitesDoMes(chaveMes);
  const mesesChaves = Array.from({ length: QUANTIDADE_MESES_EVOLUCAO }, (_, indice) =>
    deslocarMes(chaveMes, indice - (QUANTIDADE_MESES_EVOLUCAO - 1)),
  );
  const { inicio: inicioEvolucao } = limitesDoMes(mesesChaves[0]);

  const [gastosMes, aPagarPendente, aReceberPendente, transacoesEvolucao, saldos] = await Promise.all([
    supabase
      .from("transacao")
      .select("valor, categoria:categoria_id(nome)")
      .eq("tipo", "despesa")
      .gte("data_vencimento", inicio)
      .lt("data_vencimento", fimExclusivo),
    supabase.from("transacao").select("valor").eq("tipo", "a_pagar").eq("status", "pendente"),
    supabase.from("transacao").select("valor").eq("tipo", "a_receber").eq("status", "pendente"),
    supabase
      .from("transacao")
      .select("tipo, valor, data_vencimento")
      .gte("data_vencimento", inicioEvolucao)
      .lt("data_vencimento", fimExclusivo),
    supabase.from("saldo_por_pessoa").select("pessoa_id, saldo"),
  ]);

  const somar = (linhas: { valor: number }[] | null) =>
    (linhas ?? []).reduce((soma, linha) => soma + linha.valor, 0);

  const pessoasPorId = new Map(pessoas.map((pessoa) => [pessoa.id, pessoa]));
  const saldoPorPessoa = ((saldos.data as { pessoa_id: number; saldo: number }[] | null) ?? [])
    .filter((linha) => linha.saldo !== 0 && pessoasPorId.has(linha.pessoa_id))
    .map((linha) => ({ pessoa: pessoasPorId.get(linha.pessoa_id)!, saldo: linha.saldo }))
    .sort((a, b) => Math.abs(b.saldo) - Math.abs(a.saldo));

  return {
    totalGastosMes: somar(gastosMes.data),
    totalAPagarPendente: somar(aPagarPendente.data),
    totalAReceberPendente: somar(aReceberPendente.data),
    gastosPorCategoria: agruparPorCategoria(
      (gastosMes.data as { valor: number; categoria: { nome: string } | null }[] | null) ?? [],
    ),
    evolucao: agruparPorMesETipo(
      (transacoesEvolucao.data as
        | { tipo: TipoTransacao; valor: number; data_vencimento: string }[]
        | null) ?? [],
      mesesChaves,
    ),
    saldoPorPessoa,
  };
}

function StatTile({ rotulo, valor, cor }: { rotulo: string; valor: number; cor: string }) {
  return (
    <div className="borda-sutil flex-1 rounded-2xl bg-surface px-4 py-3">
      <p className="text-sm text-muted">{rotulo}</p>
      <p className={`mt-1 font-mono text-lg ${cor}`}>{formatarMoeda(valor)}</p>
    </div>
  );
}

function ListaGastosPorCategoria({ dados }: { dados: GastoPorCategoria[] }) {
  const maiorValor = Math.max(...dados.map((item) => item.valor), 1);

  if (dados.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">Nenhum gasto neste mês ainda.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {dados.map((item) => (
        <li key={item.nome}>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="truncate text-sm text-ink">{item.nome}</span>
            <span className="numeros-tabulares shrink-0 font-mono text-sm text-ink">
              {formatarMoeda(item.valor)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-ink/10">
            <div
              className="h-2 rounded-full bg-accent"
              style={{ width: `${(item.valor / maiorValor) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

const ROTULO_TIPO: Record<TipoTransacao, string> = {
  despesa: "Gastos",
  a_pagar: "Devo",
  a_receber: "Me devem",
};

const COR_PREENCHIMENTO_TIPO: Record<TipoTransacao, string> = {
  despesa: "bg-ink/40",
  a_pagar: "bg-negative",
  a_receber: "bg-accent",
};

function MiniEvolucao({
  tipo,
  serie,
  mesesChaves,
}: {
  tipo: TipoTransacao;
  serie: number[];
  mesesChaves: string[];
}) {
  const maiorValor = Math.max(...serie, 1);
  const valorAtual = serie[serie.length - 1];

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm text-muted">{ROTULO_TIPO[tipo]}</span>
        <span className="numeros-tabulares font-mono text-sm text-ink">
          {formatarMoeda(valorAtual)}
        </span>
      </div>
      <div className="flex h-16 items-end gap-1.5 md:h-28">
        {serie.map((valor, indice) => (
          <div key={mesesChaves[indice]} className="flex h-full flex-1 items-end justify-center">
            <div
              className={`w-4 max-w-6 rounded-t ${COR_PREENCHIMENTO_TIPO[tipo]} ${
                indice === serie.length - 1 ? "" : "opacity-50"
              }`}
              style={{ height: `${Math.max((valor / maiorValor) * 100, 4)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1.5">
        {mesesChaves.map((chave) => (
          <span key={chave} className="flex-1 text-center text-[10px] text-muted">
            {rotuloMesAbreviado(chave)}
          </span>
        ))}
      </div>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="borda-sutil rounded-2xl bg-surface p-4">
      <h2 className="mb-3 font-display text-base font-medium text-ink">{titulo}</h2>
      {children}
    </section>
  );
}

export function ResumoPainel({
  supabase,
  pessoas,
}: {
  supabase: SupabaseClient;
  pessoas: Pessoa[];
}) {
  const [dados, setDados] = useState<DadosResumo | null>(null);

  useEffect(() => {
    let cancelado = false;
    buscarDadosResumo(supabase, pessoas).then((resultado) => {
      if (!cancelado) setDados(resultado);
    });
    return () => {
      cancelado = true;
    };
  }, [supabase, pessoas]);

  const chaveMes = chaveMesAtual();
  const mesesChaves = Array.from({ length: QUANTIDADE_MESES_EVOLUCAO }, (_, indice) =>
    deslocarMes(chaveMes, indice - (QUANTIDADE_MESES_EVOLUCAO - 1)),
  );

  if (!dados) {
    return <div className="flex-1 px-4 py-6 text-sm text-muted">Carregando resumo...</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:px-6">
      <div className="flex gap-3">
        <StatTile rotulo="Gastos no mês" valor={dados.totalGastosMes} cor="text-ink" />
        <StatTile rotulo="Devo" valor={dados.totalAPagarPendente} cor="text-negative" />
        <StatTile rotulo="Me devem" valor={dados.totalAReceberPendente} cor="text-accent" />
      </div>

      <Secao titulo="Evolução mensal">
        <div className="flex flex-col gap-5 md:grid md:grid-cols-3 md:gap-6">
          <MiniEvolucao tipo="despesa" serie={dados.evolucao.despesa} mesesChaves={mesesChaves} />
          <MiniEvolucao tipo="a_pagar" serie={dados.evolucao.a_pagar} mesesChaves={mesesChaves} />
          <MiniEvolucao tipo="a_receber" serie={dados.evolucao.a_receber} mesesChaves={mesesChaves} />
        </div>
      </Secao>

      <div className="grid gap-4 md:grid-cols-2">
        <Secao titulo="Gastos por categoria">
          <ListaGastosPorCategoria dados={dados.gastosPorCategoria} />
        </Secao>

        <Secao titulo="Saldo por pessoa">
          {dados.saldoPorPessoa.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Nenhuma pendência com ninguém.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {dados.saldoPorPessoa.map(({ pessoa, saldo }) => (
                <li key={pessoa.id} className="flex items-center justify-between">
                  <span className="text-sm text-ink">{pessoa.nome}</span>
                  <span
                    className={`numeros-tabulares font-mono text-sm ${
                      saldo > 0 ? "text-accent" : "text-negative"
                    }`}
                  >
                    {formatarMoeda(saldo)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Secao>
      </div>
    </div>
  );
}
