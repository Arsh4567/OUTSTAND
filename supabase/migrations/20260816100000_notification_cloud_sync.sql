-- Cloud state used by the notification scheduler.
-- The client keeps its existing localStorage UX, while this table gives the server
-- a durable, authenticated snapshot of habits/focus/completions for reminders.
create table if not exists public.user_productivity_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  habits jsonb not null default '[]'::jsonb,
  sessions jsonb not null default '[]'::jsonb,
  outstand jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_productivity_state enable row level security;

drop policy if exists "Users can read own productivity state" on public.user_productivity_state;
create policy "Users can read own productivity state"
  on public.user_productivity_state for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own productivity state" on public.user_productivity_state;
create policy "Users can insert own productivity state"
  on public.user_productivity_state for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own productivity state" on public.user_productivity_state;
create policy "Users can update own productivity state"
  on public.user_productivity_state for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists user_productivity_state_updated_at_idx
  on public.user_productivity_state(updated_at);

-- Scheduler bookkeeping prevents the same reminder from being sent repeatedly.
create table if not exists public.notification_delivery_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dedupe_key text not null,
  category text not null,
  sent_at timestamptz not null default now(),
  unique(user_id, dedupe_key)
);

alter table public.notification_delivery_log enable row level security;

drop policy if exists "Users can read own delivery log" on public.notification_delivery_log;
create policy "Users can read own delivery log"
  on public.notification_delivery_log for select
  to authenticated
  using (auth.uid() = user_id);

create index if not exists notification_delivery_log_user_sent_idx
  on public.notification_delivery_log(user_id, sent_at desc);
