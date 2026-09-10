"use client";

import { useEffect, useMemo, useState, type PointerEvent, type ReactNode } from "react";
import { MdDownload, MdTrendingDown, MdTrendingUp } from "react-icons/md";
import { toast } from "sonner";
import { motion } from "motion/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
        .select("valor, categoria:categoria_id(nome, cor)")
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
      (gastosMes.data as
        | { valor: number; categoria: { nome: string; cor: string | null } | null }[]
        | null) ?? [],
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

/** [atual, anterior] a partir de uma série de 6 meses onde o último é o mês corrente. */
function ultimosDoisMeses(serie: number[]): [number, number] {
  return [serie[serie.length - 1] ?? 0, serie[serie.length - 2] ?? 0];
}

interface Variacao {
  percentual: number | null;
  direcao: "alta" | "queda" | "estavel" | "novo";
}

/** Compara o volume lançado (soma independente de status) desse mês contra o
 * anterior — os dois vêm da mesma série (`evolucao`), então funciona igual
 * pros três tipos, mesmo "a pagar"/"a receber" mostrando saldo pendente (não
 * volume) como valor principal do card. */
function calcularVariacao(atual: number, anterior: number): Variacao {
  if (anterior <= 0) {
    return atual > 0 ? { percentual: null, direcao: "novo" } : { percentual: null, direcao: "estavel" };
  }
  const percentual = Math.round(((atual - anterior) / anterior) * 100);
  if (percentual === 0) return { percentual: 0, direcao: "estavel" };
  return { percentual, direcao: percentual > 0 ? "alta" : "queda" };
}

function IndicadorVariacao({ variacao }: { variacao: Variacao }) {
  if (variacao.direcao === "estavel") {
    return <span className="text-[11px] text-muted-foreground">= vs mês passado</span>;
  }
  if (variacao.direcao === "novo") {
    return <span className="text-[11px] text-muted-foreground">novo este mês</span>;
  }
  const Icone = variacao.direcao === "alta" ? MdTrendingUp : MdTrendingDown;
  return (
    <span className="text-muted-foreground inline-flex items-center gap-0.5 text-[11px]">
      <Icone className="size-3" />
      {Math.abs(variacao.percentual ?? 0)}% vs mês passado
    </span>
  );
}

