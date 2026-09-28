'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { CabideMark } from '@/components/icons';
import { GoogleIcon } from '@/components/auth/GoogleIcon';
import { entrarComGoogle, experimentarCabide } from '@/lib/conta';

const VIDEO_URL = 'https://bhutjllmjqjitlwpqwjf.supabase.co/storage/v1/object/public/video%20Cabide/cabide.mp4';

// Desktop (>= 1024px e horizontal): fotografia editorial em tela cheia.
// Móvel e tablet vertical: vídeo 9:16. A mídia do vídeo é o complemento exato,
// então o vídeo não é baixado no desktop.
const VIDEO_MEDIA = '(max-width: 1023.98px), (orientation: portrait)';

// Fotografia editorial do vestidor (fundo de tela cheia no desktop).
// Se for null, o fundo usa um tom neutro (Sand) no lugar da foto.
const LOGIN_EDITORIAL_PHOTO: string | null = '/login-vestidor.webp';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [experimentarLoading, setExperimentarLoading] = useState(false);
  const router = useRouter();

  // Fase atual: entrada apenas por Google ou "Experimentar Cabidê".
  // O formulário e-mail + senha foi preservado em components/auth/EmailSenhaForm.tsx.

  async function handleGoogleLogin() {
    setError(null);
    setGoogleLoading(true);
    const { error } = await entrarComGoogle('/inicio');
    if (error) {
      setError('Não conseguimos conectar com o Google. Tente novamente.');
      setGoogleLoading(false);
    }
  }

  async function handleExperimentar() {
    setError(null);
    setExperimentarLoading(true);
    const { error } = await experimentarCabide();
    if (error) {
      console.error('[Acesso] Falha ao iniciar a experiência:', error.message);
      setError('Não conseguimos abrir o Cabidê agora. Tente novamente em instantes.');
      setExperimentarLoading(false);
      return;
    }
    router.push('/inicio');
    router.refresh();
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
        {/* Marca — presença editorial desde a primeira tela */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-3">
            <h1 className="display italic text-[4.25rem] leading-none text-background">Cabidê</h1>
            <CabideMark size={46} color="#C6A15B" />
          </div>
          <p className="eyebrow mt-4 text-background/80">Seu estilo. Mais você.</p>
        </div>

        <div className="flex-1 lg:landscape:flex-none lg:landscape:h-14" />

        <h2 className="display text-[1.75rem] text-background mb-5">Acesse seu armário</h2>

        <div className="flex flex-col gap-3 w-full">
          {error && (
            <p role="alert" className="text-sm px-3 py-2.5 rounded-[2px] bg-surface text-danger border border-danger/30">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || experimentarLoading}
            className="btn w-full bg-surface text-foreground border border-surface hover:bg-surface-alt"
          >
            {googleLoading ? <Loader2 size={18} className="animate-spin text-muted" /> : <GoogleIcon />}
            Continuar com Google
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-background/30" />
            <span className="text-xs text-background/70">ou</span>
            <div className="flex-1 h-px bg-background/30" />
          </div>

          <button
            type="button"
            onClick={handleExperimentar}
            disabled={googleLoading || experimentarLoading}
            className="btn btn-primary w-full"
          >
            {experimentarLoading ? <Loader2 size={18} className="animate-spin" /> : 'Experimentar Cabidê'}
          </button>
        </div>
      </div>
    </div>
  );
}
