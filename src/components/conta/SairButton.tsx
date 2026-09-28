'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2 } from 'lucide-react';
import { sair } from '@/lib/conta';
import { CriarContaButton } from '@/components/conta/CriarContaButton';

/**
 * "Sair do Cabidê".
 * - Conta permanente: logout direto pelo Supabase Auth.
 * - Experimentando: confirmação curta antes, porque a sessão é a única chave dos dados.
 */
export function SairButton({ visitante }: { visitante: boolean }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [saindo, setSaindo] = useState(false);

  async function executarSaida() {
    setSaindo(true);
    const { error } = await sair();
    if (error) console.error('[Conta] Falha ao sair:', error.message);
    router.replace('/login');
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => (visitante ? setAberto(true) : executarSaida())}
        disabled={saindo}
        className="w-full flex items-center gap-3 py-4 text-left text-sm text-danger"
      >
        {saindo ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} strokeWidth={1.5} />}
        Sair do Cabidê
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-[60] bg-foreground/40 flex items-end sm:items-center justify-center"
          onClick={() => setAberto(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sair-titulo"
            className="sheet sm:rounded-[4px] w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="sair-titulo" className="display text-[1.75rem] mb-2">
              Antes de sair
            </h2>
            <p className="text-sm text-muted leading-relaxed mb-6">
              Você está experimentando o Cabidê. Seus dados ainda não estão salvos em uma conta.
            </p>
            <div className="flex flex-col gap-3">
              <CriarContaButton next="/estilo" />
              <button type="button" onClick={() => setAberto(false)} className="btn btn-outline w-full">
                Continuar experimentando
              </button>
              <button
                type="button"
                onClick={executarSaida}
                disabled={saindo}
                className="btn btn-ghost w-full text-danger"
              >
                {saindo ? <Loader2 size={18} className="animate-spin" /> : 'Sair mesmo assim'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
