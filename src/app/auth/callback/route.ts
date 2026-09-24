import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

// Aceita apenas caminhos internos (evita open redirect).
function safeNext(next: string | null): string {
  if (!next) return '/inicio';
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return '/inicio';
  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));

  if (code) {
    const supabase = await createServerSupabase();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, request.url));
}
