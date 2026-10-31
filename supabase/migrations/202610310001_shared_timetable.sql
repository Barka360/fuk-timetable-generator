create table if not exists public.app_state (
  id text primary key check (id = 'main'),
  version integer not null default 1 check (version > 0),
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;
revoke all on public.app_state from anon;
grant select, insert, update on public.app_state to authenticated;

drop policy if exists "authenticated staff can read shared timetable" on public.app_state;
create policy "authenticated staff can read shared timetable"
  on public.app_state for select to authenticated using (true);

drop policy if exists "authenticated staff can create shared timetable" on public.app_state;
create policy "authenticated staff can create shared timetable"
  on public.app_state for insert to authenticated with check (id = 'main');

drop policy if exists "authenticated staff can update shared timetable" on public.app_state;
create policy "authenticated staff can update shared timetable"
  on public.app_state for update to authenticated using (id = 'main') with check (id = 'main');
