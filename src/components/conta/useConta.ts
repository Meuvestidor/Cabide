'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-client';
import { isVisitante } from '@/lib/conta';

/** Usuária atual (Supabase Auth) e se ela está apenas experimentando o Cabidê. */
export function useConta() {
  const [user, setUser] = useState<User | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let ativo = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!ativo) return;
      setUser(data.user ?? null);
      setCarregando(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      if (ativo) setUser(sessao?.user ?? null);
    });
    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, visitante: isVisitante(user), carregando };
}
