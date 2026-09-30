import 'server-only';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { isPublicBeta } from './config';

// A marca `app_metadata.beta_access` só pode ser escrita pelo banco
// (funções SECURITY DEFINER), nunca pela usuária.
export async function hasAppAccess(supabase: SupabaseClient, user: User): Promise<boolean> {
  if (isPublicBeta()) return true;
  if (user.app_metadata?.beta_access === true) return true;
  // Primeira visita após o cadastro com convite: o banco confirma e grava a marca.
  const { data } = await supabase.rpc('claim_beta_access');
  return data === 'ok';
}
