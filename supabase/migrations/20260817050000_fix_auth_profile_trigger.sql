-- Fix the auth trigger that was inserting into the removed profiles.xp column.
-- This trigger runs for every new email or OAuth user, so a bad column here
-- causes Supabase Auth to reject the entire account creation transaction.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    full_name,
    avatar_url,
    has_completed_onboarding,
    screen_time,
    total_xp,
    current_level
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, ''), '@', 1), 'Friend'),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email, ''), '@', 1), 'Friend'),
    new.raw_user_meta_data->>'avatar_url',
    false,
    null,
    0,
    1
  )
  on conflict (id) do update set
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);
  return new;
end;
$$;
