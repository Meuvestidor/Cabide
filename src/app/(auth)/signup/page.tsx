'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';
import { Loader2, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { CabideMark } from '@/components/icons';
import { GoogleIcon } from '@/components/auth/GoogleIcon';
import { authErrorMessage } from '@/lib/auth-errors';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) {
      setError(authErrorMessage(error.message));
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  async function handleGoogleLogin() {
    setError(null);
    setGoogleLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/inicio`,
      },
    });

    if (error) {
      setError('Erro ao conectar com Google. Tente novamente.');
      setGoogleLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-background">
        <div className="text-center max-w-sm">
          <Mail size={28} strokeWidth={1.5} className="mx-auto mb-5 text-gold" />
          <p className="eyebrow mb-3">Quase lá</p>
          <h2 className="display text-[2rem] mb-3">Verifique seu e-mail</h2>
          <p className="text-sm text-muted leading-relaxed">
            Enviamos um link de confirmação para <strong className="text-foreground">{email}</strong>.
            Clique no link para ativar sua conta.
          </p>
          <Link href="/login" className="btn btn-primary mt-8 w-full">
            Voltar ao login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col px-6 pt-14 pb-10 bg-background">
      <div className="w-full max-w-sm mx-auto">
        <div className="flex items-center gap-2 mb-10">
          <span className="display italic text-2xl">Cabidê</span>
          <CabideMark size={20} color="#C6A15B" />
        </div>

        <p className="eyebrow mb-3">Criar conta</p>
        <h1 className="display text-[2.25rem] mb-2">Seu estilo começa com você.</h1>
        <p className="text-sm text-muted mb-8">Comece a descobrir o potencial do seu armário.</p>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="block mb-1.5 text-[13px] font-semibold">Nome</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input pl-10"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block mb-1.5 text-[13px] font-semibold">E-mail</label>
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
          </div>

          <div>
            <label htmlFor="password" className="block mb-1.5 text-[13px] font-semibold">Senha</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
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
          </div>

          {error && (
            <p role="alert" className="text-sm px-3 py-2.5 rounded-[2px] bg-surface text-danger border border-danger/30">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary w-full mt-2">
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Criando conta...
              </>
            ) : (
              'Criar conta'
            )}
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 rule" />
            <span className="text-xs text-muted">ou</span>
            <div className="flex-1 rule" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="btn btn-outline w-full border-border bg-surface"
          >
            {googleLoading ? <Loader2 size={18} className="animate-spin text-muted" /> : <GoogleIcon />}
            Continuar com Google
          </button>

          <p className="text-center mt-2 text-sm text-muted">
            Já tem conta?{' '}
            <Link href="/login" className="link">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
