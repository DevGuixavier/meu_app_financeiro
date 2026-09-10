// Espelha o formato gerado por exportacao.ts, mas lendo. As mesmas duas CVEs
// do pacote xlsx (prototype pollution, ReDoS) citadas em exportacao.ts SÓ se
// aplicam aqui: importar exige ler arquivo do usuário via XLSX.read. O risco
// fica contido ao navegador de quem importa o próprio arquivo — não é
// execução no servidor nem afeta outros usuários — mas é real, então:
// nunca aceitar import de arquivo que não veio do próprio usuário.
import * as XLSX from "xlsx";
import type { TipoTransacao } from "@/lib/types";

const TIPO_POR_ROTULO: Record<string, TipoTransacao> = {
  Gasto: "despesa",
  "A pagar": "a_pagar",
  "A receber": "a_receber",
};

export interface LinhaImportacao {
  numeroLinha: number;
  tipo: TipoTransacao;
  titulo: string;
  descricao: string | null;
  valor: number;
  dataVencimento: string;
  quitado: boolean;
  dataQuitacao: string | null;
  nomePessoa: string | null;
  nomeCategoria: string | null;
  parcelaAtual: number | null;
  parcelaTotal: number | null;
}

export interface ErroImportacao {
  numeroLinha: number;
  motivo: string;
}

export interface ResultadoParse {
  linhas: LinhaImportacao[];
  erros: ErroImportacao[];
}

function normalizarData(valor: string): string | null {
  const texto = valor.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;
  // dd/mm/aaaa — o formato que o Excel costuma assumir ao reformatar a
  // coluna de data sozinho quando a planilha é editada e salva de novo.
  const combinacao = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (combinacao) return `${combinacao[3]}-${combinacao[2]}-${combinacao[1]}`;
  return null;
}

function normalizarValor(valor: unknown): number | null {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  if (typeof valor !== "string") return null;
  const texto = valor.trim().replace(/\./g, "").replace(",", ".");
  // replace(/\./g,"") assume separador de milhar com ponto (padrão pt-BR);
  // se não tiver vírgula decimal, essa troca não faz sentido — refaz sem ela.
  const numero = valor.includes(",") ? Number(texto) : Number(valor.trim());
  return Number.isFinite(numero) ? numero : null;
}

function normalizarInteiro(valor: unknown): number | null {
  if (valor === "" || valor === null || valor === undefined) return null;
  const numero = typeof valor === "number" ? valor : Number(String(valor).trim());
  return Number.isInteger(numero) ? numero : null;
}

function linhaParaLancamento(
  linha: Record<string, unknown>,
  numeroLinha: number,
): LinhaImportacao | ErroImportacao {
  const tipoTexto = String(linha["Tipo"] ?? "").trim();
  const tipo = TIPO_POR_ROTULO[tipoTexto];
  if (!tipo) {
    return { numeroLinha, motivo: `Tipo "${tipoTexto}" não reconhecido (use Gasto, A pagar ou A receber).` };
  }

  const titulo = String(linha["Título"] ?? "").trim();
  if (!titulo) return { numeroLinha, motivo: "Título vazio." };

  const valor = normalizarValor(linha["Valor"]);
  if (valor === null || valor <= 0) return { numeroLinha, motivo: `Valor inválido: "${linha["Valor"]}".` };

  const dataVencimento = normalizarData(String(linha["Vencimento"] ?? ""));
  if (!dataVencimento) {
    return { numeroLinha, motivo: `Vencimento não reconhecido: "${linha["Vencimento"]}" (use AAAA-MM-DD).` };
  }

  const statusTexto = String(linha["Status"] ?? "").trim().toLowerCase();
  const quitado = statusTexto === "quitado";
  const dataQuitacaoTexto = String(linha["Data de quitação"] ?? "").trim();
  const dataQuitacao = quitado ? (normalizarData(dataQuitacaoTexto) ?? dataVencimento) : null;

  const descricao = String(linha["Descrição"] ?? "").trim() || null;
  const nomePessoa = String(linha["Pessoa"] ?? "").trim() || null;
  const nomeCategoria = String(linha["Categoria"] ?? "").trim() || null;

  return {
    numeroLinha,
    tipo,
    titulo,
    descricao,
    valor,
    dataVencimento,
    quitado,
    dataQuitacao,
    nomePessoa,
    nomeCategoria,
    parcelaAtual: normalizarInteiro(linha["Parcela atual"]),
    parcelaTotal: normalizarInteiro(linha["Parcela total"]),
  };
}

function processarLinhas(registros: Record<string, unknown>[]): ResultadoParse {
  const linhas: LinhaImportacao[] = [];
  const erros: ErroImportacao[] = [];
  registros.forEach((registro, indice) => {
    // +2: linha 1 é o cabeçalho, e planilhas contam a partir de 1.
    const resultado = linhaParaLancamento(registro, indice + 2);
    if ("motivo" in resultado) erros.push(resultado);
    else linhas.push(resultado);
  });
  return { linhas, erros };
}

function dividirLinhaCsv(linha: string): string[] {
  const campos: string[] = [];
  let atual = "";
  let dentroDeAspas = false;
  for (let i = 0; i < linha.length; i++) {
    const char = linha[i];
    if (dentroDeAspas) {
      if (char === '"' && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else if (char === '"') {
        dentroDeAspas = false;
      } else {
        atual += char;
      }
    } else if (char === '"') {
      dentroDeAspas = true;
    } else if (char === ";") {
      campos.push(atual);
      atual = "";
    } else {
      atual += char;
    }
  }
  campos.push(atual);
  return campos;
}

function parseCsv(texto: string): ResultadoParse {
  const semBom = texto.replace(/^﻿/, "");
  const linhasTexto = semBom.split(/\r\n|\n/).filter((linha) => linha.trim().length > 0);
  if (linhasTexto.length < 2) return { linhas: [], erros: [] };

  const cabecalhos = dividirLinhaCsv(linhasTexto[0]);
  const registros = linhasTexto.slice(1).map((linhaTexto) => {
    const campos = dividirLinhaCsv(linhaTexto);
    const registro: Record<string, string> = {};
    cabecalhos.forEach((cabecalho, indice) => {
      registro[cabecalho] = campos[indice] ?? "";
    });
    return registro;
  });
  return processarLinhas(registros);
}

function parseXlsx(bytes: ArrayBuffer): ResultadoParse {
  const livro = XLSX.read(bytes, { type: "array" });
  const nomeAba = livro.SheetNames[0];
  const planilha = livro.Sheets[nomeAba];
  // raw:false formata cada célula pelo texto exibido (respeita dateNF pra
  // datas), então tanto número quanto data chegam como string previsível —
  // sem isso, data reformatada pelo Excel vira serial number opaco.
  const registros = XLSX.utils.sheet_to_json<Record<string, unknown>>(planilha, {
    raw: false,
    dateNF: "yyyy-mm-dd",
  });
  return processarLinhas(registros);
}

export async function parseArquivoImportacao(arquivo: File): Promise<ResultadoParse> {
  const nome = arquivo.name.toLowerCase();
  if (nome.endsWith(".csv")) {
    return parseCsv(await arquivo.text());
  }
  if (nome.endsWith(".xlsx") || nome.endsWith(".xls")) {
    return parseXlsx(await arquivo.arrayBuffer());
  }
  throw new Error("Formato não suportado — use .csv ou .xlsx.");
}
