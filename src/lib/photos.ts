// As fotos das peças ficam num bucket privado. O banco guarda a URL no formato
// do Supabase Storage; aqui ela vira a rota autenticada /api/fotos/<user_id>/<arquivo>.
const STORAGE_MARKER = '/storage/v1/object/public/pecas/';

export function photoSrc(url: string | null | undefined): string {
  if (!url) return '';
  const i = url.indexOf(STORAGE_MARKER);
  if (i === -1) return url;
  return `/api/fotos/${url.slice(i + STORAGE_MARKER.length).split('?')[0]}`;
}