/** KPI com anel de progresso: quanto do mês já foi quitado naquele tipo. */
function AnelKpi({
  tipo,
  valor,
  progresso,
  variacao,
}: {
  tipo: TipoTransacao;
  valor: number;
  progresso: ProgressoTipo;
  variacao: Variacao;
}) {
  const raio = 26;
  const circunferencia = 2 * Math.PI * raio;
  const fracao = progresso.total > 0 ? progresso.quitado / progresso.total : 0;
  const percentual = Math.round(fracao * 100);
  const cor = COR_SERIE[tipo];

  return (
    <div className="relative isolate flex min-w-0 flex-col items-center gap-2 overflow-hidden px-1.5 py-5 md:px-3">
      {/* Blob desfocado no canto, na cor do próprio tipo — mesmo princípio do
          --aura-hero (halo atmosférico), só que localizado por célula em vez
          de cobrir a seção inteira. Dá profundidade sem virar três cards
          separados (ver comentário acima do card: um card dividido por
          propósito, não três caixas idênticas). */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-8 -right-8 -z-10 size-24 rounded-full blur-2xl"
        style={{ background: cor, opacity: 0.22 }}
      />
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
      <IndicadorVariacao variacao={variacao} />
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

/** Rótulo compacto do eixo Y. `Math.round` sozinho colide quando o teto é
 * pequeno (R$1 → ticks 0 / 0,5 / 1, e 0,5 arredondava pra 1 também — dois
 * "1" empilhados no eixo). Abaixo de 10, mantém 2 casas decimais pra
 * diferenciar; do resto pra cima, segue arredondando como antes. */
function rotuloEixoY(valor: number): string {
  if (valor === 0) return "0";
  if (Math.round(valor / 1000) >= 1) return `${Math.round(valor / 100) / 10}k`;
  if (valor < 10 && !Number.isInteger(valor)) {
    return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return String(Math.round(valor));
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

  // Quando o último ponto está perto do teto do gráfico (comum: mês atual é
  // o maior valor da série), o rótulo acima do ponto não cabe entre ele e a
  // borda do SVG — o topo dos caracteres é cortado (sem overflow visível no
  // SVG). Sem espaço, o rótulo desce pra baixo do ponto em vez de cortar.
  const rotuloUltimoCabeEmCima = ultimo.y - 14 - 10 > MARGEM.topo;
  const yRotuloUltimo = rotuloUltimoCabeEmCima ? ultimo.y - 14 : ultimo.y + 20;

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
              {rotuloEixoY(tick.valor)}
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
          y={yRotuloUltimo}
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

/** Categoria sem `cor` própria (legado, criada antes do rodízio automático
 * de cores em CadernoApp) cai num cinza neutro — nunca falha silenciosa. */
const COR_CATEGORIA_FALLBACK = "var(--muted-foreground)";

function TooltipCard({ children }: { children: ReactNode }) {
  return (
    <div className="border bg-card rounded-lg px-3 py-2 text-sm shadow-lg">{children}</div>
  );
}

function TooltipDonut({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; payload?: GastoPorCategoria }[];
  total: number;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const valor = item.value ?? 0;
  return (
    <TooltipCard>
      <p className="text-foreground font-medium">{item.name}</p>
      <p className="numeros-tabulares text-muted-foreground font-mono">
        {formatarMoeda(valor)} · {total > 0 ? Math.round((valor / total) * 100) : 0}%
      </p>
    </TooltipCard>
  );
}

function DonutCategorias({ dados }: { dados: GastoPorCategoria[] }) {
  const total = dados.reduce((soma, item) => soma + item.valor, 0);

  if (dados.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Nenhum gasto neste mês ainda.</p>;
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="mx-auto h-[168px] w-[168px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dados}
              dataKey="valor"
              nameKey="nome"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="var(--card)"
              strokeWidth={2}
              isAnimationActive
            >
              {dados.map((item) => (
                <Cell key={item.nome} fill={item.cor ?? COR_CATEGORIA_FALLBACK} />
              ))}
            </Pie>
            <Tooltip content={<TooltipDonut total={total} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex min-w-0 flex-1 flex-col gap-2.5">
        {dados.map((item) => (
          <li key={item.nome} className="flex items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: item.cor ?? COR_CATEGORIA_FALLBACK }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">{item.nome}</span>
            <span className="numeros-tabulares shrink-0 font-mono text-xs text-muted-foreground">
              {total > 0 ? Math.round((item.valor / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TooltipComparativo({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey?: string; value?: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <TooltipCard>
      <p className="text-muted-foreground mb-1 text-xs">{label}</p>
      {payload.map((entrada) => (
        <p
          key={entrada.dataKey}
          className="numeros-tabulares font-mono font-semibold"
          style={{ color: entrada.color }}
        >
          {ROTULO_TIPO[entrada.dataKey as TipoTransacao]}: {formatarMoeda(entrada.value ?? 0)}
        </p>
      ))}
    </TooltipCard>
  );
}

/** Volume lançado por tipo (independente de status), lado a lado, nos
 * últimos 6 meses — mesma série de `evolucao`, só que os três tipos juntos
 * em vez de um de cada vez como no GraficoTemporal. */
function BarComparativoTipos({
  evolucao,
  mesesChaves,
}: {
  evolucao: Record<TipoTransacao, number[]>;
  mesesChaves: string[];
}) {
  const dadosGrafico = mesesChaves.map((chave, indice) => ({
    mes: rotuloMesAbreviado(chave),
    despesa: evolucao.despesa[indice],
    a_pagar: evolucao.a_pagar[indice],
    a_receber: evolucao.a_receber[indice],
  }));

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dadosGrafico} barGap={3} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="mes"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(valor: number) =>
              Math.round(valor / 1000) >= 1 ? `${Math.round(valor / 100) / 10}k` : String(Math.round(valor))
            }
          />
          <Tooltip content={<TooltipComparativo />} cursor={{ fill: "var(--accent)" }} />
          {/* content customizado: o Recharts reordena o payload automático
              (parece alfabético pelo dataKey) e a legenda saía fora da
              ordem das barras — aqui fica sempre despesa/a_pagar/a_receber. */}
          <Legend
            content={() => (
              <ul className="mt-2 flex justify-center gap-4">
                {(["despesa", "a_pagar", "a_receber"] as TipoTransacao[]).map((tipo) => (
                  <li key={tipo} className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: COR_SERIE[tipo] }}
                      aria-hidden
                    />
                    {ROTULO_TIPO[tipo]}
                  </li>
                ))}
              </ul>
            )}
          />
          <Bar dataKey="despesa" fill="var(--chart-1)" radius={[3, 3, 0, 0]} maxBarSize={18} />
          <Bar dataKey="a_pagar" fill="var(--chart-2)" radius={[3, 3, 0, 0]} maxBarSize={18} />
          <Bar dataKey="a_receber" fill="var(--chart-3)" radius={[3, 3, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
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
}: {
  supabase: SupabaseClient;
  pessoas: Pessoa[];
  categorias: Categoria[];
  aoCriarPessoa: (nome: string) => Promise<Pessoa>;
  aoCriarCategoria: (nome: string) => Promise<Categoria>;
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
              <MdDownload />
              {exportando ? "Exportando..." : "Exportar"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => exportar("xlsx")}>Excel (.xlsx)</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => exportar("csv")}>CSV (.csv)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Uma superfície só, dividida por hairlines — não três cards iguais
          lado a lado. Três caixas idênticas com o mesmo raio, borda e sombra
          é ritmo de máquina; o divisor interno dá o mesmo agrupamento sem o
          serrilhado visual. glow-pulse aqui e só aqui: é o resumo do mês —
          a única superfície "em destaque" de verdade nesta tela. */}
      <div className="bg-card divide-border glow-pulse grid grid-cols-3 divide-x overflow-hidden rounded-xl border shadow-sm">
        <AnelKpi
          tipo="despesa"
          valor={dados.totalGastosMes}
          progresso={dados.progresso.despesa}
          variacao={calcularVariacao(...ultimosDoisMeses(dados.evolucao.despesa))}
        />
        <AnelKpi
          tipo="a_pagar"
          valor={dados.totalAPagarPendente}
          progresso={dados.progresso.a_pagar}
          variacao={calcularVariacao(...ultimosDoisMeses(dados.evolucao.a_pagar))}
        />
        <AnelKpi
          tipo="a_receber"
          valor={dados.totalAReceberPendente}
          progresso={dados.progresso.a_receber}
          variacao={calcularVariacao(...ultimosDoisMeses(dados.evolucao.a_receber))}
        />
      </div>

      <Painel
        titulo={`${ROTULO_TIPO[serieAtiva]} · últimos ${QUANTIDADE_MESES_EVOLUCAO} meses`}
        acessorio={
          <div className="flex gap-1.5">
            {(Object.keys(ROTULO_TIPO) as TipoTransacao[]).map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => setSerieAtiva(tipo)}
                className={`rounded-full px-3 py-1 text-[11px] font-medium whitespace-nowrap transition-colors ${
                  serieAtiva === tipo
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
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

      <Painel titulo={`Comparativo por tipo · últimos ${QUANTIDADE_MESES_EVOLUCAO} meses`}>
        <BarComparativoTipos evolucao={dados.evolucao} mesesChaves={dados.mesesChaves} />
      </Painel>

      <div className="grid gap-4 md:grid-cols-2">
        <Painel titulo="Gastos por categoria">
          <DonutCategorias dados={dados.gastosPorCategoria} />
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
    </div>
  );
}
