'use client';

import { useState } from 'react';
import {
  X,
  Thermometer,
  CalendarDays,
  AlertCircle,
  Hash,
  Ruler,
  Tag,
  Sparkles,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  CATEGORIAS,
  FORMALIDADE_LABELS,
  PROTAGONISMO_LABELS,
  TEMPORADAS,
} from '@/lib/constants';
import type { Categoria } from '@/types/database';

interface PieceData {
  id: string;
  nome: string;
  categoria: string;
  subcategoria: string;
  cor: string;
  hex: string | null;
  formalidade: number;
  protagonismo: number;
  temporadas: string[];
  temperatura_min: number;
  temperatura_max: number;
  ocasioes: string[];
  estilos: string[];
  estado: string;
  comprimento: string | null;
  material: string | null;
  marca: string | null;
  tamanho: string | null;
  imagem_url: string;
  ficha_ia: string | null;
  duvidas: string | null;
  revisar: boolean;
  notas: string | null;
  vezes_usada: number;
  ultima_utilizacao: string | null;
  disponivel: boolean;
  created_at: string;
}

function StatBadge({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i < value ? 'bg-primary' : 'bg-border'
          }`}
        />
      ))}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon size={16} className="text-muted mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted mb-0.5">{label}</p>
        <div className="text-sm text-foreground">{children}</div>
      </div>
    </div>
  );
}

export function PieceDetail({
  peca,
  onClose,
}: {
  peca: PieceData;
  onClose: () => void;
}) {
  const [showMore, setShowMore] = useState(false);

  const categoriaLabel =
    CATEGORIAS[peca.categoria as Categoria] || peca.categoria;
  const formalidadeLabel = FORMALIDADE_LABELS[peca.formalidade] || `${peca.formalidade}/5`;
  const protagonismoLabel = PROTAGONISMO_LABELS[peca.protagonismo] || `${peca.protagonismo}/5`;

  const addedDate = new Date(peca.created_at).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const lastUsed = peca.ultima_utilizacao
    ? new Date(peca.ultima_utilizacao).toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'short',
      })
    : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="absolute inset-x-0 bottom-0 bg-surface rounded-t-3xl border border-border border-b-0 max-h-[92dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="sticky top-0 bg-surface/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between z-10">
          <div className="flex-1 min-w-0 pr-3">
            <h2 className="text-lg font-semibold text-foreground truncate">
              {peca.nome}
            </h2>
            <p className="text-xs text-muted">
              {categoriaLabel} · {peca.subcategoria}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-surface-alt flex items-center justify-center transition-colors flex-shrink-0"
          >
            <X size={18} className="text-muted" />
          </button>
        </div>

        {/* Image */}
        <div className="px-4 pt-4">
          <div className="rounded-2xl overflow-hidden aspect-[3/4] bg-surface-alt relative">
            {peca.imagem_url ? (
              <img
                src={peca.imagem_url}
                alt={peca.nome}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag size={48} className="text-muted" />
              </div>
            )}
            {/* Color swatch overlay */}
            {peca.hex && (
              <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-surface/90 backdrop-blur-sm rounded-full px-3 py-1.5">
                <div
                  className="w-4 h-4 rounded-full border border-border"
                  style={{ backgroundColor: peca.hex }}
                />
                <span className="text-xs font-medium text-foreground">
                  {peca.cor}
                </span>
              </div>
            )}
            {/* Status badge */}
            {!peca.disponivel && (
              <div className="absolute top-3 right-3 bg-warning/20 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="text-xs font-medium text-warning">
                  Indisponível
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="px-4 pt-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-surface-alt p-3 text-center">
              <p className="text-2xl font-semibold text-foreground">
                {peca.vezes_usada}
              </p>
              <p className="text-[10px] text-muted mt-0.5">vezes usada</p>
            </div>
            <div className="rounded-xl bg-surface-alt p-3 text-center">
              <p className="text-sm font-medium text-foreground mt-1">
                {formalidadeLabel}
              </p>
              <StatBadge value={peca.formalidade} />
              <p className="text-[10px] text-muted mt-1">formalidade</p>
            </div>
            <div className="rounded-xl bg-surface-alt p-3 text-center">
              <p className="text-sm font-medium text-foreground mt-1">
                {protagonismoLabel}
              </p>
              <StatBadge value={peca.protagonismo} />
              <p className="text-[10px] text-muted mt-1">protagonismo</p>
            </div>
          </div>
        </div>

        {/* Doubts banner */}
        {peca.duvidas && (
          <div className="mx-4 mt-3 rounded-xl bg-warning/10 border border-warning/20 p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={14} className="text-warning" />
              <p className="text-xs text-warning font-medium">
                Dúvidas da IA
              </p>
            </div>
            <p className="text-sm text-foreground">{peca.duvidas}</p>
          </div>
        )}

        {/* Details */}
        <div className="px-4 pt-3 divide-y divide-border">
          <InfoRow icon={Thermometer} label="Temperatura confortável">
            {peca.temperatura_min}°C – {peca.temperatura_max}°C
          </InfoRow>

          {peca.ocasioes?.length > 0 && (
            <InfoRow icon={CalendarDays} label="Ocasiões">
              <div className="flex flex-wrap gap-1.5 mt-1">
                {peca.ocasioes.map((o, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full bg-primary/10 text-xs text-primary"
                  >
                    {o}
                  </span>
                ))}
              </div>
            </InfoRow>
          )}

          {peca.estilos?.length > 0 && (
            <InfoRow icon={Sparkles} label="Estilos">
              <div className="flex flex-wrap gap-1.5 mt-1">
                {peca.estilos.map((e, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full bg-surface-alt text-xs text-muted border border-border"
                  >
                    {e}
                  </span>
                ))}
              </div>
            </InfoRow>
          )}

          {peca.temporadas?.length > 0 && (
            <InfoRow icon={Tag} label="Temporadas">
              {peca.temporadas
                .map(
                  (t) =>
                    TEMPORADAS[t as keyof typeof TEMPORADAS] || t
                )
                .join(', ')}
            </InfoRow>
          )}

          {peca.material && (
            <InfoRow icon={Ruler} label="Material">
              {peca.material}
            </InfoRow>
          )}

          {peca.comprimento && (
            <InfoRow icon={Ruler} label="Comprimento">
              {peca.comprimento}
            </InfoRow>
          )}
        </div>

        {/* Expandable: more details */}
        <div className="px-4 pb-4">
          <button
            onClick={() => setShowMore(!showMore)}
            className="w-full flex items-center justify-center gap-1 py-3 text-xs text-muted hover:text-foreground transition-colors"
          >
            {showMore ? 'Menos detalhes' : 'Mais detalhes'}
            {showMore ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </button>

          {showMore && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              {peca.marca && (
                <div className="rounded-xl bg-surface-alt p-3">
                  <p className="text-xs text-muted mb-0.5">Marca</p>
                  <p className="text-sm font-medium text-foreground">
                    {peca.marca}
                  </p>
                </div>
              )}
              {peca.tamanho && (
                <div className="rounded-xl bg-surface-alt p-3">
                  <p className="text-xs text-muted mb-0.5">Tamanho</p>
                  <p className="text-sm font-medium text-foreground">
                    {peca.tamanho}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-surface-alt p-3">
                  <p className="text-xs text-muted mb-0.5">Estado</p>
                  <p className="text-sm font-medium text-foreground">
                    {peca.estado}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-alt p-3">
                  <p className="text-xs text-muted mb-0.5">Hex</p>
                  <div className="flex items-center gap-1.5">
                    {peca.hex && (
                      <div
                        className="w-3 h-3 rounded-full border border-border"
                        style={{ backgroundColor: peca.hex }}
                      />
                    )}
                    <p className="text-sm font-mono text-foreground">
                      {peca.hex || '—'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-surface-alt p-3">
                  <p className="text-xs text-muted mb-0.5">Adicionada</p>
                  <p className="text-sm text-foreground">{addedDate}</p>
                </div>
                <div className="rounded-xl bg-surface-alt p-3">
                  <p className="text-xs text-muted mb-0.5">Último uso</p>
                  <p className="text-sm text-foreground">
                    {lastUsed || 'Nunca'}
                  </p>
                </div>
              </div>
              {peca.notas && (
                <div className="rounded-xl bg-surface-alt p-3">
                  <p className="text-xs text-muted mb-0.5">Notas</p>
                  <p className="text-sm text-foreground">{peca.notas}</p>
                </div>
              )}
              {peca.ficha_ia && (
                <div className="rounded-xl bg-surface-alt p-3">
                  <p className="text-xs text-muted mb-0.5">Ficha IA</p>
                  <p className="text-sm text-foreground">{peca.ficha_ia}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom safe area spacer */}
        <div className="h-6" />
      </div>
    </div>
  );
}
