-- Garantia explícita para o papel que insere em auth.users (não expõe via REST).
grant execute on function public.handle_new_user() to supabase_auth_admin;
