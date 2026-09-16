'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';
import { Loader2, CheckCircle } from 'lucide-react';

export default function SignupPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-success" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Conta criada!
        </h2>
        <p className="text-muted text-sm mb-6">
          Verifique seu e-mail para confirmar a conta. Depois, faça login.
        </p>
        <Link
          href="/login"
          className="inline-block py-3 px-8 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-colors"
        >
          Ir para login
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl text-foreground">Criar conta</h1>
        <p className="text-muted mt-2 text-sm">
          Comece a organizar seu armário com IA
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-foreground mb-1.5">
            Nome
          </label>
          <input
            id="nome"
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            required
            placeholder="Seu nome"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

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
            placeholder="Mínimo 6 caracteres"
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
          Criar conta
        </button>
      </form>

      <p className="text-center text-sm text-muted mt-6">
        Já tem conta?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Fazer login
        </Link>
      </p>
    </>
  );
}