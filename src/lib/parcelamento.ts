function adicionarMeses(dataISO: string, meses: number): string {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1 + meses, dia));
  return data.toISOString().slice(0, 10);
}

/** Divide o valor total em `parcelas` partes em centavos, floor nas primeiras
 * N-1 e a última absorvendo o resto — nunca perde centavo por arredondamento. */
export function dividirValor(valorTotal: number, parcelas: number): number[] {
  const totalCentavos = Math.round(valorTotal * 100);
  const parcelaCentavos = Math.floor(totalCentavos / parcelas);
  const valores = Array.from({ length: parcelas - 1 }, () => parcelaCentavos);
  const ultimaParcela = totalCentavos - parcelaCentavos * (parcelas - 1);
  valores.push(ultimaParcela);
  return valores.map((centavos) => centavos / 100);
}

export interface NovaTransacaoInput {
  tipo: "despesa" | "a_pagar" | "a_receber";
  titulo: string;
  descricao: string | null;
  valorTotal: number;
  dataVencimentoInicial: string;
  pessoaId: number | null;
  categoriaId: number | null;
  parcelas: number | null;
}

export function gerarLancamentos(input: NovaTransacaoInput) {
  const base = {
    tipo: input.tipo,
    titulo: input.titulo,
    descricao: input.descricao,
    pessoa_id: input.pessoaId,
    categoria_id: input.categoriaId,
    status: "pendente" as const,
  };

  if (!input.parcelas || input.parcelas < 2) {
    return [
      {
        ...base,
        valor: input.valorTotal,
        data_vencimento: input.dataVencimentoInicial,
        parcela_atual: null,
        parcela_total: null,
        grupo_parcelamento_id: null,
      },
    ];
  }

  const grupoParcelamentoId = crypto.randomUUID();
  const valores = dividirValor(input.valorTotal, input.parcelas);

  return valores.map((valor, indice) => ({
    ...base,
    valor,
    data_vencimento: adicionarMeses(input.dataVencimentoInicial, indice),
    parcela_atual: indice + 1,
    parcela_total: input.parcelas,
    grupo_parcelamento_id: grupoParcelamentoId,
  }));
}
