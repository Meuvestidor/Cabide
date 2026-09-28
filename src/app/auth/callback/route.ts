import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

// Aceita apenas caminhos internos (evita open redirect).
function safeNext(next: string | null): string {
  if (!next) return '/inicio';
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return '/inicio';
  return next;
}

function comParametro(path: string, chave: string, valor: string): string {
  const url = new URL(path, 'http://x');
  url.searchParams.delete('conta');
  url.searchParams.set(chave, valor);
  return url.pathname + url.search;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));

  // Erros do provedor (ex.: identity_already_exists ao vincular o Google)
  const erroOAuth = searchParams.get('error_code') || searchParams.get('error');
  if (erroOAuth) {
    console.error('[Auth] Retorno do provedor com erro:', erroOAuth, searchParams.get('error_description'));
    return NextResponse.redirect(new URL(comParametro(next, 'conta_erro', erroOAuth), request.url));
  }

  if (code) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('[Auth] Falha ao concluir o acesso:', error.message);
      return NextResponse.redirect(new URL(comParametro(next, 'conta_erro', 'troca'), request.url));
    }

    // Conta permanente (Google direto ou vinculado a uma experiência):
    // completa nome/e-mail do perfil quando ainda estão vazios. Nunca sobrescreve.
    const { data: { user } } = await supabase.auth.getUser();
    if (user && !user.is_anonymous) {
      const { data: profile } = await supabase.from('profiles').select('nome, email').eq('id', user.id).maybeSingle();
      if (profile) {
        const patch: Record<string, string> = {};
        const nome = (user.user_metadata?.full_name || user.user_metadata?.name || '') as string;
        if (!profile.nome && nome) patch.nome = nome;
        if (!profile.email && user.email) patch.email = user.email;
        if (Object.keys(patch).length) {
          const { error: upErr } = await supabase.from('profiles').update(patch).eq('id', user.id);
          if (upErr) console.error('[Auth] Falha ao sincronizar o perfil:', upErr.message);
        }
      }
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
