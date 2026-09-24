'use client';

import { ArrowLeft } from 'lucide-react';
import { TOTAL_PERGUNTAS } from '@/lib/retrato';

/**
 * Moldura de cada pergunta do Retrato Cabidê:
 * eyebrow + barra fina + "N de 9" + Pular, pergunta em Newsreader,
 * instrução em Manrope, Voltar / Próxima fixos no rodapé.
 */
export function StepShell({
  etapa,
  opcional = false,
  pergunta,
  instrucao,
  onVoltar,
  onPular,
  onProxima,
  proximaHabilitada,
  proximaLabel = 'Próxima',
  children,
}: {
  etapa: number;
  opcional?: boolean;
  pergunta: string;
  instrucao?: string;
  onVoltar: () => void;
  onPular: () => void;
  onProxima: () => void;
  proximaHabilitada: boolean;
  proximaLabel?: string;
  children: React.ReactNode;
}) {
  const progresso = opcional ? 100 : Math.round((etapa / TOTAL_PERGUNTAS) * 100);

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-10 bg-background px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="eyebrow">Retrato Cabidê</p>
          <button type="button" onClick={onPular} className="text-[13px] font-semibold text-foreground px-1 py-1">
            Pular
          </button>
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progresso}
          aria-label={opcional ? 'Pergunta opcional' : `Pergunta ${etapa} de ${TOTAL_PERGUNTAS}`}
        >
          <span style={{ width: `${progresso}%` }} />
        </div>
        <p className="text-[11px] text-muted mt-2 text-right">
          {opcional ? 'Opcional' : `${etapa} de ${TOTAL_PERGUNTAS}`}
        </p>
      </header>

      <main className="flex-1 px-5 pb-32">
        <h1 className="display text-[1.85rem] leading-tight mt-2">{pergunta}</h1>
        {instrucao && <p className="text-[13px] text-muted mt-2">{instrucao}</p>}
        <div className="mt-6">{children}</div>
      </main>

      <footer
        className="fixed bottom-0 left-0 right-0 bg-background border-t border-border"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="max-w-lg mx-auto px-5 py-3 grid grid-cols-[auto_1fr] gap-3">
          <button type="button" onClick={onVoltar} className="btn btn-ghost px-3" aria-label="Voltar">
            <ArrowLeft size={18} /> Voltar
          </button>
          <button type="button" onClick={onProxima} disabled={!proximaHabilitada} className="btn btn-primary">
            {proximaLabel}
          </button>
        </div>
      </footer>
    </div>
  );
}

/** Subtítulo de um bloco dentro da mesma pergunta (ex.: "Parte de cima"). */
export function SubPergunta({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`display text-[1.25rem] leading-snug mt-8 mb-3 ${className}`}>{children}</h2>;
}
