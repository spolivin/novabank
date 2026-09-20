create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  description text not null check (char_length(description) between 1 and 200),
  category text not null check (char_length(category) between 1 and 50),
  amount numeric(12, 2) not null, -- signed: negative = debit
  created_at timestamptz default now()
);

create index on transactions (user_id, date desc);

alter table transactions enable row level security;

create policy "users can only see own transactions"
on transactions for select
using ((select auth.uid()) = user_id);

grant select on table public.transactions to service_role;
revoke select on table public.transactions from authenticated;
revoke select on table public.transactions from anon;
