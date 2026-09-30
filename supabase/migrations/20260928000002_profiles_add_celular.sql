-- Celular opcional no perfil (coberto pelas políticas RLS existentes de profiles).
alter table public.profiles add column if not exists celular text;
