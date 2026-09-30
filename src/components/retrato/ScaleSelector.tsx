'use client';

import type { Escala } from '@/types/database';

/** Escala 1–5 sem valor pré-selecionado. */
export function ScaleSelector({
  valor,
  onChange,
  rotuloMin,
  rotuloMax,
  nome,
}: {
  valor: Escala | undefined;
  onChange: (v: Escala | undefined) => void;
  rotuloMin: string;
  rotuloMax: string;
  nome: string;
}) {
  return (
    <div>
      <div role="radiogroup" aria-label={nome} className="grid grid-cols-5 gap-2">
        {([1, 2, 3, 4, 5] as Escala[]).map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={valor === n}
            aria-label={`${n} de 5`}
            onClick={() => onChange(valor === n ? undefined : n)}
            className="option justify-center font-semibold text-base"
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[11px] text-muted">
        <span>{rotuloMin}</span>
        <span>{rotuloMax}</span>
      </div>
    </div>
  );
}
