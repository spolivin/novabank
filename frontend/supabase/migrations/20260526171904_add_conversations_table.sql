create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 4000),
  created_at timestamptz default now()
);

create index on conversations (user_id, created_at);

-- RLS
alter table conversations enable row level security;

create policy "users can only see own messages"
on conversations for all
using ((select auth.uid()) = user_id);

revoke select on table public.conversations from authenticated;
revoke select on table public.conversations from anon;
