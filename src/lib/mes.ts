const NOMES_MES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const NOMES_MES_ABREVIADO = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export function rotuloMesAbreviado(chave: string): string {
  const [, mes] = chave.split("-").map(Number);
  return NOMES_MES_ABREVIADO[mes - 1];
}

/** Chave de mês no formato "AAAA-MM", usada para filtrar `data_vencimento`. */
export function chaveMesAtual(): string {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

export function deslocarMes(chave: string, deslocamento: number): string {
  const [ano, mes] = chave.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1 + deslocamento, 1));
  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function rotuloMes(chave: string): string {
  const [ano, mes] = chave.split("-").map(Number);
  return `${NOMES_MES[mes - 1]} ${ano}`;
}

export function dataVencePertenceAoMes(dataVencimento: string, chaveMes: string): boolean {
  return dataVencimento.slice(0, 7) === chaveMes;
}

export function limitesDoMes(chaveMes: string): { inicio: string; fimExclusivo: string } {
  return { inicio: `${chaveMes}-01`, fimExclusivo: `${deslocarMes(chaveMes, 1)}-01` };
}
