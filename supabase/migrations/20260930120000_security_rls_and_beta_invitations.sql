-- ============================================================
-- Cabidê — Segurança para beta privada
-- 1) Endurece RLS (somente usuários autenticados, WITH CHECK em UPDATE)
-- 2) Storage: políticas de leitura/edição/remoção só na própria pasta
-- 3) Sistema de convites (schema privado `beta`, não exposto pela API)
-- Não altera dados existentes das usuárias.
-- ============================================================

-- ---------- 1. RLS ----------
drop policy if exists "Users can view own profile"   on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "Users can view own pieces"   on public.pecas;
drop policy if exists "Users can insert own pieces" on public.pecas;
drop policy if exists "Users can update own pieces" on public.pecas;
drop policy if exists "Users can delete own pieces" on public.pecas;
create policy pecas_select_own on public.pecas for select to authenticated using ((select auth.uid()) = user_id);
create policy pecas_insert_own on public.pecas for insert to authenticated with check ((select auth.uid()) = user_id);
create policy pecas_update_own on public.pecas for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy pecas_delete_own on public.pecas for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own looks"   on public.looks;
drop policy if exists "Users can insert own looks" on public.looks;
drop policy if exists "Users can update own looks" on public.looks;
create policy looks_select_own on public.looks for select to authenticated using ((select auth.uid()) = user_id);
create policy looks_insert_own on public.looks for insert to authenticated with check ((select auth.uid()) = user_id);
create policy looks_update_own on public.looks for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users can manage own usage" on public.registros_uso;
create policy registros_uso_all_own on public.registros_uso for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Visitantes anônimos não precisam de nenhum acesso às tabelas.
revoke all on public.profiles, public.pecas, public.looks, public.registros_uso from anon;

