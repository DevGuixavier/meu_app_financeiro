"use client";

import { useState, type FormEvent } from "react";
import type { Categoria, Pessoa, Transacao, TipoTransacao } from "@/lib/types";
import { useMediaQuery } from "@/hooks/use-media-query";
import { CampoVinculo, SEM_VINCULO } from "@/components/NovoLancamentoSheet";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const ROTULO_TIPO: Record<TipoTransacao, string> = {
  despesa: "Gasto",
  a_pagar: "A pagar",
  a_receber: "A receber",
};

export interface EdicaoTransacaoInput {
  tipo: TipoTransacao;
  titulo: string;
  descricao: string | null;
  valor: number;
  dataVencimento: string;
  pessoaId: number | null;
  categoriaId: number | null;
}

export function EditarLancamentoSheet({
  transacao,
  pessoas,
  categorias,
  aoFechar,
  aoSalvar,
  aoExcluir,
  aoCriarPessoa,
  aoCriarCategoria,
}: {
  transacao: Transacao;
  pessoas: Pessoa[];
  categorias: Categoria[];
  aoFechar: () => void;
  aoSalvar: (id: number, input: EdicaoTransacaoInput) => Promise<void>;
  aoExcluir: (id: number) => Promise<void>;
  aoCriarPessoa: (nome: string) => Promise<Pessoa>;
  aoCriarCategoria: (nome: string) => Promise<Categoria>;
}) {
  const [tipo, setTipo] = useState<TipoTransacao>(transacao.tipo);
  const [titulo, setTitulo] = useState(transacao.titulo);
  const [valorTexto, setValorTexto] = useState(String(transacao.valor).replace(".", ","));
  const [dataVencimento, setDataVencimento] = useState(transacao.data_vencimento);
  const [descricao, setDescricao] = useState(transacao.descricao ?? "");
  const [pessoaId, setPessoaId] = useState(
    transacao.pessoa_id !== null ? String(transacao.pessoa_id) : SEM_VINCULO,
  );
  const [categoriaId, setCategoriaId] = useState(
    transacao.categoria_id !== null ? String(transacao.categoria_id) : SEM_VINCULO,
  );
  const [novaPessoa, setNovaPessoa] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [criandoPessoa, setCriandoPessoa] = useState(false);
  const [criandoCategoria, setCriandoCategoria] = useState(false);

  const ehDesktop = useMediaQuery("(min-width: 768px)");

  const valor = Number(valorTexto.replace(",", "."));
  const tituloValido = titulo.trim().length > 0;
  const valorValido = Number.isFinite(valor) && valor > 0;
  const formValido = tituloValido && valorValido && dataVencimento.trim().length > 0;

  async function confirmarNovaPessoa() {
    if (!novaPessoa.trim() || criandoPessoa) return;
    setCriandoPessoa(true);
    setErro(null);
    try {
      const pessoa = await aoCriarPessoa(novaPessoa.trim());
      setPessoaId(String(pessoa.id));
      setNovaPessoa("");
    } catch (excecao) {
      setErro(excecao instanceof Error ? excecao.message : "Não foi possível criar a pessoa.");
    } finally {
      setCriandoPessoa(false);
    }
  }

  async function confirmarNovaCategoria() {
    if (!novaCategoria.trim() || criandoCategoria) return;
    setCriandoCategoria(true);
    setErro(null);
    try {
      const categoria = await aoCriarCategoria(novaCategoria.trim());
      setCategoriaId(String(categoria.id));
      setNovaCategoria("");
    } catch (excecao) {
      setErro(excecao instanceof Error ? excecao.message : "Não foi possível criar a categoria.");
    } finally {
      setCriandoCategoria(false);
    }
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!formValido) return;
    setSalvando(true);
    setErro(null);
    try {
      await aoSalvar(transacao.id, {
        tipo,
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        valor,
        dataVencimento,
        pessoaId: pessoaId !== SEM_VINCULO ? Number(pessoaId) : null,
        categoriaId: categoriaId !== SEM_VINCULO ? Number(categoriaId) : null,
      });
      aoFechar();
    } catch (excecao) {
      setErro(excecao instanceof Error ? excecao.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarExclusao() {
    setExcluindo(true);
    setErro(null);
    try {
      await aoExcluir(transacao.id);
      aoFechar();
    } catch (excecao) {
      setErro(excecao instanceof Error ? excecao.message : "Não foi possível excluir.");
      setExcluindo(false);
    }
  }

  const formulario = (
    <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-4 md:px-0">
        <div className="flex flex-col gap-2">
          <Label htmlFor="tipo-edicao">Tipo</Label>
          <Select value={tipo} onValueChange={(valor) => setTipo(valor as TipoTransacao)}>
            <SelectTrigger id="tipo-edicao">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ROTULO_TIPO) as TipoTransacao[]).map((opcao) => (
                <SelectItem key={opcao} value={opcao}>
                  {ROTULO_TIPO[opcao]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="titulo-edicao">Título</Label>
          <Input
            id="titulo-edicao"
            value={titulo}
            onChange={(evento) => setTitulo(evento.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="valor-edicao">Valor</Label>
          <Input
            id="valor-edicao"
            inputMode="decimal"
            value={valorTexto}
            onChange={(evento) => setValorTexto(evento.target.value)}
            className="numeros-tabulares font-mono"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="vencimento-edicao">Vencimento</Label>
          <Input
            id="vencimento-edicao"
            type="date"
            value={dataVencimento}
            onChange={(evento) => setDataVencimento(evento.target.value)}
            className="numeros-tabulares font-mono"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="descricao-edicao">
            Descrição <span className="text-muted-foreground font-normal">(opcional)</span>
          </Label>
          <Textarea
            id="descricao-edicao"
            value={descricao}
            onChange={(evento) => setDescricao(evento.target.value)}
            rows={2}
          />
        </div>

        <CampoVinculo
          rotulo="Pessoa"
          valor={pessoaId}
          aoMudar={setPessoaId}
          opcoes={pessoas.map((pessoa) => ({ id: pessoa.id, nome: pessoa.nome }))}
          novoTexto={novaPessoa}
          aoMudarNovoTexto={setNovaPessoa}
          aoAdicionar={confirmarNovaPessoa}
          adicionando={criandoPessoa}
          placeholderNovo="Nova pessoa"
        />

        <CampoVinculo
          rotulo="Categoria"
          valor={categoriaId}
          aoMudar={setCategoriaId}
          opcoes={categorias.map((categoria) => ({ id: categoria.id, nome: categoria.nome }))}
          novoTexto={novaCategoria}
          aoMudarNovoTexto={setNovaCategoria}
          aoAdicionar={confirmarNovaCategoria}
          adicionando={criandoCategoria}
          placeholderNovo="Nova categoria"
        />
      </div>

      <div className="shrink-0 border-t px-5 py-4 md:px-0 md:pt-4">
        {erro && (
          <p role="alert" className="text-destructive mb-2 text-sm">
            {erro}
          </p>
        )}
        <div className="flex gap-2">
          {confirmandoExclusao ? (
            <Button
              type="button"
              variant="destructive"
              onClick={confirmarExclusao}
              disabled={excluindo}
              className="flex-1"
            >
              {excluindo ? "Excluindo..." : "Confirmar exclusão"}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmandoExclusao(true)}
              disabled={salvando}
            >
              Excluir
            </Button>
          )}
          <Button type="submit" disabled={!formValido || salvando || excluindo} className="flex-1">
            {salvando ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </div>
    </form>
  );

  if (ehDesktop) {
    return (
      <Dialog open onOpenChange={(aberto) => !aberto && aoFechar()}>
        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="font-display">Editar lançamento</DialogTitle>
            <DialogDescription>Ajuste os dados ou remova o lançamento.</DialogDescription>
          </DialogHeader>
          {formulario}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DrawerContent className="max-h-[92vh] overflow-hidden">
        <DrawerHeader>
          <DrawerTitle className="font-display">Editar lançamento</DrawerTitle>
          <DrawerDescription>Ajuste os dados ou remova o lançamento.</DrawerDescription>
        </DrawerHeader>
        {formulario}
      </DrawerContent>
    </Drawer>
  );
}
