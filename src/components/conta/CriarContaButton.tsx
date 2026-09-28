'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { criarContaComGoogle } from '@/lib/conta';

/**
 * "Criar minha conta" para quem está experimentando o Cabidê.
 * Vincula o Google ao MESMO usuário (linkIdentity) — nada é copiado nem perdido.
 */
export function CriarContaButton({
  next = '/estilo',
  className = 'btn btn-primary w-full',
  label = 'Criar minha conta',
}: {
  next?: string;
  className?: string;
  label?: string;
}) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function criar() {
    setErro(null);
    setCarregando(true);
    const { error } = await criarContaComGoogle(next);
    if (error) {
      console.error('[Conta] Falha ao iniciar a vinculação com Google:', error.message);
      setErro('Não conseguimos abrir o Google agora. Tente novamente.');
      setCarregando(false);
    }
    // Sucesso: o navegador segue para o Google e volta por /auth/callback.
  }

  return (
    <div className="w-full">
      <button type="button" onClick={criar} disabled={carregando} className={className}>
        {carregando ? <Loader2 size={18} className="animate-spin" /> : label}
      </button>
      {erro && (
        <p role="alert" className="text-[13px] text-danger mt-2">
          {erro}
        </p>
      )}
    </div>
  );
}
