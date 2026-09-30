-- Bucket 'pecas' não tinha nenhuma política em storage.objects: nenhum upload
-- era permitido (0 objetos no bucket). Leitura continua pública (bucket público).
-- Cada usuária (inclusive quem está experimentando, role authenticated) só
-- envia para a própria pasta: <user_id>/<arquivo>.
create policy "pecas_insert_propria_pasta"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'pecas'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Bucket público: aceitar só imagens, até 10 MB (o app envia JPEG ~1600px).
update storage.buckets
  set allowed_mime_types = array['image/jpeg','image/png','image/webp','image/heic','image/heif'],
      file_size_limit = 10485760
  where id = 'pecas';
