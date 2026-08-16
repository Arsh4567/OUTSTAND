-- OUTSTAND notification preferences and delivery history.
-- Push subscriptions remain in the existing push_subscriptions table.

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  push_enabled boolean not null default false,
  habits_enabled boolean not null default true,
  goals_enabled boolean not null default true,
  motivational_enabled boolean not null default true,
  updates_enabled boolean not null default true,
  quiet_hours_enabled boolean not null default true,
  quiet_start time not null default '22:00',
  quiet_end time not null default '07:00',
  max_daily integer not null default 3 check (max_daily between 0 and 10),
  timezone text not null default 'UTC',
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('habit','goal','motivation','update','system')),
  title text not null,
  body text not null,
  url text not null default '/',
  dedupe_key text,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notification_events_user_created_idx
  on public.notification_events(user_id, created_at desc);
create unique index if not exists notification_events_dedupe_idx
  on public.notification_events(user_id, dedupe_key)
  where dedupe_key is not null;

alter table public.notification_preferences enable row level security;
alter table public.notification_events enable row level security;

create policy "Users can read their notification preferences"
  on public.notification_preferences for select
  using (auth.uid() = user_id);
create policy "Users can insert their notification preferences"
  on public.notification_preferences for insert
  with check (auth.uid() = user_id);
create policy "Users can update their notification preferences"
  on public.notification_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "Users can read their notification events"
  on public.notification_events for select
  using (auth.uid() = user_id);

create or replace function public.touch_notification_preferences()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notification_preferences_touch on public.notification_preferences;
create trigger notification_preferences_touch
before update on public.notification_preferences
for each row execute function public.touch_notification_preferences();
