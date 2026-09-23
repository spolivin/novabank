grant insert on table public.transactions to service_role;

-- Browsers never write these tables directly; RLS already has no write policies, and
-- dropping the privileges keeps that true even if a permissive policy is added later.
revoke insert, update, delete on table public.transactions from anon, authenticated;
revoke insert, update, delete on table public.accounts from anon, authenticated;

-- Identifies the request a transaction came from. The backend reuses one key across its
-- connection retries, so a retry whose first attempt did reach Postgres cannot record the
-- same transfer twice. Null for rows created any other way (seed data, SQL inserts).
alter table public.transactions add column request_id uuid;
create unique index transactions_user_request_id_key
  on public.transactions (user_id, request_id)
  where request_id is not null;

-- Move money between the account and savings as one 'Savings' transaction: negative
-- when moving into savings, positive when moving back. The funds check and the insert
-- run in one database transaction, and a per-user advisory lock serialises concurrent
-- transfers so two requests can't both pass the check and overdraw. Replaying the same
-- p_request_id returns the current figures without inserting again.
create function public.transfer_savings(
  p_user_id uuid,
  p_direction text,
  p_amount numeric,
  p_request_id uuid
)
returns table (
  balance numeric,
  monthly_spending numeric,
  savings_goal numeric,
  savings_saved numeric
)
language plpgsql
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_current record;
begin
  if p_direction is null or p_direction not in ('to_savings', 'from_savings') then
    raise exception 'invalid_direction' using errcode = '22023';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount <> round(p_amount, 2) then
    raise exception 'invalid_amount' using errcode = '22023';
  end if;
  if p_request_id is null then
    raise exception 'missing_request_id' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_user_id::text));

  -- Already applied: return the current figures rather than transferring twice. The
  -- advisory lock is held, so a concurrent replay of the same key waits for this one.
  if exists (
    select 1 from public.transactions t
    where t.user_id = p_user_id and t.request_id = p_request_id
  ) then
    return query select * from public.dashboard_summary(p_user_id);
    return;
  end if;

  select * into v_current from public.dashboard_summary(p_user_id);

  if (p_direction = 'to_savings' and p_amount > v_current.balance)
     or (p_direction = 'from_savings' and p_amount > v_current.savings_saved) then
    raise exception 'insufficient_funds' using errcode = 'P0001';
  end if;

  insert into public.transactions (user_id, date, description, category, amount, request_id)
  values (
    p_user_id,
    current_date,
    case p_direction when 'to_savings' then 'Transfer to savings' else 'Transfer from savings' end,
    'Savings',
    case p_direction when 'to_savings' then -p_amount else p_amount end,
    p_request_id
  );

  return query select * from public.dashboard_summary(p_user_id);
end;
$$;

-- Takes a user id as input, so only the backend may execute it.
revoke execute on function public.transfer_savings(uuid, text, numeric, uuid) from public, anon, authenticated;
grant execute on function public.transfer_savings(uuid, text, numeric, uuid) to service_role;
