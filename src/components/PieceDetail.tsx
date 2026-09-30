'use client';

import { useState, useCallback } from 'react';
import {
  X,
  Thermometer,
  CalendarDays,
  AlertCircle,
  Ruler,
  Tag,
  Palette,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Edit3,
  Save,
  Loader2,
} from 'lucide-react';
import {
  CATEGORIAS,
  FORMALIDADE_LABELS,
  PROTAGONISMO_LABELS,
  TEMPORADAS,
  OCASIOES,
  COMO_ME_QUEDA,
} from '@/lib/constants';
import { createClient } from '@/lib/supabase-client';
import type { Categoria, Ocasiao } from '@/types/database';
import { resolverDuvidas, type TemaDuvida } from '@/lib/duvidas';

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
  como_me_queda: string | null;
  notas: string | null;
  vezes_usada: number;
  ultima_utilizacao: string | null;
  disponivel: boolean;
  created_at: string;
}

const ESTADOS_PECA = [
  { value: 'disponivel', label: 'Disponível' },
  { value: 'lavando', label: 'Lavando' },
  { value: 'emprestada', label: 'Emprestada' },
  { value: 'guardada', label: 'Guardada (fora de temporada)' },
  { value: 'conserto', label: 'Em conserto' },
  { value: 'doar', label: 'Para doar' },
] as const;

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

