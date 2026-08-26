-- Fix production cloud-sync RPC permissions.
-- The API authenticates the user and calls this function through Supabase's
-- authenticated role, so the function must be executable by authenticated
-- users and must enforce ownership itself.

create or replace function public.upsert_user_productivity_state(
  p_habits jsonb,
  p_sessions jsonb,
  p_outstand jsonb
)
returns public.user_productivity_state
language plpgsql
security invoker
set search_path = public
as $$
  insert into public.user_productivity_state (
    user_id,
    habits,
    sessions,
    outstand,
    updated_at
  )
  values (
    auth.uid(),
    coalesce(p_habits, '[]'::jsonb),
    coalesce(p_sessions, '[]'::jsonb),
    coalesce(p_outstand, '[]'::jsonb),
    now()
  )
  on conflict (user_id) do update
    set habits = excluded.habits,
        sessions = excluded.sessions,
        outstand = excluded.outstand,
        updated_at = now()
  where public.user_productivity_state.user_id = auth.uid()
  returning *;
$$;

revoke all on function public.upsert_user_productivity_state(jsonb, jsonb, jsonb) from public;
grant execute on function public.upsert_user_productivity_state(jsonb, jsonb, jsonb) to authenticated;
