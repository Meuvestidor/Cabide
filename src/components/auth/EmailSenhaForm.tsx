'use client';

// ============================================
// Login por e-mail + senha — FORA DA INTERFACE nesta fase.
// Mantido intacto (movido do /login) para ser reutilizado no futuro.
// A entrada atual do Cabidê é: Google + "Experimentar Cabidê".
// ============================================

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { authErrorMessage } from '@/lib/auth-errors';

export function EmailSenhaForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      setError(authErrorMessage(error.message));
      setLoading(false);
      return;
    }

    router.push('/inicio');
  }

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-3 w-full">
      <label htmlFor="email" className="sr-only">E-mail</label>
      <div className="relative">
        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="input pl-10"
        />
      </div>

      <label htmlFor="password" className="sr-only">Senha</label>
      <div className="relative">
        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          id="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Digite sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="input pl-10 pr-12"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted"
          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          tabIndex={-1}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-xs text-background/85 underline underline-offset-2">
          Esqueceu a senha?
        </Link>
      </div>

      {error && (
        <p role="alert" className="text-sm px-3 py-2.5 rounded-[2px] bg-surface text-danger border border-danger/30">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn btn-primary w-full mt-1">
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Entrando...
          </>
        ) : (
          'Entrar'
        )}
      </button>
    </form>
  );
}
