'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { authErrorMessage } from '@/lib/auth-errors';

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setHasSession(!!data.user));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(authErrorMessage(error.message));
      return;
    }
    router.push('/inicio');
  }

  return (
    <div className="min-h-dvh flex flex-col px-6 pt-16 pb-10 bg-background">
      <div className="w-full max-w-sm mx-auto">
        <p className="eyebrow mb-3">Recuperar acesso</p>

        {hasSession === false ? (
          <>
            <h1 className="display text-[2rem] mb-3">Este link expirou</h1>
            <p className="text-sm text-muted mb-8">
              Por segurança, o link de recuperação vale por pouco tempo. Peça um novo para continuar.
            </p>
            <Link href="/forgot-password" className="btn btn-primary w-full">
              Pedir novo link
            </Link>
          </>
        ) : (
          <>
            <h1 className="display text-[2rem] mb-2">Crie uma nova senha</h1>
            <p className="text-sm text-muted mb-8">Use pelo menos 6 caracteres.</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="password" className="block mb-1.5 text-[13px] font-semibold">Nova senha</label>
                <div className="relative">
                  <input
                    id="password"
                    type={show ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="input pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted"
                    aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
                    tabIndex={-1}
                  >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirm" className="block mb-1.5 text-[13px] font-semibold">Confirme a nova senha</label>
                <input
                  id="confirm"
                  type={show ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  className="input"
                />
              </div>
              {error && (
                <p role="alert" className="text-sm px-3 py-2.5 rounded-[2px] bg-surface text-danger border border-danger/30">
                  {error}
                </p>
              )}
              <button type="submit" disabled={loading || hasSession === null} className="btn btn-primary w-full">
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Salvar nova senha'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
