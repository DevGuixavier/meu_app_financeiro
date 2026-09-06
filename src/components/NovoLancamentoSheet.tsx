"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { Categoria, Pessoa, TipoTransacao } from "@/lib/types";
import { dividirValor, type NovaTransacaoInput } from "@/lib/parcelamento";
import { formatarMoeda } from "@/lib/moeda";

export function NovoLancamentoSheet({
  tipo,
  pessoas,
  categorias,
  aoFechar,
  aoSalvar,
  aoCriarPessoa,
  aoCriarCategoria,
}: {
  tipo: TipoTransacao;
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
  const [pessoaId, setPessoaId] = useState<string>("");
  const [categoriaId, setCategoriaId] = useState<string>("");
  const [novaPessoa, setNovaPessoa] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

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
    if (!novaPessoa.trim()) return;
    const pessoa = await aoCriarPessoa(novaPessoa.trim());
    pessoas.push(pessoa);
    setPessoaId(String(pessoa.id));
    setNovaPessoa("");
  }

  async function confirmarNovaCategoria() {
    if (!novaCategoria.trim()) return;
    const categoria = await aoCriarCategoria(novaCategoria.trim());
    categorias.push(categoria);
    setCategoriaId(String(categoria.id));
    setNovaCategoria("");
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
        dataVencimentoInicial: new Date().toISOString().slice(0, 10),
        pessoaId: pessoaId ? Number(pessoaId) : null,
        categoriaId: categoriaId ? Number(categoriaId) : null,
        parcelas: parcelado ? numeroParcelas : null,
      });
      aoFechar();
    } catch (excecao) {
      setErro(excecao instanceof Error ? excecao.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-ink/30">
      <div className="mx-auto flex max-h-[90vh] w-full max-w-[420px] flex-col overflow-y-auto rounded-t-lg bg-paper px-5 pb-8 pt-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">Novo lançamento</h2>
          <button type="button" onClick={aoFechar} aria-label="Fechar" className="text-graphite">
            Fechar
          </button>
        </div>

        <form onSubmit={enviar} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-graphite">Título</span>
            <input
              value={titulo}
              onChange={(evento) => setTitulo(evento.target.value)}
              className="linha-pauta bg-transparent py-2 text-base text-ink outline-none"
              placeholder="Ex.: Mercado, empréstimo pro João"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-graphite">Valor total</span>
            <input
              inputMode="decimal"
              value={valorTexto}
              onChange={(evento) => setValorTexto(evento.target.value)}
              className="linha-pauta numeros-tabulares bg-transparent py-2 font-mono text-base text-ink outline-none"
              placeholder="0,00"
            />
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={parcelado}
              onChange={(evento) => setParcelado(evento.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm text-ink">Parcelado</span>
          </label>

          {parcelado && (
            <label className="flex flex-col gap-1">
              <span className="text-sm text-graphite">Número de parcelas</span>
              <input
                type="number"
                min={2}
                value={parcelas}
                onChange={(evento) => setParcelas(evento.target.value)}
                className="linha-pauta bg-transparent py-2 text-base text-ink outline-none"
              />
              {previaParcelas && (
                <span className="numeros-tabulares mt-1 font-mono text-sm text-graphite">
                  {previaParcelas}
                </span>
              )}
            </label>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-sm text-graphite">Descrição (opcional)</span>
            <textarea
              value={descricao}
              onChange={(evento) => setDescricao(evento.target.value)}
              rows={2}
              className="linha-pauta resize-none bg-transparent py-2 text-base text-ink outline-none"
              placeholder="Contexto livre: eu paguei X, ele pagou Y..."
            />
          </label>

          <div className="flex flex-col gap-1">
            <span className="text-sm text-graphite">Pessoa (opcional)</span>
            <select
              value={pessoaId}
              onChange={(evento) => setPessoaId(evento.target.value)}
              className="linha-pauta bg-transparent py-2 text-base text-ink outline-none"
            >
              <option value="">Nenhuma</option>
              {pessoas.map((pessoa) => (
                <option key={pessoa.id} value={pessoa.id}>
                  {pessoa.nome}
                </option>
              ))}
            </select>
            <div className="mt-1 flex gap-2">
              <input
                value={novaPessoa}
                onChange={(evento) => setNovaPessoa(evento.target.value)}
                placeholder="Nova pessoa"
                className="linha-pauta flex-1 bg-transparent py-1 text-sm text-ink outline-none"
              />
              <button type="button" onClick={confirmarNovaPessoa} className="text-sm text-moss">
                Adicionar
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm text-graphite">Categoria (opcional)</span>
            <select
              value={categoriaId}
              onChange={(evento) => setCategoriaId(evento.target.value)}
              className="linha-pauta bg-transparent py-2 text-base text-ink outline-none"
            >
              <option value="">Nenhuma</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
            </select>
            <div className="mt-1 flex gap-2">
              <input
                value={novaCategoria}
                onChange={(evento) => setNovaCategoria(evento.target.value)}
                placeholder="Nova categoria"
                className="linha-pauta flex-1 bg-transparent py-1 text-sm text-ink outline-none"
              />
              <button type="button" onClick={confirmarNovaCategoria} className="text-sm text-moss">
                Adicionar
              </button>
            </div>
          </div>

          {erro && <p className="text-sm text-rust">{erro}</p>}

          <button
            type="submit"
            disabled={!formValido || salvando}
            className="mt-2 rounded-sm bg-moss py-3 text-base font-medium text-paper disabled:opacity-40"
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </form>
      </div>
    </div>
  );
}
