create or replace function public.delete_roadmap(p_roadmap_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  removed integer;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.roadmaps
  where id = p_roadmap_id
    and user_id = uid;

  get diagnostics removed = row_count;
  return removed = 1;
end;
$$;

revoke all on function public.delete_roadmap(uuid) from public;
grant execute on function public.delete_roadmap(uuid) to authenticated;
