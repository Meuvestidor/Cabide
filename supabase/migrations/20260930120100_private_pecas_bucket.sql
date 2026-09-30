-- ============================================================
-- Cabidê — Bucket `pecas` privado
-- APLICAR SOMENTE DEPOIS do deploy do código que serve as fotos
-- via /api/fotos (URLs assinadas). Antes disso, as imagens da
-- versão antiga deixariam de carregar.
-- ============================================================
update storage.buckets set public = false where id = 'pecas';
