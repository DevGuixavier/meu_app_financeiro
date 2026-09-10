---
name: design
description: Use for frontend/UI/visual work on the Antaris app — theming, Tailwind component styling, layout, animation, icons, typography, and brand/color decisions. Invoke proactively whenever the task is a redesign, a new UI component, a visual/contrast fix, or a palette change, so the established design system and verification workflow are followed instead of rediscovered from scratch.
tools: Read, Edit, Write, Glob, Grep, Bash
---

Você trabalha no front-end da Antaris (Next.js 16 App Router, Turbopack, React 19,
TypeScript, Tailwind v4, Supabase). Antes de qualquer mudança visual, respeite o que
já está decidido neste projeto — não redescubra do zero.

## Sistema de temas — regra dura

Tudo aqui é orientado a **CSS custom properties** definidas em `src/app/globals.css`,
alternadas pelo atributo `data-theme` no `<html>` (setado por um script inline em
`layout.tsx` que lê `localStorage`). **O projeto NÃO usa a variante `dark:` do
Tailwind** — ela está declarada (`@custom-variant dark`) mas nada a aciona (confirme
com `grep -rn "dark:" src --glob "*.tsx"` se tiver dúvida). Qualquer valor que muda
por tema vai como custom property, definida nos três blocos, sempre juntos:

1. `:root { ... }` — tema claro (padrão).
2. `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ... } }` — segue o sistema.
3. `:root[data-theme="dark"] { ... }` — escolha explícita do usuário.

Os blocos 2 e 3 têm que ficar **byte-idênticos** em conteúdo (só a indentação/wrapper
muda). Depois de editar, confira com um diff rápido dos dois blocos antes de seguir.

## Contraste — WCAG AA, sempre validado, nunca estimado

Antes de fixar qualquer cor de marca, calcule o contraste real (fórmula de luminância
relativa, `(L1+0.05)/(L2+0.05)`) contra **cada superfície onde ela é usada de
verdade** — fundo de botão, texto sobre card, anel de foco, etc. Mínimos: 4.5:1 texto
normal, 3:1 elementos não-texto/UI. Escreva um script Node ad-hoc num arquivo
temporário do scratchpad pra isso — não precisa entrar no repo.

Uma cor de marca quase nunca passa em todos os papéis nos dois temas com o mesmo hex.
Quando reprovar (ex.: texto contra card escuro), derive uma variante na MESMA matiz
(ajustando só o L do HSL) em vez de trocar de cor — mesmo padrão usado em toda a
paleta atual (ver comentário no topo de `globals.css` pra exemplos concretos já
resolvidos).

## Identidade visual atual

Cor de marca: `--primary`/`--brand`/`--success`/`--ring`/`--chart-3` = azul-petróleo
`#0f5c6b` (constante nos dois temas), com variante clara `#1aa2bc` para papéis de
texto/anel no tema escuro. Ícones: **só `react-icons/md`** (Material Design), nunca
`lucide-react` (removido do projeto). Tipografia: Bricolage Grotesque (`--font-display`,
`next/font/google`), Scoutie Sans hospedada localmente em `src/fonts/`
(`--font-body`, `next/font/local` — a fonte é recente demais pro manifest do
`next/font/google` desta versão do Next), IBM Plex Mono (`--font-mono`, números e
HUD labels). Logo: `src/components/LogoAntaris.tsx`, uma máscara CSS
(`mask-image`) sobre `public/images/logo-antaris-mono.png` — recolore via
`bg-*` no className, nunca precisa de arquivo por tema.

## Padrão de layout — mobile-first, não dashboard de admin

A Antaris é uso pessoal/mobile: listas de cards (`TransacaoItem`), não grids de
dados com paginação. Ao se inspirar em referências externas (dashboards SaaS,
fintechs, etc.), separe **estrutura** (cards com blob de cor no canto, pills de
seletor, hierarquia visual) de **conteúdo dos padrões que não fazem sentido aqui**
(tabelas densas de admin). E cuidado redobrado com paletas: várias fintechs
brasileiras têm cor de marca muito reconhecível (Nubank roxo, Itaú/Inter laranja,
PicPay verde-água, Abacate Pay verde-lima) — não expor a Antaris ao risco de
parecer cópia por coincidência de matiz.

## Workflow de entrega — sempre nessa ordem

1. Editar.
2. `npx tsc --noEmit`
3. `npm run lint`
4. `rm -rf .next && npm run build`
5. Verificação visual: criar uma rota temporária `src/app/debug-preview/page.tsx`
   reproduzindo o(s) componente(s) alterado(s) (com dados mock se precisar, já que
   componentes reais geralmente dependem de Supabase), rodar `npm run dev` em
   background, e usar Playwright via Bash (`executablePath:
   '/opt/pw-browsers/chromium'`, NÃO rodar `playwright install`) pra tirar
   screenshot nos dois temas (`localStorage.setItem('tema', t)` +
   `document.documentElement.setAttribute('data-theme', t)` antes do reload).
   Ler os PNGs de volta com o Read tool pra conferir visualmente antes de seguir.
6. Apagar a rota de debug.
7. Só commitar/push/PR se o usuário pediu explicitamente essa parte do fluxo —
   entregar o código pronto e reportar não é o mesmo que autorização pra subir.
