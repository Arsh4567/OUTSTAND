create table if not exists public.direct_conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint direct_conversations_distinct_users check (user_a <> user_b),
  constraint direct_conversations_pair_unique unique (user_a, user_b)
);

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.direct_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists direct_conversations_user_a_idx on public.direct_conversations(user_a, updated_at desc);
create index if not exists direct_conversations_user_b_idx on public.direct_conversations(user_b, updated_at desc);
create index if not exists direct_messages_conversation_idx on public.direct_messages(conversation_id, created_at asc);

alter table public.direct_conversations enable row level security;
alter table public.direct_messages enable row level security;

create policy if not exists "participants can view direct conversations" on public.direct_conversations for select to authenticated using (auth.uid() = user_a or auth.uid() = user_b);
create policy if not exists "participants can create direct conversations" on public.direct_conversations for insert to authenticated with check (auth.uid() = user_a or auth.uid() = user_b);
create policy if not exists "participants can update direct conversations" on public.direct_conversations for update to authenticated using (auth.uid() = user_a or auth.uid() = user_b) with check (auth.uid() = user_a or auth.uid() = user_b);

create policy if not exists "participants can view direct messages" on public.direct_messages for select to authenticated using (exists (select 1 from public.direct_conversations c where c.id = conversation_id and (auth.uid() = c.user_a or auth.uid() = c.user_b)));
create policy if not exists "participants can send direct messages" on public.direct_messages for insert to authenticated with check (auth.uid() = sender_id and exists (select 1 from public.direct_conversations c where c.id = conversation_id and (auth.uid() = c.user_a or auth.uid() = c.user_b)));
create policy if not exists "participants can mark direct messages read" on public.direct_messages for update to authenticated using (exists (select 1 from public.direct_conversations c where c.id = conversation_id and (auth.uid() = c.user_a or auth.uid() = c.user_b))) with check (exists (select 1 from public.direct_conversations c where c.id = conversation_id and (auth.uid() = c.user_a or auth.uid() = c.user_b)));

create or replace function public.get_or_create_direct_conversation(target_user uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  a uuid;
  b uuid;
  conversation_id uuid;
begin
  if me is null then raise exception 'Authentication required'; end if;
  if target_user is null or target_user = me then raise exception 'Invalid recipient'; end if;
  if not exists (select 1 from public.friendships where user_id = me and friend_id = target_user) then
    raise exception 'You can only message friends';
  end if;
  a := least(me, target_user);
  b := greatest(me, target_user);
  insert into public.direct_conversations(user_a, user_b) values (a, b)
    on conflict (user_a, user_b) do update set updated_at = now()
    returning id into conversation_id;
  return conversation_id;
end;
$$;

revoke all on function public.get_or_create_direct_conversation(uuid) from public;
grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;
grant usage on schema public to authenticated;

create or replace function public.touch_direct_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.direct_conversations set updated_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists direct_message_touch_conversation on public.direct_messages;
create trigger direct_message_touch_conversation after insert on public.direct_messages for each row execute function public.touch_direct_conversation();

alter table public.direct_conversations replica identity full;
alter table public.direct_messages replica identity full;

do $$
begin
  begin alter publication supabase_realtime add table public.direct_conversations; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.direct_messages; exception when duplicate_object then null; end;
end $$;
