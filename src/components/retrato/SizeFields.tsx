'use client';

import { TAMANHOS_LETRA, TAMANHOS_NUMERO_BAIXO } from '@/lib/retrato';
import type { MedidasUsuaria } from '@/types/database';

/**
 * Tamanhos opcionais no fim da P6 (não é uma etapa nova).
 * Parte de cima, parte de baixo (letras e/ou numeração) e calçado são
 * independentes: o corpo não é tratado como simétrico.
 * Usados como sinal suave de caimento e reservados também para
 * sugestões de compra e parcerias com lojas/brechós.
 */

type Campo = keyof Pick<MedidasUsuaria, 'tamanho_cima' | 'tamanho_baixo' | 'tamanho_baixo_numero'>;

function Grade({
  opcoes,
  valor,
  campo,
  comOutro,
  medidas,
  onChange,
  rotulo,
}: {
  opcoes: readonly string[];
  valor: string;
  campo: Campo;
  comOutro: boolean;
  medidas: MedidasUsuaria;
  onChange: (m: MedidasUsuaria) => void;
  rotulo: string;
}) {
  const outroAtivo = comOutro && valor !== '' && !opcoes.includes(valor);
  const set = (v: string | undefined) => onChange({ ...medidas, [campo]: v });

  return (
    <div>
      <div role="radiogroup" aria-label={rotulo} className="grid grid-cols-4 gap-2">
        {opcoes.map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={valor === t}
            onClick={() => set(valor === t ? undefined : t)}
            className="option justify-center font-semibold px-2"
          >
            {t}
          </button>
        ))}
        {comOutro && (
          <button
            type="button"
            role="radio"
            aria-checked={outroAtivo}
            onClick={() => set(outroAtivo ? undefined : ' ')}
            className="option justify-center font-semibold px-2"
          >
            Outro
          </button>
        )}
      </div>
      {outroAtivo && (
        <input
          type="text"
          value={valor.trim()}
          onChange={(e) => set(e.target.value || ' ')}
          placeholder="Qual?"
          maxLength={12}
          aria-label={`${rotulo}: outro tamanho`}
          className="input mt-2"
          autoFocus
        />
      )}
    </div>
  );
}

export function SizeFields({
  medidas,
  onChange,
}: {
  medidas: MedidasUsuaria;
  onChange: (m: MedidasUsuaria) => void;
}) {
  return (
    <div className="mt-10 pt-6 border-t border-border">
      <h2 className="display text-[1.25rem] leading-snug">Se quiser, conte também seu tamanho</h2>
      <p className="text-[13px] text-muted mt-1 mb-5">Opcional. Preencha só o que fizer sentido para você.</p>

      <p className="eyebrow mb-2">Parte de cima</p>
      <Grade
        rotulo="Parte de cima"
        opcoes={TAMANHOS_LETRA}
        valor={medidas.tamanho_cima ?? ''}
        campo="tamanho_cima"
        comOutro
        medidas={medidas}
        onChange={onChange}
      />

      <p className="eyebrow mt-6 mb-2">Parte de baixo</p>
      <Grade
        rotulo="Parte de baixo em letras"
        opcoes={TAMANHOS_LETRA}
        valor={medidas.tamanho_baixo ?? ''}
        campo="tamanho_baixo"
        comOutro={false}
        medidas={medidas}
        onChange={onChange}
      />
      <p className="text-[12px] text-muted mt-3 mb-2">e/ou numeração</p>
      <Grade
        rotulo="Parte de baixo em numeração"
        opcoes={TAMANHOS_NUMERO_BAIXO}
        valor={medidas.tamanho_baixo_numero ?? ''}
        campo="tamanho_baixo_numero"
        comOutro
        medidas={medidas}
        onChange={onChange}
      />

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
