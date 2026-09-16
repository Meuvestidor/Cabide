'use client';

import { Shirt } from 'lucide-react';
import { FLAT_LAY_POSITIONS } from '@/lib/constants';

interface PecaForFlatLay {
  id: string;
  nome: string;
  categoria: string;
  imagem_url: string;
  hex: string | null;
}

/**
 * FlatLayView — renders a look's pieces in a mannequin-style grid.
 *
 * Grid layout (3 rows × 2 cols):
 *   [top/outer]  [accessory/jewelry]
 *   [bottom]     [bag]
 *   [shoes]      [—]
 *
 * If the look uses a dress/mono, it spans rows 1-2 in col 1.
 */
export function FlatLayView({
  pecas,
  compact = false,
}: {
  pecas: PecaForFlatLay[];
  compact?: boolean;
}) {
  if (!pecas || pecas.length === 0) return null;

  // Separate pieces by category for placement
  const hasDress = pecas.some(
    (p) => p.categoria === 'vestido' || p.categoria === 'macacao'
  );

  // Sort pieces into slots
  const slots: Record<string, PecaForFlatLay | null> = {
    top: null,
    outer: null,
    bottom: null,
    dress: null,
    shoes: null,
    bag: null,
    accessory: null,
    jewelry: null,
  };

  for (const peca of pecas) {
    const cat = peca.categoria;
    if (cat === 'vestido' || cat === 'macacao') slots.dress = peca;
    else if (cat === 'parte_de_cima') {
      if (!slots.top) slots.top = peca;
    } else if (cat === 'casaco') slots.outer = peca;
    else if (cat === 'parte_de_baixo') slots.bottom = peca;
    else if (cat === 'calcado') slots.shoes = peca;
    else if (cat === 'bolsa') slots.bag = peca;
    else if (cat === 'acessorio') slots.accessory = peca;
    else if (cat === 'joias') slots.jewelry = peca;
  }

  const baseSize = compact ? 'w-full' : 'w-full max-w-sm mx-auto';
  const cellClass = compact
    ? 'rounded-lg overflow-hidden'
    : 'rounded-xl overflow-hidden shadow-sm border border-border';
  const imgClass = 'w-full h-full object-cover';
  const emptyClass =
    'w-full h-full flex items-center justify-center bg-surface-alt';

  function PieceCell({
    peca,
    aspectRatio = 'aspect-square',
  }: {
    peca: PecaForFlatLay | null;
    aspectRatio?: string;
  }) {
    if (!peca) return null;
    return (
      <div className={`${cellClass} ${aspectRatio} relative group`}>
        {peca.imagem_url ? (
          <img src={peca.imagem_url} alt={peca.nome} className={imgClass} />
        ) : (
          <div className={emptyClass}>
            <Shirt size={compact ? 16 : 24} className="text-muted" />
          </div>
        )}
        {/* Label on hover/always in expanded */}
        {!compact && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <p className="text-[10px] text-white font-medium truncate">
              {peca.nome}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={baseSize}>
      <div
        className="grid gap-1.5"
        style={{
          gridTemplateColumns: '1fr 0.6fr',
          gridTemplateRows: hasDress
            ? 'auto auto auto'
            : 'auto auto auto',
        }}
      >
        {/* Row 1: Top or Dress (spanning) + Accessory/Jewelry */}
        {hasDress ? (
          <>
            <div style={{ gridRow: '1 / 3', gridColumn: '1' }}>
              <PieceCell
                peca={slots.dress}
                aspectRatio="aspect-[3/4]"
              />
              {/* Outer layer overlay if present */}
              {slots.outer && (
                <div className="mt-1.5">
                  <PieceCell peca={slots.outer} />
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div style={{ gridRow: '1', gridColumn: '1' }}>
              {slots.outer ? (
                <div className="relative">
                  <PieceCell peca={slots.top} />
                  <div className="absolute -bottom-2 -right-2 w-2/3 opacity-90">
                    <PieceCell peca={slots.outer} />
                  </div>
                </div>
              ) : (
                <PieceCell peca={slots.top} />
              )}
            </div>
          </>
        )}

        {/* Right column top: accessory or jewelry */}
        <div style={{ gridRow: '1', gridColumn: '2' }}>
          <PieceCell peca={slots.jewelry || slots.accessory} />
        </div>

        {/* Row 2: Bottom (if not dress) + Bag */}
        {!hasDress && (
          <div style={{ gridRow: '2', gridColumn: '1' }}>
            <PieceCell peca={slots.bottom} />
          </div>
        )}

        <div
          style={{
            gridRow: hasDress ? '2' : '2',
            gridColumn: '2',
          }}
        >
          <PieceCell peca={slots.bag} />
        </div>

        {/* Row 3: Shoes */}
        <div style={{ gridRow: '3', gridColumn: '1' }}>
          <PieceCell peca={slots.shoes} />
        </div>

        {/* Extra accessory if both jewelry and accessory exist */}
        {slots.jewelry && slots.accessory && (
          <div style={{ gridRow: '3', gridColumn: '2' }}>
            <PieceCell peca={slots.accessory} />
          </div>
        )}
      </div>
    </div>
  );
}
