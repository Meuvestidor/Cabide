-- Usuárias anônimas ("Experimentar Cabidê") não têm e-mail: profiles.email é NOT NULL,
-- então o insert do trigger falharia com NULL. Mantém search_path fixo.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.profiles (id, nome, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.email, '')
  );
  return new;
end;
$function$;
