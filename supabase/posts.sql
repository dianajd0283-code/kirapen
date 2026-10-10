-- キラペン 第2弾 ステップ3〜5：投稿・タイムライン・わかる・通報・ブロック・運営
-- Supabase の「SQL Editor」に全部貼り付けて「Run」（1回だけでOK。何回Runしても壊れません）。
-- 貼り付けたあと、最後の行より下に「)」が増えていたら消してからRunしてください。

-- 運営者（美月さん）
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;
drop policy if exists "see own admin row" on public.admins;
create policy "see own admin row" on public.admins for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;

-- 投稿
create table if not exists public.posts (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  kind text not null default 'word' check (kind in ('live', 'goods', 'coord', 'word')),
  body text not null default '' check (char_length(body) <= 300),
  image_path text check (image_path is null or char_length(image_path) <= 200),
  oshi text check (oshi is null or char_length(oshi) <= 40),
  oshi_color text check (oshi_color is null or oshi_color ~ '^#[0-9A-Fa-f]{6}$'),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_oshi_idx on public.posts (oshi);
alter table public.posts enable row level security;

drop policy if exists "read visible posts" on public.posts;
create policy "read visible posts" on public.posts for select
  using (hidden = false or user_id = (select auth.uid()) or public.is_admin());
drop policy if exists "write own posts" on public.posts;
create policy "write own posts" on public.posts for insert to authenticated
  with check (user_id = (select auth.uid()) and hidden = false);
drop policy if exists "delete own posts or admin" on public.posts;
create policy "delete own posts or admin" on public.posts for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
drop policy if exists "admin updates posts" on public.posts;
create policy "admin updates posts" on public.posts for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- わかる（いいね）
create table if not exists public.likes (
  post_id bigint not null references public.posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.likes enable row level security;
drop policy if exists "read likes" on public.likes;
create policy "read likes" on public.likes for select using (true);
drop policy if exists "add own like" on public.likes;
create policy "add own like" on public.likes for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "remove own like" on public.likes;
create policy "remove own like" on public.likes for delete to authenticated using (user_id = (select auth.uid()));

-- 通報
create table if not exists public.reports (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  reporter uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reason text not null check (char_length(reason) <= 40),
  created_at timestamptz not null default now(),
  unique (post_id, reporter)
);
alter table public.reports enable row level security;
drop policy if exists "send report" on public.reports;
create policy "send report" on public.reports for insert to authenticated with check (reporter = (select auth.uid()));
drop policy if exists "admin reads reports" on public.reports;
create policy "admin reads reports" on public.reports for select to authenticated using (public.is_admin());
drop policy if exists "admin clears reports" on public.reports;
create policy "admin clears reports" on public.reports for delete to authenticated using (public.is_admin());

-- 3人から通報された投稿は、運営が確認するまで自動で非表示
create or replace function public.auto_hide_reported() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if (select count(*) from public.reports where post_id = new.post_id) >= 3 then
    update public.posts set hidden = true where id = new.post_id;
  end if;
  return new;
end;
$$;
drop trigger if exists reports_auto_hide on public.reports;
create trigger reports_auto_hide after insert on public.reports
  for each row execute function public.auto_hide_reported();

-- ブロック
create table if not exists public.blocks (
  blocker uuid not null default auth.uid() references auth.users(id) on delete cascade,
  blocked uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked)
);
alter table public.blocks enable row level security;
drop policy if exists "manage own blocks" on public.blocks;
create policy "manage own blocks" on public.blocks for all to authenticated
  using (blocker = (select auth.uid())) with check (blocker = (select auth.uid()));

-- 権限
grant select on public.posts, public.likes to anon, authenticated;
grant insert, delete on public.posts to authenticated;
grant update (hidden) on public.posts to authenticated;
grant insert, delete on public.likes to authenticated;
grant insert, select, delete on public.reports to authenticated;
grant select, insert, delete on public.blocks to authenticated;
grant select on public.admins to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- 投稿の写真の保存場所（みんなが見られる。1枚3MBまで、本人のフォルダにだけ置ける）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "upload own post images" on storage.objects;
create policy "upload own post images" on storage.objects for insert to authenticated
  with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "delete own post images" on storage.objects;
create policy "delete own post images" on storage.objects for delete to authenticated
  using (bucket_id = 'post-images' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin()));
