-- Inbox CRM: workspace schema.
-- Each collection is a table of JSON documents (id + data) that mirrors src/data/types.ts,
-- so the client store and the database share one shape. Workspace-wide settings live in `settings`.

create table if not exists public.team_members (id text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.clients      (id text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.leads        (id text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.campaigns    (id text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.tasks        (id text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.metrics      (id text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.activities   (id text primary key, data jsonb not null, updated_at timestamptz not null default now());
-- keys: agency, packages, stages, integrations
create table if not exists public.settings     (id text primary key, data jsonb not null, updated_at timestamptz not null default now());

create index if not exists campaigns_client_idx on public.campaigns ((data->>'clientId'));
create index if not exists tasks_assignee_idx on public.tasks ((data->>'assigneeId'));
create unique index if not exists team_members_email_idx on public.team_members (lower(data->>'email'));

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------- membership helpers ----------
-- A signed-in user belongs to the workspace when a team member has their email.
create or replace function public.current_member_role() returns text
language sql stable security definer set search_path = public as $$
  select data->>'role' from public.team_members
  where lower(data->>'email') = lower(coalesce(auth.jwt()->>'email', ''))
  limit 1
$$;

create or replace function public.is_member() returns boolean
language sql stable as $$ select public.current_member_role() is not null $$;

create or replace function public.has_role(roles text[]) returns boolean
language sql stable as $$ select coalesce(public.current_member_role() = any(roles), false) $$;

-- ---------- row level security ----------
do $$
declare
  t text;
  -- table => roles allowed to write
  writers jsonb := '{
    "team_members": ["admin"],
    "settings":     ["admin"],
    "leads":        ["admin", "account_manager"],
    "clients":      ["admin", "account_manager", "copywriter", "designer"],
    "campaigns":    ["admin", "account_manager", "copywriter", "designer"],
    "tasks":        ["admin", "account_manager", "copywriter", "designer"],
    "metrics":      ["admin", "account_manager", "copywriter", "designer"],
    "activities":   ["admin", "account_manager", "copywriter", "designer"]
  }';
  roles text;
begin
  for t in select jsonb_object_keys(writers) loop
    roles := (select string_agg(quote_literal(r), ',') from jsonb_array_elements_text(writers->t) r);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop trigger if exists touch_%1$s on public.%1$I', t);
    execute format('create trigger touch_%1$s before update on public.%1$I for each row execute function public.touch_updated_at()', t);
    execute format('drop policy if exists "members read" on public.%I', t);
    execute format('create policy "members read" on public.%I for select to authenticated using (public.is_member())', t);
    execute format('drop policy if exists "role write" on public.%I', t);
    execute format('create policy "role write" on public.%I for all to authenticated using (public.has_role(array[%s])) with check (public.has_role(array[%s]))', t, roles, roles);
  end loop;
end $$;

-- ---------- bootstrap ----------
-- The first person to sign up becomes the workspace admin. Everyone after that
-- needs an invite (a team member row with their email, created on the Team page).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  display_name text := coalesce(new.raw_user_meta_data->>'name', initcap(replace(split_part(new.email, '@', 1), '.', ' ')));
begin
  if not exists (select 1 from public.team_members) then
    insert into public.team_members (id, data) values (
      new.id::text,
      jsonb_build_object('id', new.id::text, 'name', display_name, 'email', new.email, 'role', 'admin',
                         'title', 'Founder', 'color', '243', 'capacity', 40)
    );
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Default workspace settings so a fresh project works before demo data is loaded.
insert into public.settings (id, data) values
  ('agency', '{"name":"My Agency","website":"","email":"","currency":"EUR","address":""}'),
  ('packages', '[{"id":"p_starter","name":"Starter","price":1500,"campaignsPerMonth":4,"description":"Core flows and a weekly newsletter.","features":["4 campaigns / month","3 core flows","Monthly report"]},{"id":"p_growth","name":"Growth","price":2800,"campaignsPerMonth":8,"description":"Twice-weekly campaigns and full flow build-out.","features":["8 campaigns / month","All 5 core flows","A/B testing"]},{"id":"p_premium","name":"Premium","price":4500,"campaignsPerMonth":12,"description":"Full-service retention with SMS and segmentation.","features":["12 campaigns / month","Advanced segmentation","SMS"]}]'),
  ('stages', '[{"id":"s_new","name":"New lead","kind":"open","probability":0.05},{"id":"s_contacted","name":"Contacted","kind":"open","probability":0.1},{"id":"s_audit","name":"Audit sent","kind":"open","probability":0.25},{"id":"s_call","name":"Call booked","kind":"open","probability":0.4},{"id":"s_proposal","name":"Proposal sent","kind":"open","probability":0.6},{"id":"s_won","name":"Won","kind":"won","probability":1},{"id":"s_lost","name":"Lost","kind":"lost","probability":0}]'),
  ('integrations', '[{"id":"klaviyo","connected":false},{"id":"shopify","connected":false},{"id":"slack","connected":false},{"id":"gcal","connected":false}]')
on conflict (id) do nothing;

-- ---------- realtime ----------
-- Stream changes so everyone on the team sees updates live.
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['team_members','clients','leads','campaigns','tasks','metrics','activities','settings'] loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;
