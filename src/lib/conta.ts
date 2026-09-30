// ============================================
// Acesso ao Cabidê — Supabase Auth
// Fase atual: Google + "Experimentar Cabidê" (usuária anônima do Supabase).
// O fluxo e-mail + senha continua existindo no Supabase, mas está fora da interface.
// ============================================
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-client';

/** Visitante = sessão anônima do Supabase, ainda sem identidade permanente. */
export function isVisitante(user: Pick<User, 'is_anonymous'> | null | undefined): boolean {
  return !!user?.is_anonymous;
}

function callbackUrl(next: string): string {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

/** Entrar com Google (conta nova ou existente). O Supabase não duplica usuários por identidade. */
export async function entrarComGoogle(next = '/inicio') {
  const supabase = createClient();
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: callbackUrl(next) },
  });
}

/** "Experimentar Cabidê": sessão anônima com user_id próprio, protegida pelas mesmas políticas RLS. */
export async function experimentarCabide() {
  const supabase = createClient();
  return supabase.auth.signInAnonymously();
}

/**
 * "Criar minha conta" para quem está experimentando:
 * VINCULA a identidade Google ao usuário anônimo atual (linkIdentity).
 * O user_id NÃO muda — Retrato, peças, looks e preferências continuam associados a ele.
 * Requer "Manual linking" habilitado no Supabase Auth.
 */
export async function criarContaComGoogle(next = '/estilo') {
  const supabase = createClient();
  const sep = next.includes('?') ? '&' : '?';
  return supabase.auth.linkIdentity({
    provider: 'google',
    options: { redirectTo: callbackUrl(`${next}${sep}conta=criada`) },
  });
}

/** Encerra a sessão pelo Supabase Auth. */
export async function sair() {
  const supabase = createClient();
  return supabase.auth.signOut();
}
