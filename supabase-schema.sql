-- SyncSINGIL realtime starter database
-- IMPORTANT: This shared JSON-state table is for a classroom/demo deployment with synthetic data only.
-- Do not store real borrower PII or financial records until you replace it with normalized tables
-- and borrower-scoped Row Level Security policies.

create table if not exists public.syncsingil_app_state (
  id text primary key default 'main' check (id = 'main'),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.syncsingil_app_state enable row level security;

-- Authenticated demo users can read the shared app state for cross-device synchronization.
-- For production, replace these broad demo policies with role- and borrower-scoped policies.
drop policy if exists "Authenticated users can read SyncSINGIL demo state" on public.syncsingil_app_state;
create policy "Authenticated users can read SyncSINGIL demo state"
  on public.syncsingil_app_state for select to authenticated using (true);

drop policy if exists "Authenticated users can insert SyncSINGIL demo state" on public.syncsingil_app_state;
create policy "Authenticated users can insert SyncSINGIL demo state"
  on public.syncsingil_app_state for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update SyncSINGIL demo state" on public.syncsingil_app_state;
create policy "Authenticated users can update SyncSINGIL demo state"
  on public.syncsingil_app_state for update to authenticated using (true) with check (true);

-- Enable Postgres Changes so connected clients receive updates in real time.
alter table public.syncsingil_app_state replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.syncsingil_app_state;
exception when duplicate_object then null;
end $$;
