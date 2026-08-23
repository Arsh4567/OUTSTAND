-- Ensure authenticated users can call the direct-message conversation RPC in production.
-- The function remains SECURITY DEFINER and still enforces the friendship check.
grant usage on schema public to authenticated;
grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;
