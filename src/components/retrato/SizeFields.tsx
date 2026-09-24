'use client';

import { TAMANHOS_ROUPA } from '@/lib/retrato';
import type { MedidasUsuaria } from '@/types/database';

/**
 * Tamanhos opcionais no fim da P6 (não é uma etapa nova).
 * Usados como sinal suave de caimento e reservados também para
 * sugestões de compra e parcerias com lojas/brechós.
 */
export function SizeFields({
  medidas,
  onChange,
}: {
  medidas: MedidasUsuaria;
  onChange: (m: MedidasUsuaria) => void;
}) {
  const roupa = medidas.tamanho_roupa ?? '';
  const isPadrao = (TAMANHOS_ROUPA as readonly string[]).includes(roupa);
  const outroAtivo = roupa !== '' && !isPadrao;

  return (
    <div className="mt-10 pt-6 border-t border-border">
      <h2 className="display text-[1.25rem] leading-snug">Se quiser, conte também seu tamanho</h2>
      <p className="text-[13px] text-muted mt-1 mb-4">Opcional.</p>

      <p className="eyebrow mb-2">Roupa</p>
      <div className="grid grid-cols-4 gap-2">
        {TAMANHOS_ROUPA.map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={roupa === t}
            onClick={() => onChange({ ...medidas, tamanho_roupa: roupa === t ? undefined : t })}
            className="option justify-center font-semibold"
          >
            {t}
          </button>
        ))}
        <button
          type="button"
          role="radio"
          aria-checked={outroAtivo}
          onClick={() => onChange({ ...medidas, tamanho_roupa: outroAtivo ? undefined : ' ' })}
          className="option justify-center font-semibold col-span-2"
        >
          Outro
        </button>
      </div>
      {outroAtivo && (
        <input
          type="text"
          value={roupa.trim()}
          onChange={(e) => onChange({ ...medidas, tamanho_roupa: e.target.value || ' ' })}
          placeholder="Ex.: 40, 42…"
          maxLength={12}
          aria-label="Outro tamanho de roupa"
          className="input mt-2"
          autoFocus
        />
      )}

      <label htmlFor="calcado" className="eyebrow block mt-6 mb-2">Calçado</label>
      <input
        id="calcado"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        value={medidas.tamanho_calcado ?? ''}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '');
          onChange({ ...medidas, tamanho_calcado: v || undefined });
        }}
        placeholder="Ex.: 37"
        className="input w-28"
      />
    </div>
  );
}
