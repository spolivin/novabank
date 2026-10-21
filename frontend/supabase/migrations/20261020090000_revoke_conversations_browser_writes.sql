-- Browsers never write conversations directly; only the backend does, via the service role.
-- The RLS policy covers all commands, so without this a signed-in user could insert rows
-- straight through PostgREST and skip the backend's 500-character message cap and rate limits.
revoke insert, update, delete on table public.conversations from anon, authenticated;