-- ---------- 2. Storage (bucket pecas) ----------
-- Caminho dos arquivos: <user_id>/<timestamp>.<ext>
drop policy if exists pecas_select_propria_pasta on storage.objects;
drop policy if exists pecas_update_propria_pasta on storage.objects;
drop policy if exists pecas_delete_propria_pasta on storage.objects;
create policy pecas_select_propria_pasta on storage.objects for select to authenticated
  using (bucket_id = 'pecas' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy pecas_update_propria_pasta on storage.objects for update to authenticated
  using (bucket_id = 'pecas' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'pecas' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy pecas_delete_propria_pasta on storage.objects for delete to authenticated
  using (bucket_id = 'pecas' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------- 3. Convites ----------
create schema if not exists beta;
revoke all on schema beta from public, anon, authenticated;

create table if not exists beta.invitations (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique check (code = upper(code) and length(code) between 6 and 64),
  email       text check (email is null or email = lower(email)),
  status      text not null default 'ACTIVE' check (status in ('ACTIVE','USED','EXPIRED','REVOKED')),
  max_uses    integer not null default 1 check (max_uses >= 1),
  use_count   integer not null default 0 check (use_count >= 0),
  note        text,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz,
  used_at     timestamptz,
  revoked_at  timestamptz,
  user_id     uuid references auth.users(id) on delete set null
);

create table if not exists beta.invitation_redemptions (
  invitation_id uuid not null references beta.invitations(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  redeemed_at   timestamptz not null default now(),
  primary key (invitation_id, user_id)
);
create index if not exists invitation_redemptions_user_idx on beta.invitation_redemptions(user_id);

alter table beta.invitations enable row level security;
alter table beta.invitation_redemptions enable row level security;
revoke all on beta.invitations, beta.invitation_redemptions from public, anon, authenticated;

-- Status efetivo (considera expiração pela data)
create or replace function beta._effective_status(inv beta.invitations)
returns text language sql stable set search_path = '' as $$
  select case
    when inv.status in ('REVOKED','USED','EXPIRED') then inv.status
    when inv.use_count >= inv.max_uses then 'USED'
    when inv.expires_at is not null and inv.expires_at <= now() then 'EXPIRED'
    else 'ACTIVE' end;
$$;

-- Validação sem consumir. Retorna: ok | invalid | used | expired | revoked | email_mismatch
create or replace function beta._check(p_code text, p_email text)
returns text language plpgsql stable security definer set search_path = '' as $$
declare inv beta.invitations; st text;
begin
  if p_code is null or length(trim(p_code)) = 0 then return 'invalid'; end if;
  select * into inv from beta.invitations where code = upper(trim(p_code));
  if not found then return 'invalid'; end if;
  st := beta._effective_status(inv);
  if st <> 'ACTIVE' then return lower(st); end if;
  if inv.email is not null and inv.email <> lower(trim(coalesce(p_email, ''))) then return 'email_mismatch'; end if;
  return 'ok';
end; $$;

-- Consome o convite para um usuário (atômico, com lock). Idempotente para o mesmo usuário.
create or replace function beta._redeem(p_user uuid, p_email text, p_code text)
returns text language plpgsql security definer set search_path = '' as $$
declare inv beta.invitations; st text;
begin
  if p_user is null or p_code is null or length(trim(p_code)) = 0 then return 'invalid'; end if;
  select * into inv from beta.invitations where code = upper(trim(p_code)) for update;
  if not found then return 'invalid'; end if;
  if exists (select 1 from beta.invitation_redemptions where invitation_id = inv.id and user_id = p_user) then
    return 'ok';
  end if;
  st := beta._effective_status(inv);
  if st <> 'ACTIVE' then
    if st = 'EXPIRED' and inv.status = 'ACTIVE' then
      update beta.invitations set status = 'EXPIRED' where id = inv.id;
    end if;
    return lower(st);
  end if;
  if inv.email is not null and inv.email <> lower(trim(coalesce(p_email, ''))) then return 'email_mismatch'; end if;

  insert into beta.invitation_redemptions(invitation_id, user_id) values (inv.id, p_user);
  update beta.invitations
     set use_count = use_count + 1,
         status    = case when use_count + 1 >= max_uses then 'USED' else status end,
         used_at   = coalesce(used_at, now()),
         user_id   = coalesce(user_id, p_user)
   where id = inv.id;
  return 'ok';
end; $$;

-- Marca o acesso no app_metadata (só o servidor/SQL pode alterar app_metadata; o usuário não).
create or replace function beta._grant_access(p_user uuid)
returns void language sql security definer set search_path = '' as $$
  update auth.users
     set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"beta_access": true}'::jsonb
   where id = p_user;
$$;

-- API pública (PostgREST) ----------------------------------------------

-- Usado no cadastro para validar o código antes de criar a conta.
create or replace function public.check_invitation(p_code text, p_email text default null)
returns text language sql stable security definer set search_path = '' as $$
  select beta._check(p_code, p_email);
$$;

-- Usuária autenticada (ex.: login com Google) resgata um convite.
create or replace function public.redeem_invitation(p_code text)
returns text language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); em text; r text;
begin
  if uid is null then return 'unauthenticated'; end if;
  select email into em from auth.users where id = uid;
  r := beta._redeem(uid, em, p_code);
  if r = 'ok' then perform beta._grant_access(uid); end if;
  return r;
end; $$;

-- Chamado pelo servidor quando a usuária ainda não tem a marca de acesso:
-- concede acesso se ela já resgatou um convite (ex.: no cadastro por e-mail).
create or replace function public.claim_beta_access()
returns text language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); u auth.users; r text;
begin
  if uid is null then return 'unauthenticated'; end if;
  select * into u from auth.users where id = uid;
  if coalesce((u.raw_app_meta_data ->> 'beta_access')::boolean, false) then return 'ok'; end if;
  if exists (select 1 from beta.invitation_redemptions where user_id = uid) then
    perform beta._grant_access(uid); return 'ok';
  end if;
  if u.raw_user_meta_data ? 'invite_code' then
    r := beta._redeem(uid, u.email, u.raw_user_meta_data ->> 'invite_code');
    if r = 'ok' then perform beta._grant_access(uid); end if;
    return r;
  end if;
  return 'no_invitation';
end; $$;

revoke all on function public.check_invitation(text, text), public.redeem_invitation(text), public.claim_beta_access() from public;
grant execute on function public.check_invitation(text, text) to anon, authenticated;
grant execute on function public.redeem_invitation(text), public.claim_beta_access() to authenticated;
revoke all on all functions in schema beta from public, anon, authenticated;

-- Consome o convite no momento do cadastro (código enviado em user_metadata.invite_code).
-- Nunca bloqueia o cadastro: se falhar, a usuária cai na tela /convite.
create or replace function beta.on_auth_user_created_invitation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.raw_user_meta_data ? 'invite_code' then
    begin
      perform beta._redeem(new.id, new.email, new.raw_user_meta_data ->> 'invite_code');
    exception when others then null;
    end;
  end if;
  return new;
end; $$;

drop trigger if exists on_auth_user_created_invitation on auth.users;
create trigger on_auth_user_created_invitation
  after insert on auth.users
  for each row execute function beta.on_auth_user_created_invitation();

-- Administração (somente SQL Editor / service role — não exposto na API) ----

create or replace function beta.create_invitation(
  p_email    text    default null,
  p_days     integer default 14,
  p_max_uses integer default 1,
  p_note     text    default null,
  p_code     text    default null
) returns table (code text, expires_at timestamptz, invite_path text)
language plpgsql security definer set search_path = '' as $$
declare alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; c text; b bytea; i int;
begin
  if p_code is not null then
    c := upper(trim(p_code));
  else
    b := extensions.gen_random_bytes(8);
    c := 'CABIDE-';
    for i in 0..7 loop
      if i = 4 then c := c || '-'; end if;
      c := c || substr(alphabet, (get_byte(b, i) % 32) + 1, 1);
    end loop;
  end if;
  insert into beta.invitations(code, email, max_uses, note, expires_at)
  values (c, lower(nullif(trim(p_email), '')), greatest(p_max_uses, 1), p_note,
          case when p_days is null then null else now() + make_interval(days => p_days) end)
  returning beta.invitations.code, beta.invitations.expires_at into code, expires_at;
  invite_path := '/signup?convite=' || code;
  return next;
end; $$;

create or replace function beta.revoke_invitation(p_code text)
returns text language sql security definer set search_path = '' as $$
  update beta.invitations set status = 'REVOKED', revoked_at = now()
   where code = upper(trim(p_code)) and status <> 'REVOKED'
  returning 'revoked';
$$;

-- Marca como EXPIRED os convites vencidos (opcional; a validação já considera a data).
create or replace function beta.expire_invitations()
returns integer language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  update beta.invitations set status = 'EXPIRED'
   where status = 'ACTIVE' and expires_at is not null and expires_at <= now();
  get diagnostics n = row_count; return n;
end; $$;

create or replace view beta.invitations_overview as
  select i.code, beta._effective_status(i) as status, i.email, i.use_count, i.max_uses,
         i.created_at, i.expires_at, i.used_at, i.revoked_at, u.email as used_by, i.note
    from beta.invitations i left join auth.users u on u.id = i.user_id
   order by i.created_at desc;
revoke all on beta.invitations_overview from public, anon, authenticated;

-- Usuárias que já existiam antes da beta privada mantêm o acesso.
update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"beta_access": true}'::jsonb
 where created_at < now();

-- Supabase concede EXECUTE a anon por padrão nas funções do schema public.
revoke execute on function public.redeem_invitation(text), public.claim_beta_access() from anon;
revoke execute on function public.handle_new_user() from anon, authenticated;
