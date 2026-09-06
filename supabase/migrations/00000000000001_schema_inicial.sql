-- Schema inicial: controle financeiro pessoal com fiado
-- pessoa, categoria, transacao (despesa / a_pagar / a_receber), com parcelamento e RLS por usuário.

create table public.pessoa (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null,
  telefone text,
  created_at timestamptz not null default now()
);

create index pessoa_user_id_idx on public.pessoa (user_id);

create table public.categoria (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null,
  cor text,
  created_at timestamptz not null default now()
);

create index categoria_user_id_idx on public.categoria (user_id);

create table public.transacao (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('despesa', 'a_pagar', 'a_receber')),
  titulo text not null,
  descricao text,
  valor numeric(10, 2) not null check (valor > 0),
  data_vencimento date not null,
  pessoa_id bigint references public.pessoa (id) on delete set null,
  categoria_id bigint references public.categoria (id) on delete set null,
  status text not null default 'pendente' check (status in ('pendente', 'quitado')),
  data_quitacao date,
  parcela_atual int,
  parcela_total int,
  grupo_parcelamento_id uuid,
  created_at timestamptz not null default now(),
  constraint transacao_parcelamento_consistente check (
    (parcela_atual is null and parcela_total is null and grupo_parcelamento_id is null)
    or (
      parcela_atual is not null
      and parcela_total is not null
      and grupo_parcelamento_id is not null
      and parcela_total >= 2
      and parcela_atual between 1 and parcela_total
    )
  )
);

create index transacao_user_id_idx on public.transacao (user_id);
create index transacao_pessoa_id_idx on public.transacao (pessoa_id);
create index transacao_categoria_id_idx on public.transacao (categoria_id);
create index transacao_grupo_parcelamento_idx on public.transacao (grupo_parcelamento_id);
create index transacao_vencimento_idx on public.transacao (data_vencimento);
-- índice composto para o filtro da tela principal: usuário + aba (tipo) + mês
create index transacao_user_tipo_vencimento_idx on public.transacao (user_id, tipo, data_vencimento);

-- Saldo por pessoa: a_receber pendente - a_pagar pendente, do usuário autenticado.
-- security_invoker garante que a RLS de transacao seja respeitada por quem consulta a view.
create view public.saldo_por_pessoa
with (security_invoker = true) as
select
  pessoa_id,
  sum(case when tipo = 'a_receber' and status = 'pendente' then valor else 0 end)
    - sum(case when tipo = 'a_pagar' and status = 'pendente' then valor else 0 end) as saldo
from public.transacao
where pessoa_id is not null
group by pessoa_id;

alter table public.pessoa enable row level security;
alter table public.categoria enable row level security;
alter table public.transacao enable row level security;

create policy pessoa_select on public.pessoa
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy pessoa_insert on public.pessoa
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy pessoa_update on public.pessoa
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy pessoa_delete on public.pessoa
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy categoria_select on public.categoria
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy categoria_insert on public.categoria
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy categoria_update on public.categoria
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy categoria_delete on public.categoria
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy transacao_select on public.transacao
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy transacao_insert on public.transacao
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy transacao_update on public.transacao
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy transacao_delete on public.transacao
  for delete to authenticated
  using ((select auth.uid()) = user_id);
