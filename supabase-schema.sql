-- ============================================================
--  King Food – Sorteio | Script SQL para Supabase
--  Cole no SQL Editor do Supabase e execute
-- ============================================================

-- Tabela de participantes
create table if not exists participants (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  whatsapp text not null unique,
  raffle_number text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índices únicos
create unique index if not exists idx_participants_whatsapp on participants(whatsapp);
create unique index if not exists idx_participants_raffle_number on participants(raffle_number);

-- ============================================================
--  Row Level Security (RLS)
-- ============================================================

-- Habilita RLS
alter table participants enable row level security;

-- Política: qualquer um pode INSERIR (cadastro público)
drop policy if exists "Public can insert" on participants;
create policy "Public can insert"
  on participants for insert
  to anon, authenticated
  with check (true);

-- Política: anônimo NÃO pode ler (protege dados dos participantes)
-- O admin usa a anon key + proteção no frontend, então precisamos permitir
-- leitura via anon para o painel admin funcionar.
-- ATENÇÃO: em produção, considere usar authenticated + service role key.
drop policy if exists "Anon can read" on participants;
create policy "Anon can read"
  on participants for select
  to anon, authenticated
  using (true);