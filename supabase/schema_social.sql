-- ============================================================
-- Serai — Sprint 4: Connections & Chat (safe to run more than once)
-- Run in Supabase → SQL Editor → New query → Run.
-- ============================================================

-- CONNECTIONS: one row per pair. Chat is gated on status = 'accepted'.
create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  constraint no_self_connection check (requester_id <> target_id),
  constraint one_request_per_pair unique (requester_id, target_id)
);

create index if not exists connections_requester_idx on public.connections (requester_id);
create index if not exists connections_target_idx on public.connections (target_id);

alter table public.connections enable row level security;

-- You only ever see connections you are part of.
drop policy if exists "see own connections" on public.connections;
create policy "see own connections" on public.connections
  for select to authenticated
  using (requester_id = auth.uid() or target_id = auth.uid());

-- You can only send requests as yourself.
drop policy if exists "send connection" on public.connections;
create policy "send connection" on public.connections
  for insert to authenticated with check (requester_id = auth.uid());

-- Only the person who RECEIVED the request can accept it.
drop policy if exists "accept connection" on public.connections;
create policy "accept connection" on public.connections
  for update to authenticated
  using (target_id = auth.uid()) with check (target_id = auth.uid());

-- Either side can decline / cancel / disconnect.
drop policy if exists "remove connection" on public.connections;
create policy "remove connection" on public.connections
  for delete to authenticated
  using (requester_id = auth.uid() or target_id = auth.uid());

-- CONVERSATIONS: exactly one per pair (user_a < user_b keeps it canonical).
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint ordered_pair check (user_a < user_b),
  constraint one_conversation_per_pair unique (user_a, user_b)
);

alter table public.conversations enable row level security;

drop policy if exists "see own conversations" on public.conversations;
create policy "see own conversations" on public.conversations
  for select to authenticated
  using (user_a = auth.uid() or user_b = auth.uid());

-- A conversation can only be created between people who are ACCEPTED
-- connections — this is the "connection gates chat" rule, enforced by the DB.
drop policy if exists "start conversation if connected" on public.conversations;
create policy "start conversation if connected" on public.conversations
  for insert to authenticated
  with check (
    (auth.uid() = user_a or auth.uid() = user_b)
    and exists (
      select 1 from public.connections c
      where c.status = 'accepted'
        and (
          (c.requester_id = user_a and c.target_id = user_b) or
          (c.requester_id = user_b and c.target_id = user_a)
        )
    )
  );

-- MESSAGES
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  sent_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx
  on public.messages (conversation_id, sent_at);

alter table public.messages enable row level security;

drop policy if exists "read messages in own conversations" on public.messages;
create policy "read messages in own conversations" on public.messages
  for select to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

drop policy if exists "send message in own conversations" on public.messages;
create policy "send message in own conversations" on public.messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

-- Live updates: push new messages to open chats instantly.
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end $$;
