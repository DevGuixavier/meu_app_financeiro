"use client";

import { useMemo, useState, type FormEvent } from "react";
import { MdAdd } from "react-icons/md";
import type { Categoria, Pessoa, TipoTransacao } from "@/lib/types";
import { dividirValor, type NovaTransacaoInput } from "@/lib/parcelamento";
import { formatarMoeda } from "@/lib/moeda";
import { chaveMesAtual } from "@/lib/mes";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const SEM_VINCULO = "nenhuma";

export function NovoLancamentoSheet({
  tipo,
  chaveMes,
  pessoas,
  categorias,
  aoFechar,
  aoSalvar,
  aoCriarPessoa,
  aoCriarCategoria,
}: {
  tipo: TipoTransacao;
  chaveMes: string;
  pessoas: Pessoa[];
  categorias: Categoria[];
  aoFechar: () => void;
  aoSalvar: (input: NovaTransacaoInput) => Promise<void>;
  aoCriarPessoa: (nome: string) => Promise<Pessoa>;
  aoCriarCategoria: (nome: string) => Promise<Categoria>;
}) {
  const [titulo, setTitulo] = useState("");
  const [valorTexto, setValorTexto] = useState("");
  const [parcelado, setParcelado] = useState(false);
  const [parcelas, setParcelas] = useState("2");
  const [descricao, setDescricao] = useState("");
  const [pessoaId, setPessoaId] = useState(SEM_VINCULO);
  const [categoriaId, setCategoriaId] = useState(SEM_VINCULO);
  const [novaPessoa, setNovaPessoa] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [criandoPessoa, setCriandoPessoa] = useState(false);
  const [criandoCategoria, setCriandoCategoria] = useState(false);

  const ehDesktop = useMediaQuery("(min-width: 768px)");

  const valor = Number(valorTexto.replace(",", "."));
  const numeroParcelas = Number(parcelas);
  const tituloValido = titulo.trim().length > 0;
  const valorValido = Number.isFinite(valor) && valor > 0;
  const parcelasValidas = !parcelado || (Number.isInteger(numeroParcelas) && numeroParcelas >= 2);
  const formValido = tituloValido && valorValido && parcelasValidas;

  const previaParcelas = useMemo(() => {
    if (!parcelado || !valorValido || !Number.isInteger(numeroParcelas) || numeroParcelas < 2) {
      return null;
    }
    const valores = dividirValor(valor, numeroParcelas);
    const primeira = valores[0];
    const ultima = valores[valores.length - 1];
    return primeira === ultima
      ? `${numeroParcelas}x de ${formatarMoeda(primeira)}`
      : `${numeroParcelas}x de ${formatarMoeda(primeira)} (última ${formatarMoeda(ultima)})`;
  }, [parcelado, valorValido, valor, numeroParcelas]);

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
      await aoSalvar({
        tipo,
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        valorTotal: valor,
        // Se o mês visto é o mês real de hoje, mantém o dia exato de hoje;
        // se a pessoa navegou pra outro mês (ex.: lançando algo futuro),
        // ancora no dia 1 daquele mês — sem isso o lançamento sempre nascia
        // "hoje" e sumia da lista quando salvo enquanto se via outro mês.
        dataVencimentoInicial:
          chaveMes === chaveMesAtual() ? new Date().toISOString().slice(0, 10) : `${chaveMes}-01`,
        pessoaId: pessoaId !== SEM_VINCULO ? Number(pessoaId) : null,
        categoriaId: categoriaId !== SEM_VINCULO ? Number(categoriaId) : null,
        parcelas: parcelado ? numeroParcelas : null,
      });
      aoFechar();
    } catch (excecao) {
      setErro(excecao instanceof Error ? excecao.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  const formulario = (
    // Corpo rolável separado do rodapé de propósito: um formulário longo
    // (parcelado + pessoa/categoria abertos) passa da dobra em qualquer
    // aparelho, e se o botão "Salvar" estiver dentro da área que rola ele
    // fica inacessível. Fixo fora do scroll, ele nunca some.
    <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-4 md:px-0">
      <div className="flex flex-col gap-2">
        <Label htmlFor="titulo">Título</Label>
        <Input
          id="titulo"
          value={titulo}
          onChange={(evento) => setTitulo(evento.target.value)}
          placeholder="Ex.: Mercado, empréstimo pro João"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="valor">Valor total</Label>
        <Input
          id="valor"
          inputMode="decimal"
          value={valorTexto}
          onChange={(evento) => setValorTexto(evento.target.value)}
          placeholder="0,00"
          className="numeros-tabulares font-mono"
        />
      </div>

      <div className="flex items-center gap-2.5">
        <Checkbox
          id="parcelado"
          checked={parcelado}
          onCheckedChange={(marcado) => setParcelado(marcado === true)}
        />
        <Label htmlFor="parcelado" className="font-normal">
          Parcelado
        </Label>
      </div>

      {parcelado && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="parcelas">Número de parcelas</Label>
          <Input
            id="parcelas"
            type="number"
            min={2}
            value={parcelas}
            onChange={(evento) => setParcelas(evento.target.value)}
            className="numeros-tabulares font-mono"
          />
          {previaParcelas && (
            <p className="numeros-tabulares text-primary font-mono text-sm">{previaParcelas}</p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="descricao">
          Descrição <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <Textarea
          id="descricao"
          value={descricao}
          onChange={(evento) => setDescricao(evento.target.value)}
          rows={2}
          placeholder="Contexto livre: eu paguei X, ele pagou Y..."
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
        <Button type="submit" size="lg" disabled={!formValido || salvando} className="w-full">
          {salvando ? "Salvando..." : "Salvar lançamento"}
        </Button>
      </div>
    </form>
  );

  if (ehDesktop) {
    return (
      <Dialog open onOpenChange={(aberto) => !aberto && aoFechar()}>
        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="font-display">Novo lançamento</DialogTitle>
            <DialogDescription>
              Preencha os dados. Parcelamento divide o valor automaticamente.
            </DialogDescription>
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
          <DrawerTitle className="font-display">Novo lançamento</DrawerTitle>
          <DrawerDescription>
            Preencha os dados. Parcelamento divide o valor automaticamente.
          </DrawerDescription>
        </DrawerHeader>
        {formulario}
      </DrawerContent>
    </Drawer>
  );
}

export function CampoVinculo({
  rotulo,
  valor,
  aoMudar,
  opcoes,
  novoTexto,
  aoMudarNovoTexto,
  aoAdicionar,
  adicionando,
  placeholderNovo,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  opcoes: { id: number; nome: string }[];
  novoTexto: string;
  aoMudarNovoTexto: (valor: string) => void;
  aoAdicionar: () => void;
  adicionando: boolean;
  placeholderNovo: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>
        {rotulo} <span className="text-muted-foreground font-normal">(opcional)</span>
      </Label>
      <Select value={valor} onValueChange={aoMudar}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SEM_VINCULO}>Nenhuma</SelectItem>
          {opcoes.map((opcao) => (
            <SelectItem key={opcao.id} value={String(opcao.id)}>
              {opcao.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex gap-2">
        <Input
          value={novoTexto}
          onChange={(evento) => aoMudarNovoTexto(evento.target.value)}
          placeholder={placeholderNovo}
          className="h-9"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={aoAdicionar}
          disabled={!novoTexto.trim() || adicionando}
          className="h-9"
        >
          <MdAdd />
          {adicionando ? "Adicionando..." : "Adicionar"}
        </Button>
      </div>
    </div>
  );
}
