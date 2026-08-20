alter table public.profiles add column if not exists last_seen_at timestamptz;

update public.profiles
set last_seen_at = coalesce(last_seen_at, updated_at, created_at)
where last_seen_at is null;

create index if not exists profiles_last_seen_at_idx on public.profiles(last_seen_at desc);
