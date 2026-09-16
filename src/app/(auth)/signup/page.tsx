'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Loader2, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

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
      setError(
        error.message === 'User already registered'
          ? 'Este e-mail já está cadastrado.'
          : error.message
      );
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

  const inputStyle = {
    height: '48px',
    border: '1.5px solid #E8E4DE',
    borderRadius: '12px',
    fontSize: '0.9375rem',
    background: '#FFFFFF',
    color: '#2D2A26',
    outline: 'none',
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#C4B8E9';
    e.target.style.boxShadow = '0 0 0 3px rgba(196,184,233,0.25)';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#E8E4DE';
    e.target.style.boxShadow = 'none';
  };

  if (success) {
    return (
      <div
        className="min-h-dvh flex flex-col items-center justify-center px-6"
        style={{ background: '#FDFBF7' }}
      >
        <div className="text-center max-w-sm">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: '#EFF6F1' }}
          >
            <Mail size={28} style={{ color: '#4A7C59' }} />
          </div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#2D2A26',
              marginBottom: '8px',
            }}
          >
            Verifique seu e-mail
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#6B6560', lineHeight: 1.6 }}>
            Enviamos um link de confirmação para <strong style={{ color: '#2D2A26' }}>{email}</strong>.
            Clique no link para ativar sua conta.
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 px-6 py-3 text-sm font-medium transition-colors"
            style={{
              background: '#5E4F72',
              color: '#FDFBF7',
              borderRadius: '9999px',
            }}
          >
            Voltar ao login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh flex flex-col px-6 pt-12 pb-8"
      style={{ background: '#FDFBF7' }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '2rem',
            fontWeight: 600,
            color: '#5E4F72',
          }}
        >
          Criar conta
        </h1>
        <p
          className="mt-2"
          style={{ fontSize: '0.875rem', color: '#6B6560' }}
        >
          Comece a descobrir o potencial do seu armário
        </p>
      </div>

      <form onSubmit={handleSignup} className="flex flex-col gap-4 w-full max-w-sm mx-auto">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block mb-1" style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#2D2A26' }}>
            Nome
          </label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9A958F' }} />
            <input
              id="name"
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full pl-10 pr-4"
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block mb-1" style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#2D2A26' }}>
            E-mail
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9A958F' }} />
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4"
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block mb-1" style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#2D2A26' }}>
            Senha
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9A958F' }} />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pl-10 pr-12"
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
              style={{ color: '#9A958F' }}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            className="px-4 py-3 rounded-xl text-sm"
            style={{
              background: '#FDF0EF',
              color: '#B5443A',
              border: '1px solid rgba(181,68,58,0.15)',
            }}
          >
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 mt-2"
          style={{
            height: '48px',
            background: loading ? '#D5D0DC' : '#5E4F72',
            color: '#FDFBF7',
            borderRadius: '9999px',
            border: 'none',
            fontSize: '0.9375rem',
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Criando conta...
            </>
          ) : (
            'Criar conta'
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px" style={{ background: '#E8E4DE' }} />
          <span style={{ fontSize: '0.75rem', color: '#9A958F' }}>ou</span>
          <div className="flex-1 h-px" style={{ background: '#E8E4DE' }} />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-2.5"
          style={{
            height: '48px',
            background: '#FFFFFF',
            color: '#2D2A26',
            borderRadius: '12px',
            border: '1.5px solid #E8E4DE',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: googleLoading ? 'not-allowed' : 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {googleLoading ? (
            <Loader2 size={18} className="animate-spin" style={{ color: '#9A958F' }} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          Continuar com Google
        </button>

        {/* Login link */}
        <p className="text-center mt-2" style={{ fontSize: '0.8125rem', color: '#6B6560' }}>
          Já tem conta?{' '}
          <Link href="/login" style={{ color: '#5E4F72', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '2px', textDecorationThickness: '1px' }}>
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
}
