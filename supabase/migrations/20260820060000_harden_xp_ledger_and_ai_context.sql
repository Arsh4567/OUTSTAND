create unique index if not exists xp_transactions_user_source_reference_uidx
  on public.xp_transactions(user_id, source, reference_id);

alter table public.xp_transactions enable row level security;

drop policy if exists "Users can view own XP transactions" on public.xp_transactions;
create policy "Users can view own XP transactions"
  on public.xp_transactions
  for select
  to authenticated
  using (auth.uid() = user_id);

revoke all on function public.award_xp(integer, text, text, text, jsonb) from public;
grant execute on function public.award_xp(integer, text, text, text, jsonb) to authenticated;
