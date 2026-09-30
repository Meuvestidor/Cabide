'use client';

import { useState } from 'react';

/**
 * Tamanho DA PEÇA (etiqueta), informado pela usuária na ficha.
 * Não tem relação com os tamanhos do Retrato (medidas da usuária).
 */
export const TAMANHOS_PECA_LETRA = ['PP', 'P', 'M', 'G', 'GG', 'XG'] as const;
export const TAMANHOS_PECA_NUMERO = ['36', '38', '40', '42', '44', '46', '48'] as const;

/** Categorias de roupa em que a numeração (36–48) faz sentido. */
const COM_NUMERACAO = new Set(['parte_de_cima', 'parte_de_baixo', 'vestido', 'macacao', 'casaco', 'praia', 'esporte', 'roupa_intima']);

export function TamanhoPecaPicker({
  categoria,
  valor,
  onEscolher,
}: {
  categoria: string;
  valor: string | null;
  /** string = tamanho escolhido; null = "Não informado". */
  onEscolher: (v: string | null) => void;
}) {
  const calcado = categoria === 'calcado';
  const conhecido = (TAMANHOS_PECA_LETRA as readonly string[]).includes(valor ?? '') || (TAMANHOS_PECA_NUMERO as readonly string[]).includes(valor ?? '');
  const [outroAberto, setOutroAberto] = useState(calcado || (!!valor && !conhecido));
  const [outro, setOutro] = useState(valor && !conhecido ? valor : '');

  const chip = (v: string, rotulo = v) => (
    <button
      key={rotulo}
      type="button"
      role="radio"
      aria-checked={valor === v}
      onClick={() => onEscolher(v)}
      className={`min-w-11 h-10 px-3 rounded-[4px] border text-sm font-semibold ${
        valor === v ? 'bg-primary text-background border-primary' : 'bg-surface text-foreground border-border'
      }`}
    >
      {rotulo}
    </button>
  );

  const confirmarOutro = () => {
    const t = outro.trim().slice(0, 12);
    if (t) onEscolher(t);
  };

  return (
    <div className="mt-2 flex flex-col gap-3" aria-label="Informar tamanho da peça">
      {!calcado && (
        <div role="radiogroup" aria-label="Tamanho em letras" className="flex flex-wrap gap-2">
          {TAMANHOS_PECA_LETRA.map((t) => chip(t))}
        </div>
      )}
      {COM_NUMERACAO.has(categoria) && (
        <div>
          <p className="text-[11px] text-muted mb-1.5">ou numeração</p>
          <div role="radiogroup" aria-label="Tamanho em numeração" className="flex flex-wrap gap-2">
            {TAMANHOS_PECA_NUMERO.map((t) => chip(t))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {!calcado && (
          <button
            type="button"
            onClick={() => setOutroAberto(true)}
            aria-pressed={outroAberto}
            className={`h-10 px-3 rounded-[4px] border text-sm ${outroAberto ? 'border-primary text-foreground font-semibold' : 'border-border text-foreground'}`}
          >
            Outro
          </button>
        )}
        <button type="button" onClick={() => onEscolher(null)} className="h-10 px-3 rounded-[4px] border border-border text-sm text-muted">
          Não informado
        </button>
      </div>
      {outroAberto && (
        <div className="flex gap-2">
          <input
            type="text"
            inputMode={calcado ? 'numeric' : 'text'}
            maxLength={12}
            value={outro}
            onChange={(e) => setOutro(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && confirmarOutro()}
            placeholder={calcado ? 'Ex.: 37' : 'Ex.: 50, U, 2'}
            aria-label={calcado ? 'Numeração do calçado' : 'Outro tamanho'}
            className="input flex-1 h-10"
          />
          <button type="button" onClick={confirmarOutro} disabled={!outro.trim()} className="btn btn-outline h-10 min-h-10">
            OK
          </button>
        </div>
      )}
    </div>
  );
}
