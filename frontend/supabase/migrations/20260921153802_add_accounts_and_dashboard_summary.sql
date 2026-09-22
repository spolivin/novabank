create table accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  opening_balance numeric(12,2) not null default 0,
  savings_goal numeric(12,2) not null default 0 check (savings_goal >= 0),
  updated_at timestamptz not null default now()
);

alter table accounts enable row level security;

create policy "users can only see own account" on accounts
  for select using ((select auth.uid()) = user_id);

revoke select on table public.accounts from authenticated;
revoke select on table public.accounts from anon;

grant select, insert, update on table public.accounts to service_role;

-- All four summary-card figures in one round trip. A user with no accounts row or no
-- transactions gets zeros. Savings transfers (category 'Savings') count towards
-- savings_saved and are left out of monthly_spending.
create function public.dashboard_summary(p_user_id uuid)
returns table (
  balance numeric,
  monthly_spending numeric,
  savings_goal numeric,
  savings_saved numeric
)
language sql
stable
set search_path = ''
as $$
  select
    coalesce((select a.opening_balance from public.accounts a where a.user_id = p_user_id), 0)
      + coalesce((select sum(t.amount) from public.transactions t where t.user_id = p_user_id), 0),
    coalesce((
      select -sum(t.amount) from public.transactions t
      where t.user_id = p_user_id
        and t.amount < 0
        and t.category <> 'Savings'
        and t.date >= date_trunc('month', current_date)::date
    ), 0),
    coalesce((select a.savings_goal from public.accounts a where a.user_id = p_user_id), 0),
    greatest(coalesce((
      select -sum(t.amount) from public.transactions t
      where t.user_id = p_user_id and t.category = 'Savings'
    ), 0), 0)
$$;

-- The function takes a user id as input, so a browser allowed to call it could read
-- anyone's figures. Only the backend may execute it.
revoke execute on function public.dashboard_summary(uuid) from public, anon, authenticated;
grant execute on function public.dashboard_summary(uuid) to service_role;
