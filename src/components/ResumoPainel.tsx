"use client";

import { useEffect, useMemo, useState, type PointerEvent, type ReactNode } from "react";
import { Download, LogOut } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Categoria, Pessoa, TipoTransacao, Transacao } from "@/lib/types";
import { agruparPorCategoria, agruparPorMesETipo, type GastoPorCategoria } from "@/lib/resumo";
import { chaveMesAtual, deslocarMes, limitesDoMes, rotuloMesAbreviado } from "@/lib/mes";
import { formatarMoeda } from "@/lib/moeda";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buscarTodasTransacoes, exportarCsv, exportarXlsx } from "@/lib/exportacao";
import { ImportarLancamentos } from "@/components/ImportarLancamentos";

const QUANTIDADE_MESES_EVOLUCAO = 6;
const QUANTIDADE_RECENTES = 6;

const ROTULO_TIPO: Record<TipoTransacao, string> = {
  despesa: "Gastos",
  a_pagar: "A pagar",
  a_receber: "A receber",
};

/** Marcas de gráfico: degraus validados (faixa L, chroma, CVD e contraste).
 * A terracota da UI fica perto demais do âmbar quando as duas viram marca
 * lado a lado, então a série "a pagar" usa um degrau mais escuro. */
const COR_SERIE: Record<TipoTransacao, string> = {
  despesa: "var(--chart-1)",
  a_pagar: "var(--chart-2)",
  a_receber: "var(--chart-3)",
};

interface ProgressoTipo {
  quitado: number;
  total: number;
}

interface DadosResumo {
  totalGastosMes: number;
  totalAPagarPendente: number;
  totalAReceberPendente: number;
  progresso: Record<TipoTransacao, ProgressoTipo>;
  gastosPorCategoria: GastoPorCategoria[];
  evolucao: Record<TipoTransacao, number[]>;
  mesesChaves: string[];
  saldoPorPessoa: { pessoa: Pessoa; saldo: number }[];
  recentes: Transacao[];
}

function calcularMesesChaves(chaveMes: string): string[] {
  return Array.from({ length: QUANTIDADE_MESES_EVOLUCAO }, (_, indice) =>
    deslocarMes(chaveMes, indice - (QUANTIDADE_MESES_EVOLUCAO - 1)),
  );
}

async function buscarDadosResumo(supabase: SupabaseClient, pessoas: Pessoa[]): Promise<DadosResumo> {
  const chaveMes = chaveMesAtual();
  const { inicio, fimExclusivo } = limitesDoMes(chaveMes);
  const mesesChaves = calcularMesesChaves(chaveMes);
  const { inicio: inicioEvolucao } = limitesDoMes(mesesChaves[0]);

  const [gastosMes, aPagarPendente, aReceberPendente, transacoesEvolucao, saldos, recentes] =
    await Promise.all([
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
        .select("tipo, valor, data_vencimento, status")
        .gte("data_vencimento", inicioEvolucao)
        .lt("data_vencimento", fimExclusivo),
      supabase.from("saldo_por_pessoa").select("pessoa_id, saldo"),
      supabase
        .from("transacao")
        .select("*, pessoa:pessoa_id(id, nome, telefone)")
        .order("created_at", { ascending: false })
        .limit(QUANTIDADE_RECENTES),
    ]);

  const somar = (linhas: { valor: number }[] | null) =>
    (linhas ?? []).reduce((soma, linha) => soma + linha.valor, 0);

  const linhasEvolucao =
    (transacoesEvolucao.data as
      | { tipo: TipoTransacao; valor: number; data_vencimento: string; status: string }[]
      | null) ?? [];

  // Progresso = quanto do mês corrente já foi quitado, por tipo.
  const progresso: Record<TipoTransacao, ProgressoTipo> = {
    despesa: { quitado: 0, total: 0 },
    a_pagar: { quitado: 0, total: 0 },
    a_receber: { quitado: 0, total: 0 },
  };
  for (const linha of linhasEvolucao) {
    if (linha.data_vencimento.slice(0, 7) !== chaveMes) continue;
    progresso[linha.tipo].total += linha.valor;
    if (linha.status === "quitado") progresso[linha.tipo].quitado += linha.valor;
  }

  const pessoasPorId = new Map(pessoas.map((pessoa) => [pessoa.id, pessoa]));
  const saldoPorPessoa = ((saldos.data as { pessoa_id: number; saldo: number }[] | null) ?? [])
    .filter((linha) => linha.saldo !== 0 && pessoasPorId.has(linha.pessoa_id))
    .map((linha) => ({ pessoa: pessoasPorId.get(linha.pessoa_id)!, saldo: linha.saldo }))
    .sort((a, b) => Math.abs(b.saldo) - Math.abs(a.saldo));

  return {
    totalGastosMes: somar(gastosMes.data),
    totalAPagarPendente: somar(aPagarPendente.data),
    totalAReceberPendente: somar(aReceberPendente.data),
    progresso,
    gastosPorCategoria: agruparPorCategoria(
      (gastosMes.data as { valor: number; categoria: { nome: string } | null }[] | null) ?? [],
    ),
    evolucao: agruparPorMesETipo(linhasEvolucao, mesesChaves),
    mesesChaves,
    saldoPorPessoa,
    recentes: (recentes.data as Transacao[] | null) ?? [],
  };
}

