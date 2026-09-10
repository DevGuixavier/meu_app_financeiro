import type { TipoTransacao } from "@/lib/types";

export interface GastoPorCategoria {
  nome: string;
  valor: number;
  /** Mesma cor do selo da categoria em outros lugares da UI (TransacaoItem,
   * etc.) — null pra "Sem categoria" e pra "Outras" (some categorias somadas
   * não têm uma cor única pra representar). */
  cor: string | null;
}

const LIMITE_CATEGORIAS_VISIVEIS = 6;

/** Agrupa e soma por categoria, ordenado do maior pro menor. Além do limite,
 * dobra a cauda em "Outras" — mantém a lista curta e permite comparação direta. */
export function agruparPorCategoria(
  linhas: { valor: number; categoria: { nome: string; cor: string | null } | null }[],
): GastoPorCategoria[] {
  const somaPorNome = new Map<string, number>();
  const corPorNome = new Map<string, string | null>();
  for (const linha of linhas) {
    const nome = linha.categoria?.nome ?? "Sem categoria";
    somaPorNome.set(nome, (somaPorNome.get(nome) ?? 0) + linha.valor);
    if (!corPorNome.has(nome)) corPorNome.set(nome, linha.categoria?.cor ?? null);
  }

  const ordenado = [...somaPorNome.entries()]
    .map(([nome, valor]) => ({ nome, valor, cor: corPorNome.get(nome) ?? null }))
    .sort((a, b) => b.valor - a.valor);

  if (ordenado.length <= LIMITE_CATEGORIAS_VISIVEIS) return ordenado;

  const visiveis = ordenado.slice(0, LIMITE_CATEGORIAS_VISIVEIS - 1);
  const outras = ordenado.slice(LIMITE_CATEGORIAS_VISIVEIS - 1);
  const somaOutras = outras.reduce((soma, item) => soma + item.valor, 0);
  return [...visiveis, { nome: "Outras", valor: somaOutras, cor: null }];
}

/** Soma por (mês, tipo), retornando uma série alinhada a `mesesChaves` para cada tipo. */
export function agruparPorMesETipo(
  linhas: { tipo: TipoTransacao; valor: number; data_vencimento: string }[],
  mesesChaves: string[],
): Record<TipoTransacao, number[]> {
  const indicePorChave = new Map(mesesChaves.map((chave, indice) => [chave, indice]));
  const series: Record<TipoTransacao, number[]> = {
    despesa: mesesChaves.map(() => 0),
    a_pagar: mesesChaves.map(() => 0),
    a_receber: mesesChaves.map(() => 0),
  };

  for (const linha of linhas) {
    const indice = indicePorChave.get(linha.data_vencimento.slice(0, 7));
    if (indice === undefined) continue;
    series[linha.tipo][indice] += linha.valor;
  }

  return series;
}
