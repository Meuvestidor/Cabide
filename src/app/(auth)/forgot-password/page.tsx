'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha`,
    });

    setLoading(false);
    // Por segurança, a confirmação é a mesma exista ou não a conta.
    // Só mostramos erro quando o envio realmente não pôde ser feito.
    if (error && /rate limit|too many/i.test(error.message)) {
      setError('Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.');
      return;
    }
    if (error && /fetch|network/i.test(error.message)) {
      setError('Parece que a conexão caiu. Verifique sua internet e tente de novo.');
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-dvh flex flex-col px-6 pt-10 pb-10 bg-background">
      <div className="w-full max-w-sm mx-auto">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-muted mb-12">
          <ArrowLeft size={16} /> Voltar
        </Link>

        {sent ? (
          <>
            <Mail size={28} strokeWidth={1.5} className="mb-5 text-gold" />
            <p className="eyebrow mb-3">Recuperar acesso</p>
            <h1 className="display text-[2rem] mb-3">Verifique seu e-mail</h1>
            <p className="text-sm text-muted leading-relaxed">
              Se existir uma conta com <strong className="text-foreground">{email}</strong>, você vai receber um link para
              criar uma nova senha.
            </p>
            <Link href="/login" className="btn btn-primary w-full mt-8">
              Voltar ao login
            </Link>
          </>
        ) : (
          <>
            <p className="eyebrow mb-3">Recuperar acesso</p>
            <h1 className="display text-[2rem] mb-2">Esqueceu sua senha?</h1>
            <p className="text-sm text-muted mb-8">
              Informe seu e-mail e enviaremos um link para você criar uma nova senha.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="email" className="block mb-1.5 text-[13px] font-semibold">E-mail</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input"
                />
              </div>
              {error && (
                <p role="alert" className="text-sm px-3 py-2.5 rounded-[2px] bg-surface text-danger border border-danger/30">
                  {error}
                </p>
              )}
              <button type="submit" disabled={loading} className="btn btn-primary w-full">
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Enviar link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
