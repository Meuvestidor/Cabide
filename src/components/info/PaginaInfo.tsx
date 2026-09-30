'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { CabideMark } from '@/components/icons';

export const CONTATO_EMAIL = 'meuvestidor@gmail.com';

/** Moldura das páginas institucionais (Privacidade, Termos de uso, Ajuda). Públicas: abrem com ou sem sessão. */
export function PaginaInfo({
  titulo,
  atualizacao,
  children,
}: {
  titulo: string;
  atualizacao?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  function voltar() {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/login');
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-16">
        <div className="flex items-center justify-between mb-10">
          <button type="button" onClick={voltar} className="flex items-center gap-2 text-sm text-muted hover:text-foreground min-h-11">
            <ArrowLeft size={18} strokeWidth={1.75} /> Voltar
          </button>
          <Link href="/inicio" aria-label="Cabidê" className="text-foreground">
            <CabideMark size={24} color="#C6A15B" />
          </Link>
        </div>
        <h1 className="display text-[2.5rem] leading-tight">{titulo}</h1>
        {atualizacao && <p className="text-[13px] text-muted mt-2">Última atualização: {atualizacao}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}

export function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="py-6 border-t border-border">
      <h2 className="display text-[1.5rem] mb-3">{titulo}</h2>
      <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-foreground">{children}</div>
    </section>
  );
}

export function Lista({ itens }: { itens: string[] }) {
  return (
    <ul className="flex flex-col gap-1.5 pl-5 list-disc marker:text-gold">
      {itens.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

export function EmailContato() {
  return (
    <a href={`mailto:${CONTATO_EMAIL}`} className="font-semibold text-primary underline underline-offset-4 decoration-gold">
      {CONTATO_EMAIL}
    </a>
  );
}
