'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos.'
          : error.message
      );
      setLoading(false);
      return;
    }

    router.push('/inicio');
    router.refresh();
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl text-foreground">Meu Vestidor</h1>
        <p className="text-muted mt-2 text-sm">
          Entre na sua conta para acessar seu armário
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="seu@email.com"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="••••••••"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {error && (
          <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Entrar
        </button>
      </form>

      <p className="text-center text-sm text-muted mt-6">
        Não tem conta?{' '}
        <Link href="/signup" className="text-primary font-medium hover:underline">
          Criar conta
        </Link>
      </p>
    </>
  );
}