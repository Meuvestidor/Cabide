'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Loader2, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { CabideMark } from '@/components/icons';
import { GoogleIcon } from '@/components/auth/GoogleIcon';
import { authErrorMessage } from '@/lib/auth-errors';

const VIDEO_URL = 'https://bhutjllmjqjitlwpqwjf.supabase.co/storage/v1/object/public/video%20Cabide/cabide.mp4';

// Desktop (>= 1024px e horizontal): fotografia editorial em tela cheia.
// Móvel e tablet vertical: vídeo 9:16. A mídia do vídeo é o complemento exato,
// então o vídeo não é baixado no desktop.
const VIDEO_MEDIA = '(max-width: 1023.98px), (orientation: portrait)';

// Fotografia editorial do vestidor (fundo de tela cheia no desktop).
// Se for null, o fundo usa um tom neutro (Sand) no lugar da foto.
const LOGIN_EDITORIAL_PHOTO: string | null = '/login-vestidor.webp';

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
      setError(authErrorMessage(error.message));
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
    <div className="relative min-h-dvh flex flex-col overflow-hidden bg-primary">
      {/* Móvel e tablet vertical: vídeo do armário em tela cheia (não carrega no desktop) */}
      <video
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover lg:landscape:hidden"
        style={{ objectPosition: 'center top' }}
      >
        <source src={VIDEO_URL} type="video/mp4" media={VIDEO_MEDIA} />
      </video>

      {/* Desktop: fotografia editorial ocupando toda a tela, atrás do login */}
      <div
        aria-hidden="true"
        data-placeholder={LOGIN_EDITORIAL_PHOTO ? undefined : 'login-editorial-photo'}
        className="hidden lg:landscape:block absolute inset-0 bg-sand"
      >
        {LOGIN_EDITORIAL_PHOTO && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={LOGIN_EDITORIAL_PHOTO} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
      </div>

      {/* Desktop: overlay para legibilidade — mais escuro no centro, onde fica o formulário */}
      <div
        aria-hidden="true"
        className="hidden lg:landscape:block absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 85% at 50% 50%, rgba(26,26,26,0.72) 0%, rgba(26,26,26,0.55) 55%, rgba(26,26,26,0.35) 100%)',
        }}
      />

      {/* Móvel: overlay escuro para legibilidade sobre o vídeo */}
      <div
        aria-hidden="true"
        className="absolute inset-0 lg:landscape:hidden"
        style={{
          background:
            'linear-gradient(180deg, rgba(26,26,26,0.35) 0%, rgba(26,26,26,0.25) 35%, rgba(26,26,26,0.72) 70%, rgba(26,26,26,0.88) 100%)',
        }}
      />

      {/* Conteúdo do login — sempre sobre a imagem (vídeo no móvel, foto no desktop) */}
      <div className="relative z-10 flex-1 flex flex-col px-6 pt-16 pb-8 max-w-md w-full mx-auto lg:landscape:justify-center lg:landscape:py-12">
        {/* Marca */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <h1 className="display italic text-[3.25rem] text-background">Cabidê</h1>
            <CabideMark size={34} color="#C6A15B" />
          </div>
          <p className="eyebrow mt-3 text-background/80">Seu estilo. Mais você.</p>
        </div>

        <div className="flex-1 lg:landscape:flex-none lg:landscape:h-14" />

        {/* Formulário sobre a imagem */}
        <h2 className="display text-[1.75rem] text-background mb-5">Acesse seu armário</h2>

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

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-background/30" />
            <span className="text-xs text-background/70">ou</span>
            <div className="flex-1 h-px bg-background/30" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="btn w-full bg-surface text-foreground border border-surface hover:bg-surface-alt"
          >
            {googleLoading ? <Loader2 size={18} className="animate-spin text-muted" /> : <GoogleIcon />}
            Continuar com Google
          </button>

          <p className="text-center mt-3 text-sm text-background/85">
            Não tem conta?{' '}
            <Link href="/signup" className="font-semibold text-background underline underline-offset-2 decoration-gold">
              Criar conta
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
