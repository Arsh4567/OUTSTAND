create table if not exists public.ai_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  memory_type text not null check (memory_type in ('preference','goal','constraint','strategy','pattern')),
  memory_key text not null,
  memory_value text not null,
  confidence numeric not null default 0.8 check (confidence >= 0 and confidence <= 1),
  source text not null default 'assistant',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, memory_key)
);

create index if not exists ai_memory_user_updated_idx on public.ai_memory(user_id, updated_at desc);

alter table public.ai_memory enable row level security;

create policy "Users can read own AI memory"
  on public.ai_memory for select
  using (auth.uid() = user_id);

create policy "Users can insert own AI memory"
  on public.ai_memory for insert
  with check (auth.uid() = user_id);

create policy "Users can update own AI memory"
  on public.ai_memory for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own AI memory"
  on public.ai_memory for delete
  using (auth.uid() = user_id);

create or replace function public.touch_ai_memory_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_ai_memory_updated_at on public.ai_memory;
create trigger trg_ai_memory_updated_at
before update on public.ai_memory
for each row execute function public.touch_ai_memory_updated_at();
