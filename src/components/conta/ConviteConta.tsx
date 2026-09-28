'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { getRetratoStatus } from '@/lib/retrato';
import { useConta } from '@/components/conta/useConta';
import { CriarContaButton } from '@/components/conta/CriarContaButton';

// Preferência de interface (não é dado do produto): esconder o convite neste aparelho.
const CHAVE_DISPENSADO = 'cabide:convite-conta-dispensado';
const PECAS_MINIMAS = 3;

/**
 * Convite discreto para quem está experimentando o Cabidê e já investiu no produto:
 * Retrato confirmado, várias peças ou algum look salvo. Não bloqueia a navegação.
 */
export function ConviteConta() {
  const { user, visitante } = useConta();
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    if (!user || !visitante) return;
    try {
      if (localStorage.getItem(CHAVE_DISPENSADO)) return;
    } catch {
      /* armazenamento indisponível: segue normalmente */
    }
    let ativo = true;
    (async () => {
      const supabase = createClient();
      const [perfil, pecas, looks] = await Promise.all([
        supabase.from('profiles').select('perfil_estilo').eq('id', user.id).maybeSingle(),
        supabase.from('pecas').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('looks').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);
      const investiu =
        getRetratoStatus(perfil.data?.perfil_estilo) === 'confirmed' ||
        (pecas.count ?? 0) >= PECAS_MINIMAS ||
        (looks.count ?? 0) >= 1;
      if (ativo) setMostrar(investiu);
    })();
    return () => {
      ativo = false;
    };
  }, [user, visitante]);

  if (!mostrar) return null;

  function dispensar() {
    setMostrar(false);
    try {
      localStorage.setItem(CHAVE_DISPENSADO, new Date().toISOString());
    } catch {
      /* ignora */
    }
  }

  return (
    <aside className="relative mb-8 p-5 border-l-2 border-gold bg-surface">
      <button
        type="button"
        onClick={dispensar}
        className="absolute top-3 right-3 p-1 text-muted"
        aria-label="Dispensar"
      >
        <X size={16} />
      </button>
      <p className="display text-[1.35rem] leading-snug pr-6">Seu Cabidê já está tomando forma.</p>
      <p className="text-[13px] text-muted mt-1.5 mb-4">
        Crie sua conta para guardar tudo e continuar de onde parou.
      </p>
      <CriarContaButton next="/inicio" className="btn btn-primary min-h-11 px-5" />
    </aside>
  );
}
