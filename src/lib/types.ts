export type TipoTransacao = "despesa" | "a_pagar" | "a_receber";
export type StatusTransacao = "pendente" | "quitado";

export interface Pessoa {
  id: number;
  nome: string;
  telefone: string | null;
}

export interface Categoria {
  id: number;
  nome: string;
  cor: string | null;
}

export interface Transacao {
  id: number;
  tipo: TipoTransacao;
  titulo: string;
  descricao: string | null;
  valor: number;
  data_vencimento: string;
  pessoa_id: number | null;
  categoria_id: number | null;
  status: StatusTransacao;
  data_quitacao: string | null;
  parcela_atual: number | null;
  parcela_total: number | null;
  grupo_parcelamento_id: string | null;
  pessoa?: Pessoa | null;
  categoria?: Categoria | null;
}
