import 'server-only';
import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createServerSupabase } from '@/lib/supabase-server';
import { getServerT } from '@/i18n/server';
import { hasAppAccess } from './access';

type Guard =
  | { ok: true; supabase: SupabaseClient; user: User }
  | { ok: false; response: NextResponse };

// Toda rota de API privada começa por aqui: sessão válida + acesso à beta.
export async function requireAppUser(options: { requireAccess?: boolean } = {}): Promise<Guard> {
  const { requireAccess = true } = options;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getServerT();

  if (!user) {
    return { ok: false, response: NextResponse.json({ error: t('api.unauthorized') }, { status: 401 }) };
  }
  if (requireAccess && !(await hasAppAccess(supabase, user))) {
    return { ok: false, response: NextResponse.json({ error: t('api.forbidden') }, { status: 403 }) };
  }
  return { ok: true, supabase, user };
}
