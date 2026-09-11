"use client";

import { useRef, useState } from "react";
import { MdUpload } from "react-icons/md";
import { toast } from "sonner";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Categoria, Pessoa } from "@/lib/types";
import { formatarMoeda } from "@/lib/moeda";
import { parseArquivoImportacao, type ErroImportacao, type LinhaImportacao } from "@/lib/importacao";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SEM_CATEGORIA = "nenhuma";

const LIMITE_PREVIA = 8;

export function ImportarLancamentos({
  supabase,
  pessoas,
  categorias,
  aoCriarPessoa,
  aoCriarCategoria,
  aoConcluir,
}: {
  supabase: SupabaseClient;
  pessoas: Pessoa[];
  categorias: Categoria[];
  aoCriarPessoa: (nome: string) => Promise<Pessoa>;
  aoCriarCategoria: (nome: string) => Promise<Categoria>;
  aoConcluir: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [aberto, setAberto] = useState(false);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [linhas, setLinhas] = useState<LinhaImportacao[]>([]);
  const [erros, setErros] = useState<ErroImportacao[]>([]);
  const [formato, setFormato] = useState<"app" | "extrato">("app");
  const [aplicarStatus, setAplicarStatus] = useState(true);
  const [importando, setImportando] = useState(false);
  // Sobrepõe nomeCategoria quando o formato é extrato: aquele campo vem
  // sempre null (extrato bancário não tem coluna Categoria), então quem
  // categoriza é a pessoa, linha a linha, via select na prévia.
  const [categoriaPorLinha, setCategoriaPorLinha] = useState<Record<number, number | null>>({});

  const nomesPessoaNovos = [
    ...new Set(
      linhas
        .map((linha) => linha.nomePessoa)
        .filter((nome): nome is string => !!nome)
        .filter((nome) => !pessoas.some((pessoa) => pessoa.nome.toLowerCase() === nome.toLowerCase())),
    ),
  ];
  const nomesCategoriaNovos = [
    ...new Set(
      linhas
        .map((linha) => linha.nomeCategoria)
        .filter((nome): nome is string => !!nome)
        .filter(
          (nome) => !categorias.some((categoria) => categoria.nome.toLowerCase() === nome.toLowerCase()),
        ),
    ),
  ];

  async function selecionarArquivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;
    try {
      const resultado = await parseArquivoImportacao(arquivo);
      if (resultado.linhas.length === 0 && resultado.erros.length === 0) {
        toast.info("A planilha não tem nenhuma linha de dados.");
        return;
      }
      setNomeArquivo(arquivo.name);
      setLinhas(resultado.linhas);
      setErros(resultado.erros);
      setFormato(resultado.formato);
      setCategoriaPorLinha({});
      setAberto(true);
    } catch (excecao) {
      toast.error(excecao instanceof Error ? excecao.message : "Não foi possível ler o arquivo.");
    }
  }

  async function confirmarImportacao() {
    setImportando(true);
    try {
      const mapaPessoas = new Map(pessoas.map((pessoa) => [pessoa.nome.toLowerCase(), pessoa.id]));
      for (const nome of nomesPessoaNovos) {
        const pessoa = await aoCriarPessoa(nome);
        mapaPessoas.set(nome.toLowerCase(), pessoa.id);
      }

      const mapaCategorias = new Map(
        categorias.map((categoria) => [categoria.nome.toLowerCase(), categoria.id]),
      );
      for (const nome of nomesCategoriaNovos) {
        const categoria = await aoCriarCategoria(nome);
        mapaCategorias.set(nome.toLowerCase(), categoria.id);
      }

      const registros = linhas.map((linha) => {
        const quitado = aplicarStatus && linha.quitado;
        // undefined = a pessoa não mexeu no select da linha (segue nomeCategoria
        // do arquivo, se tiver); null = escolheu "Nenhuma" explicitamente.
        const overrideCategoria = categoriaPorLinha[linha.numeroLinha];
        const categoriaId =
          overrideCategoria !== undefined
            ? overrideCategoria
            : linha.nomeCategoria
              ? (mapaCategorias.get(linha.nomeCategoria.toLowerCase()) ?? null)
              : null;
        return {
          tipo: linha.tipo,
          titulo: linha.titulo,
          descricao: linha.descricao,
          valor: linha.valor,
          data_vencimento: linha.dataVencimento,
          status: quitado ? "quitado" : "pendente",
          data_quitacao: quitado ? linha.dataQuitacao : null,
          pessoa_id: linha.nomePessoa ? (mapaPessoas.get(linha.nomePessoa.toLowerCase()) ?? null) : null,
          categoria_id: categoriaId,
          parcela_atual: linha.parcelaAtual,
          parcela_total: linha.parcelaTotal,
          // A planilha exportada não traz o id do grupo de parcelamento —
          // reimportar não religa as parcelas ao grupo original.
          grupo_parcelamento_id: null,
        };
      });

      const { error } = await supabase.from("transacao").insert(registros);
      if (error) throw new Error(error.message);

      toast.success(`${registros.length} lançamentos importados.`);
      setAberto(false);
      setLinhas([]);
      setErros([]);
      setCategoriaPorLinha({});
      aoConcluir();
    } catch (excecao) {
      toast.error(excecao instanceof Error ? excecao.message : "Não foi possível importar.");
    } finally {
      setImportando(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={selecionarArquivo}
      />
      <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
        <MdUpload />
        Importar
      </Button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Importar lançamentos</DialogTitle>
            <DialogDescription>{nomeArquivo}</DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span className="text-foreground font-medium">{linhas.length} prontos pra importar</span>
              {erros.length > 0 && (
                <span className="text-destructive">{erros.length} com problema (ignorados)</span>
              )}
              {nomesPessoaNovos.length > 0 && (
                <span className="text-muted-foreground">
                  {nomesPessoaNovos.length} pessoa(s) nova(s): {nomesPessoaNovos.join(", ")}
                </span>
              )}
              {nomesCategoriaNovos.length > 0 && (
                <span className="text-muted-foreground">
                  {nomesCategoriaNovos.length} categoria(s) nova(s): {nomesCategoriaNovos.join(", ")}
                </span>
              )}
            </div>

            {linhas.length > 0 && (
              <ul className="divide-border mb-3 divide-y overflow-hidden rounded-lg border">
                {linhas.slice(0, LIMITE_PREVIA).map((linha) => (
                  <li key={linha.numeroLinha} className="flex items-center gap-2 px-3 py-2 text-sm">
                    <span className="min-w-0 flex-1 truncate">{linha.titulo}</span>
                    <span className="numeros-tabulares text-muted-foreground shrink-0 font-mono text-xs">
                      {formatarMoeda(linha.valor)}
                    </span>
                    <Select
                      value={String(categoriaPorLinha[linha.numeroLinha] ?? SEM_CATEGORIA)}
                      onValueChange={(valor) =>
                        setCategoriaPorLinha((atual) => ({
                          ...atual,
                          [linha.numeroLinha]: valor === SEM_CATEGORIA ? null : Number(valor),
                        }))
                      }
                    >
                      <SelectTrigger className="h-7 w-28 shrink-0 text-xs">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SEM_CATEGORIA}>Sem categoria</SelectItem>
                        {categorias.map((categoria) => (
                          <SelectItem key={categoria.id} value={String(categoria.id)}>
                            {categoria.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </li>
                ))}
                {linhas.length > LIMITE_PREVIA && (
                  <li className="text-muted-foreground px-3 py-2 text-center text-xs">
                    + {linhas.length - LIMITE_PREVIA} outros
                  </li>
                )}
              </ul>
            )}

            {erros.length > 0 && (
              <ul className="divide-border mb-3 divide-y overflow-hidden rounded-lg border">
                {erros.slice(0, LIMITE_PREVIA).map((erro) => (
                  <li key={erro.numeroLinha} className="px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Linha {erro.numeroLinha}: </span>
                    <span className="text-destructive">{erro.motivo}</span>
                  </li>
                ))}
              </ul>
            )}

            {formato === "extrato" ? (
              <p className="text-muted-foreground text-sm">
                Extrato bancário detectado — tipo (gasto/recebimento) inferido pelo sinal do valor,
                lançamentos entram como quitados. Escolha a categoria de cada linha acima, se quiser.
              </p>
            ) : (
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="aplicar-status"
                  checked={aplicarStatus}
                  onCheckedChange={(marcado) => setAplicarStatus(marcado === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="aplicar-status" className="font-normal">
                  Respeitar a coluna Status da planilha — linhas marcadas &quot;Quitado&quot; entram
                  quitadas. Se desmarcar, tudo entra como pendente.
                </Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={confirmarImportacao}
              disabled={linhas.length === 0 || importando}
            >
              {importando ? "Importando..." : `Importar ${linhas.length} lançamentos`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
