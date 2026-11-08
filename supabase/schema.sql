-- Inbox CRM — Supabase schema (Postgres). Mirrors src/data/types.ts.
-- Run in the Supabase SQL editor, then set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.

create type role as enum ('admin', 'account_manager', 'copywriter', 'designer');
create type health as enum ('good', 'attention', 'at_risk');
create type campaign_status as enum ('idea', 'copywriting', 'design', 'client_review', 'approved', 'scheduled', 'sent');
create type approval_status as enum ('not_requested', 'pending', 'approved', 'changes_requested');
create type priority as enum ('urgent', 'high', 'medium', 'low');
create type flow_status as enum ('live', 'in_progress', 'not_built');
create type stage_kind as enum ('open', 'won', 'lost');

create table team_members (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  email text not null unique,
  role role not null default 'copywriter',
  title text,
  color text,
  capacity int not null default 40
);

create table packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null,
  campaigns_per_month int not null default 4,
  description text,
  features text[] not null default '{}'
);

create table pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind stage_kind not null default 'open',
  probability numeric not null default 0.1,
  position int not null
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text,
  color text,
  niche text,
  package_id uuid references packages,
  retainer numeric not null default 0,
  account_manager_id uuid references team_members,
  health health not null default 'good',
  contract_start date,
  contract_end date,
  list_size int not null default 0,
  esp text default 'Klaviyo',
  notes text,
  brand_kit jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table client_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  name text not null, role text, email text, phone text, is_primary boolean default false
);

create table flows (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  type text not null,
  status flow_status not null default 'not_built',
  emails int not null default 0,
  revenue_30d numeric not null default 0,
  conversion_rate numeric not null default 0
);

create table files (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  name text not null, kind text, size bigint, storage_path text, url text,
  uploaded_by uuid references team_members, uploaded_at timestamptz default now()
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  domain text,
  contact_name text, contact_role text, contact_email text, contact_phone text,
  stage_id uuid references pipeline_stages,
  value numeric not null default 0,
  owner_id uuid references team_members,
  stage_entered_at timestamptz default now(),
  platform text, niche text, est_revenue numeric, current_esp text, source text,
  next_follow_up timestamptz,
  converted_client_id uuid references clients,
  created_at timestamptz default now()
);

create table lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads on delete cascade,
  author_id uuid references team_members,
  body text not null,
  created_at timestamptz default now()
);

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  name text not null,
  subject text, preview_text text,
  send_at timestamptz not null,
  segment text,
  assignee_id uuid references team_members,
  status campaign_status not null default 'idea',
  copy text, design_url text,
  checklist jsonb not null default '{"links":false,"mobile":false,"utm":false,"spam":false}',
  approval approval_status not null default 'not_requested',
  metrics jsonb,
  created_at timestamptz default now()
);

create table campaign_comments (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns on delete cascade,
  author_id uuid references team_members,
  body text not null,
  created_at timestamptz default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  done boolean not null default false,
  priority priority not null default 'medium',
  due_date timestamptz,
  assignee_id uuid references team_members,
  client_id uuid references clients on delete set null,
  campaign_id uuid references campaigns on delete set null,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create table monthly_metrics (
  client_id uuid references clients on delete cascade,
  month date not null,
  emails_sent int, open_rate numeric, click_rate numeric, conversion_rate numeric,
  revenue numeric, list_size int, unsub_rate numeric,
  primary key (client_id, month)
);

create table activities (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references team_members,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  entity_name text,
  detail text,
  client_id uuid references clients on delete cascade,
  lead_id uuid references leads on delete cascade,
  created_at timestamptz default now()
);

-- Row level security: every signed-in team member can read; writes follow role.
create or replace function current_role_is(roles role[]) returns boolean
language sql stable security definer as $$
  select exists (select 1 from team_members where id = auth.uid() and role = any(roles))
$$;

do $$
declare t text;
begin
  foreach t in array array['team_members','packages','pipeline_stages','clients','client_contacts','flows','files','leads','lead_notes','campaigns','campaign_comments','tasks','monthly_metrics','activities']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "team can read" on %I for select to authenticated using (true)', t);
  end loop;
end $$;

create policy "admins manage settings" on packages for all to authenticated using (current_role_is('{admin}')) with check (current_role_is('{admin}'));
create policy "admins manage stages" on pipeline_stages for all to authenticated using (current_role_is('{admin}')) with check (current_role_is('{admin}'));
create policy "admins manage team" on team_members for all to authenticated using (current_role_is('{admin}')) with check (current_role_is('{admin}'));
create policy "sales manage leads" on leads for all to authenticated using (current_role_is('{admin,account_manager}')) with check (current_role_is('{admin,account_manager}'));
create policy "sales write notes" on lead_notes for insert to authenticated with check (current_role_is('{admin,account_manager}'));
create policy "managers edit clients" on clients for all to authenticated using (current_role_is('{admin,account_manager}')) with check (current_role_is('{admin,account_manager}'));
create policy "team edits client details" on client_contacts for all to authenticated using (true) with check (true);
create policy "team edits flows" on flows for all to authenticated using (true) with check (true);
create policy "team uploads files" on files for all to authenticated using (true) with check (true);
create policy "team edits campaigns" on campaigns for all to authenticated using (true) with check (true);
create policy "team comments" on campaign_comments for insert to authenticated with check (author_id = auth.uid());
create policy "team edits tasks" on tasks for all to authenticated using (true) with check (true);
create policy "team logs activity" on activities for insert to authenticated with check (actor_id = auth.uid());
