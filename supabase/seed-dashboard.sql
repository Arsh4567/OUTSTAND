-- Run this in Supabase SQL Editor after replacing YOUR_USER_UUID.
-- Safe to run repeatedly because user_stats is upserted by primary/unique user_id.

insert into public.user_stats (
  user_id,
  total_xp,
  level,
  streak_days,
  current_level_xp,
  next_level_xp
)
values (
  'YOUR_USER_UUID'::uuid,
  0,
  1,
  0,
  0,
  1000
)
on conflict (user_id) do update set
  total_xp = excluded.total_xp,
  level = excluded.level,
  streak_days = excluded.streak_days,
  current_level_xp = excluded.current_level_xp,
  next_level_xp = excluded.next_level_xp;
