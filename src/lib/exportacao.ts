import type { SupabaseClient } from "@supabase/supabase-js";
// Usamos só as funções de ESCRITA do SheetJS (utils.json_to_sheet, write).
// As CVEs conhecidas do pacote (prototype pollution, ReDoS) disparam ao
// LER planilha não confiável via XLSX.read — não usamos essa função aqui,
// então esse caminho de ataque não existe neste código.
import * as XLSX from "xlsx";
import type { Transacao } from "@/lib/types";

const ROTULO_TIPO: Record<Transacao["tipo"], string> = {
  despesa: "Gasto",
  a_pagar: "A pagar",
  a_receber: "A receber",
};

const ROTULO_STATUS: Record<Transacao["status"], string> = {
  pendente: "Pendente",
  quitado: "Quitado",
};

const CABECALHOS = [
  "Tipo",
  "Título",
  "Descrição",
  "Valor",
  "Vencimento",
  "Status",
  "Data de quitação",
  "Pessoa",
  "Categoria",
  "Parcela atual",
  "Parcela total",
] as const;

type LinhaExportacao = Record<(typeof CABECALHOS)[number], string | number>;

export async function buscarTodasTransacoes(supabase: SupabaseClient): Promise<Transacao[]> {
  const { data, error } = await supabase
    .from("transacao")
    .select("*, pessoa:pessoa_id(id, nome, telefone), categoria:categoria_id(id, nome, cor)")
    .order("data_vencimento", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as Transacao[] | null) ?? [];
}

function paraLinhas(transacoes: Transacao[]): LinhaExportacao[] {
  return transacoes.map((transacao) => ({
    Tipo: ROTULO_TIPO[transacao.tipo],
    Título: transacao.titulo,
    Descrição: transacao.descricao ?? "",
    Valor: transacao.valor,
    Vencimento: transacao.data_vencimento,
    Status: ROTULO_STATUS[transacao.status],
    "Data de quitação": transacao.data_quitacao ?? "",
    Pessoa: transacao.pessoa?.nome ?? "",
    Categoria: transacao.categoria?.nome ?? "",
    "Parcela atual": transacao.parcela_atual ?? "",
    "Parcela total": transacao.parcela_total ?? "",
  }));
}

function nomeArquivo(extensao: string): string {
  const hoje = new Date().toISOString().slice(0, 10);
  return `antaris-lancamentos-${hoje}.${extensao}`;
}

function baixarArquivo(conteudo: BlobPart | BlobPart[], tipoMime: string, nome: string) {
  const partes = Array.isArray(conteudo) ? conteudo : [conteudo];
  const url = URL.createObjectURL(new Blob(partes, { type: tipoMime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.click();
  URL.revokeObjectURL(url);
}

function paraCampoCsv(valor: string | number): string {
  const texto = String(valor);
  // Ponto e vírgula como separador e vírgula decimal — é o que o Excel em
  // pt-BR espera por padrão; sem isso o valor cai tudo numa coluna só.
  return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

export function exportarCsv(transacoes: Transacao[]) {
  const linhas = paraLinhas(transacoes);
  const corpo = linhas
    .map((linha) =>
      CABECALHOS.map((cabecalho) => {
        const valor = linha[cabecalho];
        return paraCampoCsv(
          cabecalho === "Valor" && typeof valor === "number"
            ? valor.toFixed(2).replace(".", ",")
            : valor,
        );
      }).join(";"),
    )
    .join("\r\n");
  const csv = `${CABECALHOS.join(";")}\r\n${corpo}`;
  // BOM UTF-8 no início: sem ele o Excel no Windows lê acento como lixo.
  baixarArquivo(
    ["﻿", csv],
    "text/csv;charset=utf-8;",
    nomeArquivo("csv"),
  );
}

export function exportarXlsx(transacoes: Transacao[]) {
  const linhas = paraLinhas(transacoes);
  const planilha = XLSX.utils.json_to_sheet(linhas, { header: [...CABECALHOS] });
  planilha["!cols"] = [
    { wch: 10 }, // Tipo
    { wch: 28 }, // Título
    { wch: 32 }, // Descrição
    { wch: 12 }, // Valor
    { wch: 12 }, // Vencimento
    { wch: 10 }, // Status
    { wch: 16 }, // Data de quitação
    { wch: 18 }, // Pessoa
    { wch: 18 }, // Categoria
    { wch: 12 }, // Parcela atual
    { wch: 12 }, // Parcela total
  ];
  const livro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(livro, planilha, "Lançamentos");
  const arrayBuffer = XLSX.write(livro, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  baixarArquivo(
    arrayBuffer,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    nomeArquivo("xlsx"),
  );
}
