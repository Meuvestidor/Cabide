'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

/**
 * Seletor de categoria do armário: um botão "Categoria ▾" que abre a lista
 * completa (bottom sheet no celular, painel centralizado em telas maiores).
 * A lista vem dos dados (CATEGORIAS), então novas categorias entram sem mudar a interface.
 */
export function CategoriaSelector({
  valor,
  onChange,
  categorias,
}: {
  valor: string;
  onChange: (v: string) => void;
  categorias: Record<string, string>;
}) {
  const [aberto, setAberto] = useState(false);
  const opcoes: [string, string][] = [['todas', 'Todas'], ...Object.entries(categorias)];
  const atual = opcoes.find(([k]) => k === valor)?.[1] ?? 'Todas';

  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [aberto]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        className="option w-auto min-h-11 gap-2 pr-3"
      >
        <span className="text-muted text-[13px]">Categoria:</span>
        <span className="font-semibold text-[13px]">{atual}</span>
        <ChevronDown size={16} className="text-muted" />
      </button>

      {aberto && (
        <div className="fixed inset-0 z-[60] bg-foreground/40 flex items-end sm:items-center justify-center" onClick={() => setAberto(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="categoria-titulo"
            className="sheet sm:rounded-[4px] w-full max-w-md max-h-[80dvh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
              <h2 id="categoria-titulo" className="display text-[1.5rem]">
                Categoria
              </h2>
              <button type="button" onClick={() => setAberto(false)} className="p-1 text-muted" aria-label="Fechar">
                <X size={18} />
              </button>
            </div>
            <div role="radiogroup" aria-labelledby="categoria-titulo" className="overflow-y-auto px-5 pb-6">
              {opcoes.map(([key, label]) => {
                const selecionada = key === valor;
                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={selecionada}
                    onClick={() => {
                      onChange(key);
                      setAberto(false);
                    }}
                    className={`w-full flex items-center justify-between py-3.5 border-b border-border text-left text-sm ${
                      selecionada ? 'font-semibold text-foreground' : 'text-foreground'
                    }`}
                  >
                    {label}
                    {selecionada && <Check size={16} className="text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
