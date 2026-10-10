-- キラペン 第2弾 ステップ1：ログインとMy Roomの保存
-- Supabase の「SQL Editor」に全部貼り付けて「Run」を押してください（1回だけでOK）。

-- 1) みんなに見せる部屋（キャラ・推し・部屋の飾り）
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text check (char_length(nickname) <= 24),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint profiles_data_size check (pg_column_size(data) < 800000)
);

alter table public.profiles enable row level security;

drop policy if exists "rooms are public" on public.profiles;
create policy "rooms are public" on public.profiles
  for select using (true);

drop policy if exists "insert own room" on public.profiles;
create policy "insert own room" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "update own room" on public.profiles;
create policy "update own room" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- 2) 本人だけが見られるデータ（貯金箱のお金の記録）
create table if not exists public.private_data (
  id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint private_data_size check (pg_column_size(data) < 800000)
);

alter table public.private_data enable row level security;

drop policy if exists "read own private data" on public.private_data;
create policy "read own private data" on public.private_data
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "insert own private data" on public.private_data;
create policy "insert own private data" on public.private_data
  for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "update own private data" on public.private_data;
create policy "update own private data" on public.private_data
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- 3) アプリから使えるようにする権限
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant select, insert, update on public.private_data to authenticated;
