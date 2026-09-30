-- Endurece a função do trigger de cadastro sem alterar seu comportamento.
-- 1) search_path fixo (lint 0011): o corpo já usa public.profiles qualificado.
alter function public.handle_new_user() set search_path = '';

-- 2) Função de trigger não deve ser chamável via /rest/v1/rpc (lints 0028/0029).
--    Triggers não verificam EXECUTE ao disparar; o cadastro segue funcionando.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
