-- MANUAL ROLLBACK for 0017 (never applied automatically). Removes the self-service deletion function. Accounts already deleted are NOT restored.
begin;
drop function if exists public.delete_my_account(text);
drop function if exists private.seconds_since_authentication();
commit;
