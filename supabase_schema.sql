-- ========================================================
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS SUPABASE
-- STUDIO & ESTÉTICA FACIAL
-- ========================================================
-- Como executar:
-- 1. Acesse https://supabase.com e entre no seu projeto
-- 2. No menu lateral esquerdo, clique em "SQL Editor"
-- 3. Cole este código abaixo e clique no botão verde "RUN"
-- ========================================================

-- Criação da tabela principal de sincronização de dados do Studio
create table if not exists app_data (
  id text primary key default 'studio_data',
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Row Level Security (RLS)
alter table app_data enable row level security;

-- Política de permissão para leitura e escrita pela aplicação Next.js
drop policy if exists "Acesso total app_data" on app_data;
create policy "Acesso total app_data" on app_data
  for all using (true) with check (true);

-- Notificação de sucesso
comment on table app_data is 'Dados sincronizados do Studio: agendamentos, clientes, pedidos, caixa e estoque';
