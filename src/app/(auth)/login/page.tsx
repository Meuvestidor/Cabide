'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Loader2, Eye, EyeOff, Mail, Lock } from 'lucide-react';

const VIDEO_URL = 'https://bhutjllmjqjitlwpqwjf.supabase.co/storage/v1/object/public/video%20Cabide/cabide.mp4';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

  return (
    <div className="min-h-dvh flex flex-col relative overflow-hidden" style={{ background: '#FDFBF7' }}>
      {/* Video background — top section (vertical 9:16) */}
      <div className="relative w-full" style={{ height: '42vh', minHeight: '240px' }}>
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/video-poster.jpg"
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'cover', objectPosition: 'center top' }}
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(94,79,114,0.35) 0%, rgba(94,79,114,0.15) 40%, rgba(253,251,247,0.7) 80%, rgba(253,251,247,1) 100%)',
          }}
        />

        {/* Brand on video */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6">
          <div className="flex items-center gap-3">
            <h1
              className="leading-none"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '3rem',
                fontWeight: 600,
                fontStyle: 'italic',
                color: '#FDFBF7',
                textShadow: '0 2px 12px rgba(45,42,38,0.3)',
              }}
            >
              Cabidê
            </h1>

            {/* Heart-hanger icon */}
            <svg width="40" height="48" viewBox="0 0 28 36" fill="none">
              <path
                d="M14 6C14 6 10 2 7 4.5C4 7 6 11 14 16C22 11 24 7 21 4.5C18 2 14 6 14 6Z"
                stroke="rgba(196,184,233,0.9)"
                strokeWidth="1.5"
                fill="none"
                strokeLinejoin="round"
              />
              <path d="M14 16L14 20" stroke="rgba(196,184,233,0.9)" strokeWidth="1.5" strokeLinecap="round" />
              <path
                d="M14 20L6 26M14 20L22 26"
                stroke="rgba(196,184,233,0.9)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <p
            className="mt-2"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.7rem',
              letterSpacing: '0.14em',
              color: 'rgba(253,251,247,0.8)',
              textTransform: 'uppercase',
              fontWeight: 400,
              textShadow: '0 1px 8px rgba(45,42,38,0.2)',
            }}
          >
            seu estilo. mais você.
          </p>
        </div>
      </div>

      {/* Form section */}
      <div
        className="flex-1 px-6 pt-6 pb-8 flex flex-col"
        style={{ background: '#FDFBF7' }}
      >
        <p
          className="text-center mb-6"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '1.125rem',
            fontWeight: 400,
            color: '#2D2A26',
          }}
        >
          Acesse seu armário
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full max-w-sm mx-auto">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block mb-1"
              style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#2D2A26' }}
            >
              E-mail
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: '#9A958F' }}
              />
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 transition-colors"
                style={{
                  height: '48px',
                  border: '1.5px solid #E8E4DE',
                  borderRadius: '12px',
                  fontSize: '0.9375rem',
                  background: '#FFFFFF',
                  color: '#2D2A26',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#C4B8E9';
                  e.target.style.boxShadow = '0 0 0 3px rgba(196,184,233,0.25)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E8E4DE';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block mb-1"
              style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#2D2A26' }}
            >
              Senha
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: '#9A958F' }}
              />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-12 transition-colors"
                style={{
                  height: '48px',
                  border: '1.5px solid #E8E4DE',
                  borderRadius: '12px',
                  fontSize: '0.9375rem',
                  background: '#FFFFFF',
                  color: '#2D2A26',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#C4B8E9';
                  e.target.style.boxShadow = '0 0 0 3px rgba(196,184,233,0.25)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E8E4DE';
                  e.target.style.boxShadow = 'none';
                }}
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

            {/* Forgot password link */}
            <div className="flex justify-end mt-1.5">
              <Link
                href="/forgot-password"
                style={{
                  fontSize: '0.75rem',
                  color: '#7A6B8E',
                  textDecoration: 'none',
                }}
              >
                Esqueceu sua senha?
              </Link>
            </div>
          </div>

          {/* Error message */}
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
            className="w-full flex items-center justify-center gap-2 transition-colors"
            style={{
              height: '48px',
              background: loading ? '#D5D0DC' : '#5E4F72',
              color: '#FDFBF7',
              borderRadius: '12px',
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
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px" style={{ background: '#E8E4DE' }} />
            <span style={{ fontSize: '0.75rem', color: '#9A958F' }}>ou</span>
            <div className="flex-1 h-px" style={{ background: '#E8E4DE' }} />
          </div>

          {/* Google login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2.5 transition-colors"
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

          {/* Sign up link */}
          <p
            className="text-center mt-2"
            style={{ fontSize: '0.8125rem', color: '#6B6560' }}
          >
            Não tem conta?{' '}
            <Link
              href="/signup"
              style={{
                color: '#5E4F72',
                fontWeight: 600,
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
                textDecorationThickness: '1px',
              }}
            >
              Criar conta
            </Link>
          </p>
        </form>

        {/* Footer tag */}
        <div
          className="mt-auto pt-6 flex items-center justify-center gap-2"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.625rem',
            letterSpacing: '0.12em',
            color: '#9A958F',
            textTransform: 'uppercase',
          }}
        >
          {/* Mini hanger icon */}
          <svg width="16" height="18" viewBox="0 0 28 36" fill="none" style={{ opacity: 0.5 }}>
            <path
              d="M14 6C14 6 10 2 7 4.5C4 7 6 11 14 16C22 11 24 7 21 4.5C18 2 14 6 14 6Z"
              stroke="#C4B8E9"
              strokeWidth="1.5"
              fill="none"
            />
            <path d="M14 16L14 20M14 20L7 25M14 20L21 25" stroke="#C4B8E9" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          moda · organização · praticidade
        </div>
      </div>
    </div>
  );
}
