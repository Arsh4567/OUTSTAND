create table if not exists public.roadmap_adaptation_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  roadmap_id uuid not null references public.ai_roadmaps(id) on delete cascade,
  generated_at timestamptz not null default now(),
  status text not null check (status in ('ahead','on_track','at_risk','recovery')),
  completion_pct integer not null default 0 check (completion_pct between 0 and 100),
  pace_ratio numeric(8,3) not null default 1,
  remaining_required integer not null default 0,
  available_days integer not null default 0,
  recommendation jsonb not null default '{}'::jsonb,
  accepted_at timestamptz,
  applied_at timestamptz
);

create index if not exists roadmap_adaptation_user_roadmap_idx
  on public.roadmap_adaptation_snapshots(user_id, roadmap_id, generated_at desc);

alter table public.roadmap_adaptation_snapshots enable row level security;

revoke all on public.roadmap_adaptation_snapshots from anon;
grant select, insert, update on public.roadmap_adaptation_snapshots to authenticated;

drop policy if exists "Users can read own adaptation snapshots" on public.roadmap_adaptation_snapshots;
create policy "Users can read own adaptation snapshots"
  on public.roadmap_adaptation_snapshots for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own adaptation snapshots" on public.roadmap_adaptation_snapshots;
create policy "Users can create own adaptation snapshots"
  on public.roadmap_adaptation_snapshots for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own adaptation snapshots" on public.roadmap_adaptation_snapshots;
create policy "Users can update own adaptation snapshots"
  on public.roadmap_adaptation_snapshots for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