function StatBadgeEditable({
  value,
  max = 5,
  onChange,
}: {
  value: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i + 1)}
          className={`w-4 h-4 rounded-full transition-colors ${
            i < value ? 'bg-primary' : 'bg-border hover:bg-primary/40'
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
  onUpdate,
}: {
  peca: PieceData;
  onClose: () => void;
  onUpdate?: (updated: PieceData) => void;
}) {
  const [showMore, setShowMore] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({ ...peca });

  const categoriaLabel =
    CATEGORIAS[peca.categoria as Categoria] || peca.categoria;
  const formalidadeLabel = FORMALIDADE_LABELS[editData.formalidade] || `${editData.formalidade}/5`;
  const protagonismoLabel = PROTAGONISMO_LABELS[editData.protagonismo] || `${editData.protagonismo}/5`;

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

  const currentEstado = ESTADOS_PECA.find(e => e.value === editData.estado)
    || (editData.disponivel ? ESTADOS_PECA[0] : { value: editData.estado, label: editData.estado });

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const disponivel = editData.estado === 'disponivel' || editData.disponivel;
      // Pontos a confirmar resolvidos nesta edição saem (tamanho informado, material ou cor corrigidos).
      const resolvidos = new Set<TemaDuvida>();
      if (editData.tamanho?.trim() && editData.tamanho !== peca.tamanho) resolvidos.add('tamanho');
      if (editData.material?.trim() && editData.material !== peca.material) resolvidos.add('material');
      if (editData.cor?.trim() && editData.cor !== peca.cor) resolvidos.add('cor');
      const duvidas = resolverDuvidas(peca.duvidas, resolvidos);

      const { error } = await supabase
        .from('pecas')
        .update({
          nome: editData.nome,
          categoria: editData.categoria,
          subcategoria: editData.subcategoria,
          cor: editData.cor,
          hex: editData.hex,
          formalidade: editData.formalidade,
          protagonismo: editData.protagonismo,
          temporadas: editData.temporadas,
          temperatura_min: editData.temperatura_min,
          temperatura_max: editData.temperatura_max,
          ocasioes: editData.ocasioes,
          estilos: editData.estilos,
          estado: editData.estado,
          comprimento: editData.comprimento,
          material: editData.material,
          marca: editData.marca,
          tamanho: editData.tamanho,
          como_me_queda: editData.como_me_queda,
          notas: editData.notas,
          disponivel: editData.estado === 'disponivel',
          duvidas,
          revisar: !!duvidas,
        })
        .eq('id', peca.id);

      if (error) {
        console.error('Error updating piece:', error);
        return;
      }

      setIsEditing(false);
      if (onUpdate) {
        onUpdate({ ...editData, duvidas, revisar: !!duvidas, disponivel: editData.estado === 'disponivel' });
      }
    } finally {
      setSaving(false);
    }
  }, [editData, peca.id, peca.tamanho, peca.material, peca.cor, peca.duvidas, onUpdate]);

  const toggleOcasiao = (key: string) => {
    setEditData(prev => ({
      ...prev,
      ocasioes: prev.ocasioes.includes(key)
        ? prev.ocasioes.filter(o => o !== key)
        : [...prev.ocasioes, key],
    }));
  };

  const toggleTemporada = (key: string) => {
    setEditData(prev => ({
      ...prev,
      temporadas: prev.temporadas.includes(key)
        ? prev.temporadas.filter(t => t !== key)
        : [...prev.temporadas, key],
    }));
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/40"
      onClick={onClose}
    >
      <div
        className="sheet absolute inset-x-0 bottom-0 max-w-lg mx-auto max-h-[92dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-sand" />
        </div>

        <div className="sticky top-0 bg-surface border-b border-border px-4 py-3 flex items-center justify-between z-10">
          <div className="flex-1 min-w-0 pr-3">
            {isEditing ? (
              <input
                type="text"
                value={editData.nome}
                onChange={(e) => setEditData(prev => ({ ...prev, nome: e.target.value }))}
                className="display text-xl text-foreground bg-transparent border-b border-primary w-full outline-none"
              />
            ) : (
              <h2 className="display text-xl text-foreground truncate">
                {editData.nome}
              </h2>
            )}
            <p className="text-xs text-muted">
              {categoriaLabel} · {editData.subcategoria}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isEditing ? (
              <button
                onClick={handleSave}
                disabled={saving}
                aria-label="Salvar alterações"
                className="w-9 h-9 rounded-[4px] bg-primary flex items-center justify-center transition-colors"
              >
                {saving ? (
                  <Loader2 size={16} className="text-white animate-spin" />
                ) : (
                  <Save size={16} className="text-white" />
                )}
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                aria-label="Editar peça"
                className="w-9 h-9 rounded-[4px] hover:bg-surface-alt flex items-center justify-center transition-colors"
              >
                <Edit3 size={16} className="text-primary" />
              </button>
            )}
            <button
              onClick={() => { setIsEditing(false); setEditData({ ...peca }); onClose(); }}
              className="w-9 h-9 rounded-[4px] hover:bg-surface-alt flex items-center justify-center transition-colors"
            >
              <X size={18} className="text-muted" />
            </button>
          </div>
        </div>

        <div className="px-4 pt-4">
          <div className="rounded-[4px] overflow-hidden aspect-[3/4] bg-surface-alt relative">
            {peca.imagem_url ? (
              <img src={peca.imagem_url} alt={peca.nome} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag size={48} className="text-muted" />
              </div>
            )}
            {editData.hex && (
              <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-surface/90 rounded-[2px] px-3 py-1.5">
                <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: editData.hex }} />
                <span className="text-xs font-medium text-foreground">{editData.cor}</span>
              </div>
            )}
            {editData.estado !== 'disponivel' && (
              <div className="absolute top-3 right-3 bg-surface/90 rounded-[2px] px-3 py-1">
                <span className="text-xs font-medium text-warning">
                  {ESTADOS_PECA.find(e => e.value === editData.estado)?.label || editData.estado}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Estado selector - always visible when editing */}
        {isEditing && (
          <div className="px-4 pt-3">
            <p className="text-xs text-muted mb-2">Estado da peça</p>
            <div className="flex flex-wrap gap-2">
              {ESTADOS_PECA.map((est) => (
                <button
                  key={est.value}
                  type="button"
                  onClick={() => setEditData(prev => ({ ...prev, estado: est.value, disponivel: est.value === 'disponivel' }))}
                  className={`px-3 py-1.5 rounded-[2px] text-xs font-medium transition-colors border ${
                    editData.estado === est.value
                      ? 'bg-primary text-background border-primary'
                      : 'bg-surface text-foreground border-border'
                  }`}
                >
                  {est.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 pt-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-[4px] bg-surface-alt p-3 text-center">
              <p className="display text-3xl text-foreground">{peca.vezes_usada}</p>
              <p className="text-[10px] text-muted mt-0.5">vezes usada</p>
            </div>
            <div className="rounded-[4px] bg-surface-alt p-3 text-center">
              {isEditing ? (
                <>
                  <StatBadgeEditable value={editData.formalidade} onChange={(v) => setEditData(prev => ({ ...prev, formalidade: v }))} />
                  <p className="text-[10px] text-muted mt-1">formalidade</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-foreground mt-1">{formalidadeLabel}</p>
                  <StatBadge value={editData.formalidade} />
                  <p className="text-[10px] text-muted mt-1">formalidade</p>
                </>
              )}
            </div>
            <div className="rounded-[4px] bg-surface-alt p-3 text-center">
              {isEditing ? (
                <>
                  <StatBadgeEditable value={editData.protagonismo} onChange={(v) => setEditData(prev => ({ ...prev, protagonismo: v }))} />
                  <p className="text-[10px] text-muted mt-1">protagonismo</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-foreground mt-1">{protagonismoLabel}</p>
                  <StatBadge value={editData.protagonismo} />
                  <p className="text-[10px] text-muted mt-1">protagonismo</p>
                </>
              )}
            </div>
          </div>
        </div>

        {peca.duvidas && (
          <div className="mx-4 mt-3 border-l-2 border-warning bg-surface-alt p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={14} className="text-warning" />
              <p className="eyebrow text-warning">Pontos a confirmar</p>
            </div>
            <p className="text-sm text-foreground">{peca.duvidas}</p>
          </div>
        )}

        <div className="px-4 pt-3 divide-y divide-border">
          <InfoRow icon={Thermometer} label="Temperatura confortável">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={editData.temperatura_min}
                  onChange={(e) => setEditData(prev => ({ ...prev, temperatura_min: Number(e.target.value) }))}
                  className="w-16 px-2 py-1 text-sm rounded-[2px] border border-border bg-surface text-foreground"
                />
                <span>–</span>
                <input
                  type="number"
                  value={editData.temperatura_max}
                  onChange={(e) => setEditData(prev => ({ ...prev, temperatura_max: Number(e.target.value) }))}
                  className="w-16 px-2 py-1 text-sm rounded-[2px] border border-border bg-surface text-foreground"
                />
                <span className="text-xs text-muted">°C</span>
              </div>
            ) : (
              <>{editData.temperatura_min}°C – {editData.temperatura_max}°C</>
            )}
          </InfoRow>

          <InfoRow icon={CalendarDays} label="Ocasiões">
            {isEditing ? (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {Object.entries(OCASIOES).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleOcasiao(key)}
                    className={`px-2 py-0.5 rounded-[2px] text-xs transition-colors ${
                      editData.ocasioes.includes(key)
                        ? 'bg-primary text-background border border-primary font-medium'
                        : 'bg-surface text-foreground border border-border'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : editData.ocasioes?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {editData.ocasioes.map((o, i) => (
                  <span key={i} className="chip">{OCASIOES[o as Ocasiao] || o}</span>
                ))}
              </div>
            ) : (
              <span className="text-muted text-xs">Nenhuma</span>
            )}
          </InfoRow>

          {(editData.estilos?.length > 0 || isEditing) && (
            <InfoRow icon={Palette} label="Estilos">
              {isEditing ? (
                <input
                  type="text"
                  value={editData.estilos?.join(', ') || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, estilos: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                  placeholder="casual, elegante, moderno..."
                  className="w-full px-2 py-1 text-sm rounded-[2px] border border-border bg-surface text-foreground"
                />
              ) : (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {editData.estilos.map((e, i) => (
                    <span key={i} className="chip">{e}</span>
                  ))}
                </div>
              )}
            </InfoRow>
          )}

          <InfoRow icon={Tag} label="Temporadas">
            {isEditing ? (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {Object.entries(TEMPORADAS).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleTemporada(key)}
                    className={`px-2 py-0.5 rounded-[2px] text-xs transition-colors ${
                      editData.temporadas.includes(key)
                        ? 'bg-primary text-background border border-primary font-medium'
                        : 'bg-surface text-foreground border border-border'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <>{editData.temporadas.map((t) => TEMPORADAS[t as keyof typeof TEMPORADAS] || t).join(', ')}</>
            )}
          </InfoRow>

          <InfoRow icon={Ruler} label="Como veste">
            {isEditing ? (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {Object.entries(COMO_ME_QUEDA).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setEditData(prev => ({ ...prev, como_me_queda: prev.como_me_queda === key ? null : key }))}
                    className={`px-2 py-0.5 rounded-[2px] text-xs transition-colors ${
                      editData.como_me_queda === key
                        ? 'bg-primary text-background border border-primary font-medium'
                        : 'bg-surface text-foreground border border-border'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <>{editData.como_me_queda ? COMO_ME_QUEDA[editData.como_me_queda as keyof typeof COMO_ME_QUEDA] || editData.como_me_queda : 'Não informado'}</>
            )}
          </InfoRow>

          {(editData.material || isEditing) && (
            <InfoRow icon={Ruler} label="Material">
              {isEditing ? (
                <input
                  type="text"
                  value={editData.material || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, material: e.target.value || null }))}
                  className="w-full px-2 py-1 text-sm rounded-[2px] border border-border bg-surface text-foreground"
                />
              ) : (
                <>{editData.material}</>
              )}
            </InfoRow>
          )}
          {(editData.comprimento || isEditing) && (
            <InfoRow icon={Ruler} label="Comprimento">
              {isEditing ? (
                <input
                  type="text"
                  value={editData.comprimento || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, comprimento: e.target.value || null }))}
                  className="w-full px-2 py-1 text-sm rounded-[2px] border border-border bg-surface text-foreground"
                />
              ) : (
                <>{editData.comprimento}</>
              )}
            </InfoRow>
          )}
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={() => setShowMore(!showMore)}
            className="w-full flex items-center justify-center gap-1 py-3 text-xs text-muted hover:text-foreground transition-colors"
          >
            {showMore ? 'Menos detalhes' : 'Mais detalhes'}
            {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showMore && (
            <div className="space-y-2">
              <div className="rounded-[4px] bg-surface-alt p-3">
                <p className="text-xs text-muted mb-0.5">Marca</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.marca || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, marca: e.target.value || null }))}
                    className="w-full px-2 py-1 text-sm rounded-[2px] border border-border bg-surface text-foreground"
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground">{editData.marca || '—'}</p>
                )}
              </div>
              <div className="rounded-[4px] bg-surface-alt p-3">
                <p className="text-xs text-muted mb-0.5">Tamanho</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.tamanho || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, tamanho: e.target.value || null }))}
                    className="w-full px-2 py-1 text-sm rounded-[2px] border border-border bg-surface text-foreground"
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground">{editData.tamanho || '—'}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-[4px] bg-surface-alt p-3">
                  <p className="text-xs text-muted mb-0.5">Estado</p>
                  <p className="text-sm font-medium text-foreground">
                    {ESTADOS_PECA.find(e => e.value === editData.estado)?.label || editData.estado}
                  </p>
                </div>
                <div className="rounded-[4px] bg-surface-alt p-3">
                  <p className="text-xs text-muted mb-0.5">Hex</p>
                  <div className="flex items-center gap-1.5">
                    {editData.hex && <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: editData.hex }} />}
                    <p className="text-sm font-mono text-foreground">{editData.hex || '—'}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-[4px] bg-surface-alt p-3">
                  <p className="text-xs text-muted mb-0.5">Adicionada</p>
                  <p className="text-sm text-foreground">{addedDate}</p>
                </div>
                <div className="rounded-[4px] bg-surface-alt p-3">
                  <p className="text-xs text-muted mb-0.5">Último uso</p>
                  <p className="text-sm text-foreground">{lastUsed || 'Nunca'}</p>
                </div>
              </div>
              <div className="rounded-[4px] bg-surface-alt p-3">
                <p className="text-xs text-muted mb-0.5">Notas</p>
                {isEditing ? (
                  <textarea
                    value={editData.notas || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, notas: e.target.value || null }))}
                    rows={3}
                    className="w-full px-2 py-1 text-sm rounded-[2px] border border-border bg-surface text-foreground resize-none"
                  />
                ) : (
                  <p className="text-sm text-foreground">{editData.notas || '—'}</p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="h-6" />
      </div>
    </div>
  );
}