function Painel({
  titulo,
  acessorio,
  children,
}: {
  titulo: string;
  acessorio?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="gap-4 py-5">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="rotulo-hud text-muted-foreground">{titulo}</CardTitle>
        {acessorio && <CardAction>{acessorio}</CardAction>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** KPI com anel de progresso: quanto do mês já foi quitado naquele tipo. */
function AnelKpi({
  tipo,
  valor,
  progresso,
}: {
  tipo: TipoTransacao;
  valor: number;
  progresso: ProgressoTipo;
}) {
  const raio = 26;
  const circunferencia = 2 * Math.PI * raio;
  const fracao = progresso.total > 0 ? progresso.quitado / progresso.total : 0;
  const percentual = Math.round(fracao * 100);
  const cor = COR_SERIE[tipo];

  return (
    <div className="border flex min-w-0 flex-col items-center gap-2 rounded-lg bg-card px-1.5 py-4 md:px-3">
      <div className="relative h-[68px] w-[68px]">
        <svg viewBox="0 0 68 68" className="h-full w-full -rotate-90">
          <circle
            cx="34"
            cy="34"
            r={raio}
            fill="none"
            strokeWidth="5"
            style={{ stroke: cor, opacity: 0.18 }}
          />
          <motion.circle
            cx="34"
            cy="34"
            r={raio}
            fill="none"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circunferencia}
            initial={{ strokeDashoffset: circunferencia }}
            animate={{ strokeDashoffset: circunferencia * (1 - fracao) }}
            transition={{ type: "spring", stiffness: 90, damping: 20 }}
            style={{ stroke: cor }}
          />
        </svg>
        <span className="numeros-tabulares absolute inset-0 flex items-center justify-center font-mono text-sm font-semibold text-foreground">
          {percentual}%
        </span>
      </div>
      <p className="rotulo-hud w-full truncate text-center text-muted-foreground">{ROTULO_TIPO[tipo]}</p>
      <p className="numeros-tabulares w-full truncate text-center font-mono text-[13px] text-foreground md:text-sm">
        {formatarMoeda(valor)}
      </p>
    </div>
  );
}

const LARGURA = 640;
const ALTURA = 240;
const MARGEM = { topo: 18, direita: 16, base: 30, esquerda: 54 };

function arredondarTeto(valor: number): number {
  if (valor <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(valor));
  return Math.ceil(valor / magnitude) * magnitude;
}

/** Linha temporal com área em gradiente. Uma série por vez: o seletor troca a
 * série, então nunca há duas cores disputando leitura no mesmo plano. */
function GraficoTemporal({
  serie,
  mesesChaves,
  tipo,
}: {
  serie: number[];
  mesesChaves: string[];
  tipo: TipoTransacao;
}) {
  const [indiceAtivo, setIndiceAtivo] = useState<number | null>(null);
  const cor = COR_SERIE[tipo];
  const idGradiente = `gradiente-${tipo}`;

  const { pontos, teto } = useMemo(() => {
    const maximo = Math.max(...serie, 0);
    const tetoCalculado = arredondarTeto(maximo);
    const larguraPlot = LARGURA - MARGEM.esquerda - MARGEM.direita;
    const alturaPlot = ALTURA - MARGEM.topo - MARGEM.base;
    const passo = serie.length > 1 ? larguraPlot / (serie.length - 1) : 0;
    return {
      teto: tetoCalculado,
      pontos: serie.map((valor, indice) => ({
        x: MARGEM.esquerda + passo * indice,
        y: MARGEM.topo + alturaPlot * (1 - valor / tetoCalculado),
        valor,
      })),
    };
  }, [serie]);

  const linha = pontos.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${linha} L ${pontos[pontos.length - 1].x} ${ALTURA - MARGEM.base} L ${pontos[0].x} ${ALTURA - MARGEM.base} Z`;
  const ticks = [0, 0.5, 1].map((fracao) => ({
    y: MARGEM.topo + (ALTURA - MARGEM.topo - MARGEM.base) * (1 - fracao),
    valor: teto * fracao,
  }));
  const ultimo = pontos[pontos.length - 1];
  const ativo = indiceAtivo === null ? null : pontos[indiceAtivo];

  function aoMoverPonteiro(evento: PointerEvent<SVGSVGElement>) {
    const caixa = evento.currentTarget.getBoundingClientRect();
    const x = ((evento.clientX - caixa.left) / caixa.width) * LARGURA;
    let maisProximo = 0;
    pontos.forEach((ponto, indice) => {
      if (Math.abs(ponto.x - x) < Math.abs(pontos[maisProximo].x - x)) maisProximo = indice;
    });
    setIndiceAtivo(maisProximo);
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${LARGURA} ${ALTURA}`}
        className="h-auto w-full touch-none"
        onPointerMove={aoMoverPonteiro}
        onPointerLeave={() => setIndiceAtivo(null)}
        role="img"
        aria-label={`Evolução de ${ROTULO_TIPO[tipo]} nos últimos ${serie.length} meses`}
      >
        <defs>
          <linearGradient id={idGradiente} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: cor, stopOpacity: 0.42 }} />
            <stop offset="100%" style={{ stopColor: cor, stopOpacity: 0 }} />
          </linearGradient>
        </defs>

        {ticks.map((tick) => (
          <g key={tick.y}>
            <line
              x1={MARGEM.esquerda}
              y1={tick.y}
              x2={LARGURA - MARGEM.direita}
              y2={tick.y}
              stroke="var(--border)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={MARGEM.esquerda - 10}
              y={tick.y + 4}
              textAnchor="end"
              className="numeros-tabulares fill-[color:var(--muted-foreground)] font-mono text-[11px]"
            >
              {Math.round(tick.valor / 1000) >= 1
                ? `${Math.round(tick.valor / 100) / 10}k`
                : Math.round(tick.valor)}
            </text>
          </g>
        ))}

        <path d={area} fill={`url(#${idGradiente})`} />
        <path
          d={linha}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          style={{ stroke: cor }}
        />

        {ativo && (
          <line
            x1={ativo.x}
            y1={MARGEM.topo}
            x2={ativo.x}
            y2={ALTURA - MARGEM.base}
            stroke="var(--muted-foreground)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {pontos.map((ponto, indice) => (
          <circle
            key={mesesChaves[indice]}
            cx={ponto.x}
            cy={ponto.y}
            r={indice === indiceAtivo || indice === pontos.length - 1 ? 5 : 0}
            style={{ fill: cor }}
            stroke="var(--card)"
            strokeWidth="2"
            tabIndex={0}
            role="img"
            aria-label={`${rotuloMesAbreviado(mesesChaves[indice])}: ${formatarMoeda(ponto.valor)}`}
            onFocus={() => setIndiceAtivo(indice)}
            onBlur={() => setIndiceAtivo(null)}
          />
        ))}

        <text
          x={ultimo.x}
          y={ultimo.y - 14}
          textAnchor="end"
          className="numeros-tabulares fill-[color:var(--foreground)] font-mono text-[12px] font-semibold"
        >
          {formatarMoeda(ultimo.valor)}
        </text>

        {mesesChaves.map((chave, indice) => (
          <text
            key={chave}
            x={pontos[indice].x}
            y={ALTURA - 8}
            textAnchor="middle"
            className="fill-[color:var(--muted-foreground)] text-[11px]"
          >
            {rotuloMesAbreviado(chave)}
          </text>
        ))}
      </svg>

      {ativo && indiceAtivo !== null && (
        <div
          className={`border pointer-events-none absolute top-0 rounded-xl bg-card px-3 py-2 ${
            indiceAtivo > pontos.length / 2 ? "left-0" : "right-0"
          }`}
        >
          <p className="numeros-tabulares font-mono text-sm font-semibold text-foreground">
            {formatarMoeda(ativo.valor)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {ROTULO_TIPO[tipo]} · {rotuloMesAbreviado(mesesChaves[indiceAtivo])}
          </p>
        </div>
      )}
    </div>
  );
}

