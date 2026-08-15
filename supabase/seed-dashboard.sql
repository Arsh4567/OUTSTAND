-- Dashboard bootstrap for existing Supabase users.
-- Run this entire script in Supabase SQL Editor.
-- It creates a default user_stats row only when one is missing.

insert into public.user_stats (
  user_id,
  total_xp,
  level,
  streak_days,
  current_level_xp,
  next_level_xp
)
select
  u.id,
  0,
  1,
  0,
  0,
  1000
from auth.users as u
where not exists (
  select 1
  from public.user_stats as s
  where s.user_id = u.id
);
