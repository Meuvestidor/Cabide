import { redirect, unstable_rethrow } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import { createServerSupabase } from '@/lib/supabase-server';
import { getRetratoStatus } from '@/lib/retrato';

/**
 * Usuária sem Retrato (perfil_estilo nulo ou não-v2) vê a introdução do
 * Retrato Cabidê uma vez. 'skipped', 'completed' e 'confirmed' nunca são
 * redirecionados. /retrato fica fora deste layout, então não há loop.
 */
async function precisaDoRetrato(): Promise<boolean> {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('perfil_estilo')
      .eq('id', user.id)
      .maybeSingle();
    if (error) return false;
    if (!profile) {
      // Sem linha em profiles não é possível persistir o estado do Retrato;
      // não redirecionar para não prender a usuária num ciclo. Ver relatório.
      console.error(`[Retrato] Nenhuma linha em profiles para o usuário ${user.id}.`);
      return false;
    }
    return getRetratoStatus(profile.perfil_estilo) === 'nao_iniciado';
  } catch (e) {
    unstable_rethrow(e); // não engolir sinais internos do Next (renderização dinâmica)
    console.error('[Retrato] Falha ao verificar o estado do Retrato:', e);
    return false;
  }
}

// Depende da sessão (cookies): sempre renderizado por requisição.
export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (await precisaDoRetrato()) {
    redirect('/retrato');
  }

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <main className="flex-1 pb-24 px-4 max-w-lg mx-auto w-full">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
