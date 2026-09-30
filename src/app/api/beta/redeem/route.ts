import { NextRequest, NextResponse } from 'next/server';
import { requireAppUser } from '@/server/auth';

// Usuária autenticada sem acesso (ex.: entrou com Google) resgata um convite.
export async function POST(req: NextRequest) {
  const auth = await requireAppUser({ requireAccess: false });
  if (!auth.ok) return auth.response;

  try {
    const { code } = await req.json();
    if (typeof code !== 'string' || code.length > 64) {
      return NextResponse.json({ status: 'invalid' }, { status: 400 });
    }
    const { data, error } = await auth.supabase.rpc('redeem_invitation', { p_code: code });
    if (error) throw error;
    return NextResponse.json({ status: data }, { status: data === 'ok' ? 200 : 400 });
  } catch (error) {
    console.error('Invite redeem error:', error);
    return NextResponse.json({ status: 'generic' }, { status: 500 });
  }
}
