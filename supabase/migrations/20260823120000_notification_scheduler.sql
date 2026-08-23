-- Supabase-native notification scheduling primitives.
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

create table if not exists public.notification_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id text,
  category text not null check (category in ('habit','goal','motivation','update','system')),
  title text not null,
  body text not null,
  url text not null default '/',
  local_time time not null,
  timezone text not null default 'UTC',
  enabled boolean not null default true,
  days_of_week smallint[] not null default '{0,1,2,3,4,5,6}',
  last_scheduled_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notification_jobs_due_idx on public.notification_jobs(enabled, local_time, timezone);
create index if not exists notification_jobs_user_idx on public.notification_jobs(user_id);

alter table public.notification_jobs enable row level security;
drop policy if exists "Users can read their notification jobs" on public.notification_jobs;
create policy "Users can read their notification jobs" on public.notification_jobs for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their notification jobs" on public.notification_jobs;
create policy "Users can insert their notification jobs" on public.notification_jobs for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their notification jobs" on public.notification_jobs;
create policy "Users can update their notification jobs" on public.notification_jobs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete their notification jobs" on public.notification_jobs;
create policy "Users can delete their notification jobs" on public.notification_jobs for delete using (auth.uid() = user_id);

create or replace function public.enqueue_due_notification_jobs()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  job record;
  now_utc timestamptz := now();
  local_now timestamp;
  local_date date;
  local_dow smallint;
begin
  for job in select id, user_id, habit_id, category, title, body, url, local_time, timezone, days_of_week, last_scheduled_date from public.notification_jobs where enabled = true loop
    begin local_now := timezone(job.timezone, now_utc); exception when others then local_now := timezone('UTC', now_utc); end;
    local_date := local_now::date;
    local_dow := extract(dow from local_now)::smallint;
    if local_dow = any(job.days_of_week)
       and local_now::time >= job.local_time
       and local_now::time < (job.local_time + interval '5 minutes')
       and (job.last_scheduled_date is null or job.last_scheduled_date <> local_date) then
      insert into public.notification_events(user_id, category, title, body, url, dedupe_key, created_at)
      values (job.user_id, job.category, job.title, job.body, job.url, 'job:' || job.id::text || ':' || local_date::text, now_utc)
      on conflict (user_id, dedupe_key) do nothing;
      update public.notification_jobs set last_scheduled_date = local_date, updated_at = now_utc where id = job.id;
    end if;
  end loop;
end;
$$;

-- The scheduled step lives in Supabase. An Edge Function dispatcher is also
-- committed in this repository; deploying it requires Supabase project write access.
select cron.schedule('outstand-enqueue-due-notifications', '* * * * *', $$select public.enqueue_due_notification_jobs();$$);