function ListaGastosPorCategoria({ dados }: { dados: GastoPorCategoria[] }) {
  const maiorValor = Math.max(...dados.map((item) => item.valor), 1);

  if (dados.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Nenhum gasto neste mês ainda.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {dados.map((item) => (
        <li key={item.nome}>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <span className="truncate text-sm text-foreground">{item.nome}</span>
            <span className="numeros-tabulares shrink-0 font-mono text-sm text-muted-foreground">
              {formatarMoeda(item.valor)}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-foreground/8">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.valor / maiorValor) * 100}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}
              className="h-1.5 rounded-full"
              style={{
                background: "var(--chart-1)",
                
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function FeedRecentes({ recentes }: { recentes: Transacao[] }) {
  if (recentes.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Nenhum lançamento ainda.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-[color:var(--border)]">
      {recentes.map((transacao) => (
        <li key={transacao.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{
              background: COR_SERIE[transacao.tipo],
              
            }}
            aria-hidden
          />
          <span className="numeros-tabulares shrink-0 font-mono text-[11px] text-muted-foreground">
            {transacao.data_vencimento.slice(8, 10)}/{transacao.data_vencimento.slice(5, 7)}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-foreground">
            {transacao.titulo}
            {transacao.pessoa ? (
              <span className="text-muted-foreground"> · {transacao.pessoa.nome}</span>
            ) : null}
          </span>
          <span className="numeros-tabulares shrink-0 font-mono text-sm text-muted-foreground">
            {formatarMoeda(transacao.valor)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ResumoPainel({
  supabase,
  pessoas,
  categorias,
  aoCriarPessoa,
  aoCriarCategoria,
  aoSair,
}: {
  supabase: SupabaseClient;
  pessoas: Pessoa[];
  categorias: Categoria[];
  aoCriarPessoa: (nome: string) => Promise<Pessoa>;
  aoCriarCategoria: (nome: string) => Promise<Categoria>;
  aoSair: () => void;
}) {
  const [dados, setDados] = useState<DadosResumo | null>(null);
  const [serieAtiva, setSerieAtiva] = useState<TipoTransacao>("despesa");
  const [exportando, setExportando] = useState(false);

  async function exportar(formato: "csv" | "xlsx") {
    setExportando(true);
    try {
      const transacoes = await buscarTodasTransacoes(supabase);
      if (transacoes.length === 0) {
        toast.info("Não há lançamentos para exportar ainda.");
        return;
      }
      if (formato === "csv") exportarCsv(transacoes);
      else exportarXlsx(transacoes);
      toast.success(`${transacoes.length} lançamentos exportados.`);
    } catch (excecao) {
      toast.error(
        excecao instanceof Error ? excecao.message : "Não foi possível exportar os dados.",
      );
    } finally {
      setExportando(false);
    }
  }

  useEffect(() => {
    let cancelado = false;
    buscarDadosResumo(supabase, pessoas).then((resultado) => {
      if (!cancelado) setDados(resultado);
    });
    return () => {
      cancelado = true;
    };
  }, [supabase, pessoas]);

  async function recarregar() {
    setDados(await buscarDadosResumo(supabase, pessoas));
  }

  if (!dados) {
    return <div className="flex-1 px-4 py-6 text-sm text-muted-foreground">Carregando resumo...</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:px-6">
      <div className="flex justify-end gap-2">
        <ImportarLancamentos
          supabase={supabase}
          pessoas={pessoas}
          categorias={categorias}
          aoCriarPessoa={aoCriarPessoa}
          aoCriarCategoria={aoCriarCategoria}
          aoConcluir={recarregar}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={exportando}>
              <Download />
              {exportando ? "Exportando..." : "Exportar"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => exportar("xlsx")}>Excel (.xlsx)</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => exportar("csv")}>CSV (.csv)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <AnelKpi tipo="despesa" valor={dados.totalGastosMes} progresso={dados.progresso.despesa} />
        <AnelKpi
          tipo="a_pagar"
          valor={dados.totalAPagarPendente}
          progresso={dados.progresso.a_pagar}
        />
        <AnelKpi
          tipo="a_receber"
          valor={dados.totalAReceberPendente}
          progresso={dados.progresso.a_receber}
        />
      </div>

      <Painel
        titulo={`${ROTULO_TIPO[serieAtiva]} · últimos ${QUANTIDADE_MESES_EVOLUCAO} meses`}
        acessorio={
          <div className="flex gap-1">
            {(Object.keys(ROTULO_TIPO) as TipoTransacao[]).map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => setSerieAtiva(tipo)}
                className={`rounded-full border px-2.5 py-1 text-[11px] whitespace-nowrap transition-colors ${
                  serieAtiva === tipo
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-[color:var(--border)] text-muted-foreground hover:text-foreground"
                }`}
              >
                {ROTULO_TIPO[tipo]}
              </button>
            ))}
          </div>
        }
      >
        <GraficoTemporal
          serie={dados.evolucao[serieAtiva]}
          mesesChaves={dados.mesesChaves}
          tipo={serieAtiva}
        />
      </Painel>

      <div className="grid gap-4 md:grid-cols-2">
        <Painel titulo="Gastos por categoria">
          <ListaGastosPorCategoria dados={dados.gastosPorCategoria} />
        </Painel>

        <Painel titulo="Saldo por pessoa">
          {dados.saldoPorPessoa.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma pendência com ninguém.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {dados.saldoPorPessoa.map(({ pessoa, saldo }) => (
                <li key={pessoa.id} className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm text-foreground">{pessoa.nome}</span>
                  <span
                    className={`numeros-tabulares shrink-0 font-mono text-sm ${
                      saldo > 0 ? "text-primary" : "text-destructive"
                    }`}
                  >
                    {formatarMoeda(saldo)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Painel>
      </div>

      <Painel titulo="Atividade recente">
        <FeedRecentes recentes={dados.recentes} />
      </Painel>

      {/* Só no mobile: no desktop "Sair" já mora na Sidebar. É a única
          rota pra deslogar no celular — TabBar não tem esse item. */}
      <Button variant="ghost" size="sm" onClick={aoSair} className="self-start md:hidden">
        <LogOut />
        Sair
      </Button>
    </div>
  );
}
