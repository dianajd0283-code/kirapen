-- キラペン：アカウント削除の仕組み
-- Supabase の「SQL Editor」に全部貼り付けて「Run」（1回だけでOK）。
-- 最後の行より下に「)」が増えていたら消してからRunしてください。

create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not logged in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
