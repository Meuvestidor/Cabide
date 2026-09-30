'use client';

import { Check } from 'lucide-react';

export type PecaResumo = { id: string; nome: string; imagem_url: string | null };

/** P10 — escolha de uma peça real do armário pelas fotos. */
export function PiecePicker({
  pecas,
  selecionada,
  onChange,
}: {
  pecas: PecaResumo[];
  selecionada: string | undefined;
  onChange: (id: string | undefined) => void;
}) {
  return (
    <div role="radiogroup" className="grid grid-cols-3 gap-2">
      {pecas.map((p) => {
        const sel = selecionada === p.id;
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={sel}
            aria-label={p.nome}
            onClick={() => onChange(sel ? undefined : p.id)}
            className={`relative text-left ${sel ? '' : 'opacity-90'}`}
          >
            <div
              className={`aspect-[3/4] overflow-hidden rounded-[4px] bg-surface-alt ${
                sel ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
              }`}
            >
              {p.imagem_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imagem_url} alt="" className="w-full h-full object-cover" loading="lazy" />
              )}
            </div>
            {sel && (
              <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary text-background flex items-center justify-center">
                <Check size={12} strokeWidth={2.5} />
              </span>
            )}
            <p className="text-[11px] mt-1.5 truncate">{p.nome}</p>
          </button>
        );
      })}
    </div>
  );
}
