create table if not exists public.learner_shelves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  session text not null,
  library jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.learner_shelves enable row level security;

revoke all on public.learner_shelves from anon;
grant select, insert, update on public.learner_shelves to authenticated;

drop policy if exists "own shelf read" on public.learner_shelves;
drop policy if exists "own shelf write" on public.learner_shelves;
drop policy if exists "own shelf update" on public.learner_shelves;

create policy "own shelf read"
  on public.learner_shelves
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "own shelf write"
  on public.learner_shelves
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "own shelf update"
  on public.learner_shelves
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.agent_keys (
  user_id uuid primary key references auth.users (id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now()
);

alter table public.agent_keys enable row level security;

revoke all on public.agent_keys from anon;
grant select, insert, update, delete on public.agent_keys to authenticated;

drop policy if exists "own agent key read" on public.agent_keys;
drop policy if exists "own agent key write" on public.agent_keys;
drop policy if exists "own agent key update" on public.agent_keys;
drop policy if exists "own agent key delete" on public.agent_keys;

create policy "own agent key read"
  on public.agent_keys
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "own agent key write"
  on public.agent_keys
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "own agent key update"
  on public.agent_keys
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own agent key delete"
  on public.agent_keys
  for delete
  to authenticated
  using (auth.uid() = user_id);
