import { NextRequest, NextResponse } from 'next/server';
import { requireAppUser } from '@/server/auth';

const BUCKET = 'pecas';
const SIGNED_URL_TTL = 60 * 60; // 1h

// Serve as fotos do bucket privado `pecas`: confere a dona da foto e
// redireciona para uma URL assinada de curta duração.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const auth = await requireAppUser();
  if (!auth.ok) return auth.response;

  const { path } = await params;
  const objectPath = path.join('/');
  if (path[0] !== auth.user.id || path.some((p) => p === '..' || p === '.')) {
    return new NextResponse(null, { status: 404 });
  }

  const { data, error } = await auth.supabase.storage.from(BUCKET).createSignedUrl(objectPath, SIGNED_URL_TTL);
  if (error || !data?.signedUrl) {
    return new NextResponse(null, { status: 404 });
  }

  const res = NextResponse.redirect(data.signedUrl, 302);
  // Cache só no navegador da própria usuária, nunca em CDN/proxy compartilhado.
  res.headers.set('Cache-Control', 'private, max-age=600');
  res.headers.set('Vary', 'Cookie');
  return res;
}
