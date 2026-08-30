create table if not exists public.roadmap_adaptation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  roadmap_id uuid not null references public.roadmaps(id) on delete cascade,
  roadmap_day integer not null,
  event_date date not null default current_date,
  reflection text not null default '',
  energy integer,
  difficulty integer,
  adaptation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, roadmap_id, event_date)
);

alter table public.roadmap_adaptation_events enable row level security;
create policy "Users can read own roadmap adaptation events" on public.roadmap_adaptation_events for select using (auth.uid() = user_id);
create policy "Users can insert own roadmap adaptation events" on public.roadmap_adaptation_events for insert with check (auth.uid() = user_id);
create policy "Users can update own roadmap adaptation events" on public.roadmap_adaptation_events for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists roadmap_adaptation_events_lookup on public.roadmap_adaptation_events(user_id, roadmap_id, event_date desc);
