import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { isPublicBeta } from '@/server/config';

// Valida um convite ANTES do cadastro (não consome). Rota pública.
// Resposta: { status: 'ok' | 'invalid' | 'used' | 'expired' | 'revoked' | 'email_mismatch' }
export async function POST(req: NextRequest) {
  if (isPublicBeta()) return NextResponse.json({ status: 'ok', required: false });

  try {
    const { code, email } = await req.json();
    if (typeof code !== 'string' || code.length > 64) {
      return NextResponse.json({ status: 'invalid', required: true });
    }
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.rpc('check_invitation', {
      p_code: code,
      p_email: typeof email === 'string' ? email.slice(0, 320) : null,
    });
    if (error) throw error;
    return NextResponse.json({ status: data, required: true });
  } catch (error) {
    console.error('Invite check error:', error);
    return NextResponse.json({ status: 'generic', required: true }, { status: 500 });
  }
}
