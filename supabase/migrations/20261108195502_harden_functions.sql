-- Security hardening (Supabase advisors): pin search_path on helper functions,
-- keep the membership lookup out of the exposed API schema, and make the signup
-- trigger function non-callable over the API.

create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.current_member_role() returns text
language sql stable security definer set search_path = '' as $$
  select data->>'role' from public.team_members
  where lower(data->>'email') = lower(coalesce(auth.jwt()->>'email', ''))
  limit 1
$$;
revoke all on function private.current_member_role() from public, anon;
grant execute on function private.current_member_role() to authenticated;

create or replace function public.is_member() returns boolean
language sql stable set search_path = '' as $$ select private.current_member_role() is not null $$;

create or replace function public.has_role(roles text[]) returns boolean
language sql stable set search_path = '' as $$ select coalesce(private.current_member_role() = any(roles), false) $$;

drop function if exists public.current_member_role();

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_member() from anon;
revoke execute on function public.has_role(text[]) from anon;
