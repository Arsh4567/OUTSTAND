-- Outstand Intelligence production bootstrap.
-- Safe to run after the existing chat migration; all statements are idempotent.

create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.chat_conversations to authenticated;
grant select, insert, update, delete on public.chat_messages to authenticated;
grant all on public.chat_conversations to service_role;
grant all on public.chat_messages to service_role;

alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "Users can manage their own chat conversations" on public.chat_conversations;
drop policy if exists "Users can manage their own chat messages" on public.chat_messages;

create policy "Users can manage their own chat conversations"
on public.chat_conversations
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage their own chat messages"
on public.chat_messages
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists idx_chat_conversations_user_id on public.chat_conversations(user_id);
create index if not exists idx_chat_messages_conversation_id on public.chat_messages(conversation_id);
create index if not exists idx_chat_messages_user_id on public.chat_messages(user_id);
create index if not exists idx_chat_messages_created_at on public.chat_messages(created_at);

create or replace function public.update_chat_conversations_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  update public.chat_conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists chat_messages_update_conversation_updated_at on public.chat_messages;

create trigger chat_messages_update_conversation_updated_at
after insert on public.chat_messages
for each row
execute function public.update_chat_conversations_updated_at();

-- Health check table is intentionally not used; the API validates configuration at runtime.
