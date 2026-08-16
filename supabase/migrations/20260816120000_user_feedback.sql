create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists user_feedback_user_created_idx
  on public.user_feedback(user_id, created_at desc);

alter table public.user_feedback enable row level security;

drop policy if exists "Users can submit feedback" on public.user_feedback;
create policy "Users can submit feedback"
  on public.user_feedback for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can read their feedback" on public.user_feedback;
create policy "Users can read their feedback"
  on public.user_feedback for select
  using (auth.uid() = user_id);
