'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';
import {
  Camera,
  Loader2,
  Plus,
  X,
  Check,
  AlertCircle,
  Shirt,
  Image as ImageIcon,
} from 'lucide-react';
import { CATEGORIAS, FORMALIDADE_LABELS, OCASIOES } from '@/lib/constants';
import { PieceDetail } from '@/components/PieceDetail';
import { CategoriaSelector } from '@/components/armario/CategoriaSelector';
import type { Categoria } from '@/types/database';
import { prepararFoto } from '@/lib/imagem';
import { mergeFichaIa, sanitizarAtributos, sanitizarTamanho } from '@/lib/ficha-ia';

interface PecaRow {
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

interface CatalogResult {
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
  // Atributos estruturados (só com evidência visual) — ver lib/ficha-ia
  estampa?: string | null;
  salto?: string | null;
  caimento?: string | null;
  detalhes?: string[];
  // Tamanho da etiqueta, somente se visível; nunca inferido
  tamanho?: string | null;
  duvidas: string | null;
}

function PieceCard({ peca, looksCount, onTap }: { peca: PecaRow; looksCount: number; onTap: () => void }) {
  return (
    <button onClick={onTap} className="text-left w-full group">
      <div className="aspect-[3/4] bg-surface-alt relative overflow-hidden rounded-[4px]">
        {peca.imagem_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={peca.imagem_url} alt={peca.nome} className="w-full h-full object-cover transition-transform duration-300 group-active:scale-[0.98]" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Shirt size={28} strokeWidth={1.25} className="text-muted" /></div>
        )}
        {peca.duvidas && (
          <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-surface/90 flex items-center justify-center" title="Pontos a confirmar">
            <AlertCircle size={14} className="text-warning" />
          </span>
        )}
        {!peca.disponivel && (
          <span className="absolute bottom-2 left-2 text-[10px] font-semibold tracking-wide uppercase text-foreground bg-surface/90 px-2 py-0.5 rounded-[2px]">Indisponível</span>
        )}
      </div>
      <p className="text-[13px] font-medium text-foreground truncate mt-2">{peca.nome}</p>
      <p className="text-[11px] text-muted mt-0.5">
        {looksCount} {looksCount === 1 ? 'look' : 'looks'}
      </p>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-3 border-b border-border">
      <p className="eyebrow mb-1">{label}</p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

function CatalogReview({ data, imagePreview, onConfirm, onCancel, saving }: {
  data: CatalogResult; imagePreview: string; onConfirm: () => void; onCancel: () => void; saving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end justify-center">
      <div className="sheet w-full max-w-lg max-h-[88dvh] overflow-y-auto">
        <div className="sticky top-0 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
          <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center" aria-label="Cancelar">
            <X size={20} className="text-muted" />
          </button>
          <h2 className="display text-xl">Ficha da peça</h2>
          <span className="w-10" />
        </div>
        <div className="px-4 pt-4">
          <div className="overflow-hidden aspect-[3/4] max-h-[42dvh] mx-auto bg-surface-alt rounded-[4px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Peça" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="px-4 py-2">
          <Field label="Nome"><span className="display text-lg">{data.nome}</span></Field>
          <div className="grid grid-cols-2 gap-x-4">
            <Field label="Categoria">{CATEGORIAS[data.categoria as Categoria] || data.categoria}</Field>
            <Field label="Tipo">{data.subcategoria}</Field>
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <Field label="Cor">
              <span className="inline-flex items-center gap-2">
                {data.hex && <span className="w-3.5 h-3.5 rounded-full border border-border" style={{ backgroundColor: data.hex }} />}
                {data.cor}
              </span>
            </Field>
            <Field label="Formalidade">{FORMALIDADE_LABELS[data.formalidade] || `${data.formalidade}/5`}</Field>
          </div>
          {sanitizarTamanho(data.tamanho) && <Field label="Tamanho (etiqueta)">{sanitizarTamanho(data.tamanho)}</Field>}
          {data.ocasioes?.length > 0 && (
            <Field label="Ocasiões">
              <div className="flex flex-wrap gap-1.5 mt-1">
                {data.ocasioes.map((o, i) => (
                  <span key={i} className="chip">{OCASIOES[o as keyof typeof OCASIOES] || o}</span>
                ))}
              </div>
            </Field>
          )}
          {data.duvidas && (
            <div className="mt-4 p-3 border-l-2 border-warning bg-surface-alt">
              <p className="eyebrow text-warning mb-1">Pontos a confirmar</p>
              <p className="text-sm text-foreground">{data.duvidas}</p>
            </div>
          )}
        </div>
        <div className="sticky bottom-0 bg-surface border-t border-border p-4 grid grid-cols-2 gap-3">
          <button onClick={onCancel} className="btn btn-outline">Descartar</button>
          <button onClick={onConfirm} disabled={saving} className="btn btn-primary">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <><Check size={18} /> Salvar peça</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ArmarioPage() {
  const [pecas, setPecas] = useState<PecaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [analyzing, setAnalyzing] = useState(false);
  const [catalogResult, setCatalogResult] = useState<CatalogResult | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeca, setSelectedPeca] = useState<PecaRow | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<PecaRow | null>(null);
  const [looksPorPeca, setLooksPorPeca] = useState<Record<string, number>>({});
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galeriaInputRef = useRef<HTMLInputElement>(null);
  const [origemAberta, setOrigemAberta] = useState(false);

  // "N looks" por peça: looks salvos distintos (grupo_id + tipo) que incluem a peça
  useEffect(() => {
    async function loadLooksPorPeca() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('looks').select('id, pecas, grupo_id, tipo').eq('user_id', user.id);
      if (!data) return;
      const vistos = new Set<string>();
      const contagem: Record<string, number> = {};
      for (const look of data as { id: string; pecas: string[] | null; grupo_id: string | null; tipo: string }[]) {
        const chave = look.grupo_id ? `${look.grupo_id}:${look.tipo}` : look.id;
        if (vistos.has(chave)) continue;
        vistos.add(chave);
        for (const pid of look.pecas || []) contagem[pid] = (contagem[pid] || 0) + 1;
      }
      setLooksPorPeca(contagem);
    }
    loadLooksPorPeca();
  }, []);

  const loadPecas = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    let query = supabase.from('pecas').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (filtroCategoria !== 'todas') query = query.eq('categoria', filtroCategoria);
    const { data } = await query;
    setPecas((data as PecaRow[]) || []);
    setLoading(false);
  }, [filtroCategoria]);

  useEffect(() => { loadPecas(); }, [loadPecas]);

  function abrirSeletorDeFoto() {
    // No celular: escolher entre câmera e galeria. No computador: seletor de arquivos direto.
    const toque = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
    if (toque) setOrigemAberta(true);
    else galeriaInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const original = e.target.files?.[0];
    e.target.value = '';
    if (!original) return;
    setOrigemAberta(false);
    setError(null);
    if (original.type && !original.type.startsWith('image/')) {
      setError('Escolha uma foto (JPG, PNG ou similar).');
      return;
    }
    setAnalyzing(true);
    const file = await prepararFoto(original);
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    const b64Reader = new FileReader();
    b64Reader.onloadend = async () => {
      const b64 = (b64Reader.result as string).split(',')[1];
      try {
        const res = await fetch('/api/catalog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64: b64, mediaType: file.type || 'image/jpeg' }) });
        const result = await res.json();
        if (!res.ok || result.error) { setError('Não conseguimos ler bem essa foto. Tente com mais luz ou outro ângulo.'); setAnalyzing(false); return; }
        setCatalogResult(result.data);
      } catch { setError('Parece que a conexão caiu. Verifique sua internet e tente de novo.'); }
      setAnalyzing(false);
    };
    b64Reader.readAsDataURL(file);
  }

  function checkForDuplicate(result: CatalogResult): PecaRow | null {
    // Check for similar pieces already in wardrobe
    for (const p of pecas) {
      const sameCat = p.categoria === result.categoria;
      const sameSub = p.subcategoria.toLowerCase() === result.subcategoria.toLowerCase();
      const sameCor = p.cor.toLowerCase() === result.cor.toLowerCase();
      // If same category + subcategory + color, likely duplicate
      if (sameCat && sameSub && sameCor) return p;
      // If same category + very similar name
      if (sameCat && p.nome.toLowerCase().includes(result.nome.toLowerCase().split(' ').slice(0, 2).join(' '))) return p;
    }
    return null;
  }

  function handlePreSave() {
    if (!catalogResult) return;
    const dupe = checkForDuplicate(catalogResult);
    if (dupe) {
      setDuplicateWarning(dupe);
    } else {
      handleConfirmSave();
    }
  }

  async function handleConfirmSave() {
    setDuplicateWarning(null);
    if (!catalogResult || !imageFile) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const ext = imageFile.type === 'image/jpeg' ? 'jpg' : (imageFile.name.split('.').pop() || 'jpg').toLowerCase();
    const fname = `${user.id}/${Date.now()}.${ext}`;
    const { error: uErr } = await supabase.storage.from('pecas').upload(fname, imageFile, { contentType: imageFile.type || 'image/jpeg' });
    if (uErr) { setError('Não conseguimos salvar a foto agora. Tente novamente.'); setSaving(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('pecas').getPublicUrl(fname);
    const { error: iErr } = await supabase.from('pecas').insert({
      user_id: user.id, nome: catalogResult.nome, categoria: catalogResult.categoria,
      subcategoria: catalogResult.subcategoria, cor: catalogResult.cor, hex: catalogResult.hex,
      formalidade: catalogResult.formalidade, protagonismo: catalogResult.protagonismo,
      temporadas: catalogResult.temporadas, temperatura_min: catalogResult.temperatura_min,
      temperatura_max: catalogResult.temperatura_max, ocasioes: catalogResult.ocasioes,
      estilos: catalogResult.estilos, estado: catalogResult.estado,
      comprimento: catalogResult.comprimento, material: catalogResult.material,
      marca: catalogResult.marca, imagem_url: publicUrl,
      tamanho: sanitizarTamanho(catalogResult.tamanho),
      // Merge compatível: preserva a ficha original e só acrescenta atributos válidos
      ficha_ia: mergeFichaIa(null, {
        ...catalogResult,
        estampa: undefined, salto: undefined, caimento: undefined, detalhes: undefined,
        ...sanitizarAtributos(catalogResult as unknown as Record<string, unknown>),
      }),
      duvidas: catalogResult.duvidas,
      revisar: !!catalogResult.duvidas,
    });
    if (iErr) { setError('Não conseguimos salvar a peça agora. Tente novamente.'); setSaving(false); return; }
    setCatalogResult(null); setImagePreview(''); setImageFile(null); setSaving(false);
    loadPecas();
  }

  const contagem = pecas.length;

  return (
    <div className="pt-8 pb-4">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="display text-[2.25rem]">Meu armário</h1>
          <p className="text-[13px] text-muted mt-1">
            Suas peças, do seu jeito. · {contagem} {contagem === 1 ? 'peça' : 'peças'}
          </p>
        </div>
        <button
          onClick={abrirSeletorDeFoto}
          disabled={analyzing}
          aria-label="Adicionar peça"
          className="w-11 h-11 rounded-[4px] bg-primary text-background flex items-center justify-center hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          <Plus size={20} strokeWidth={1.75} />
        </button>
        {/* Câmera traseira direto (celular) e galeria/arquivos (celular e computador). */}
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
        <input ref={galeriaInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      </div>
      <div className="mb-6">
        <CategoriaSelector valor={filtroCategoria} onChange={setFiltroCategoria} categorias={CATEGORIAS} />
      </div>
      {error && (
        <div role="alert" className="mb-5 p-3 border-l-2 border-danger bg-surface flex items-start gap-2">
          <p className="text-sm text-foreground flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-muted" aria-label="Fechar"><X size={16} /></button>
        </div>
      )}
      {analyzing && (
        <div className="mb-6 flex items-center gap-4 py-3 border-y border-border">
          {imagePreview && (
            <div className="w-14 h-[74px] overflow-hidden rounded-[2px] flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <p className="display italic text-lg">Lendo os detalhes da sua peça…</p>
            <div className="loader-line mt-2" />
          </div>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center pt-16"><div className="loader-line" /></div>
      ) : pecas.length === 0 ? (
        <div className="pt-10 text-center max-w-xs mx-auto">
          <Camera size={28} strokeWidth={1.25} className="mx-auto text-gold mb-5" />
          <h2 className="display text-[1.75rem] mb-2">Seu armário começa aqui</h2>
          <p className="text-sm text-muted leading-relaxed mb-6">
            Fotografe sua primeira peça. O Cabidê organiza os detalhes para você.
          </p>
          <button onClick={abrirSeletorDeFoto} className="btn btn-primary w-full">Adicionar peça</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6">
          {pecas.map((peca) => (
            <PieceCard key={peca.id} peca={peca} looksCount={looksPorPeca[peca.id] || 0} onTap={() => setSelectedPeca(peca)} />
          ))}
        </div>
      )}
      {origemAberta && (
        <div className="fixed inset-0 z-[60] bg-foreground/40 flex items-end sm:items-center justify-center" onClick={() => setOrigemAberta(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="origem-titulo" className="sheet sm:rounded-[4px] w-full max-w-md px-5 pt-5 pb-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 id="origem-titulo" className="display text-[1.5rem]">Adicionar peça</h2>
              <button type="button" onClick={() => setOrigemAberta(false)} className="p-1 text-muted" aria-label="Fechar"><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-3">
              <button type="button" onClick={() => cameraInputRef.current?.click()} className="btn btn-primary w-full gap-2">
                <Camera size={18} strokeWidth={1.75} /> Tirar foto
              </button>
              <button type="button" onClick={() => galeriaInputRef.current?.click()} className="btn btn-outline w-full gap-2">
                <ImageIcon size={18} strokeWidth={1.75} /> Escolher da galeria
              </button>
            </div>
          </div>
        </div>
      )}
      {catalogResult && imagePreview && <CatalogReview data={catalogResult} imagePreview={imagePreview} onConfirm={handlePreSave} onCancel={() => { setCatalogResult(null); setImagePreview(''); setImageFile(null); setError(null); }} saving={saving} />}
      {duplicateWarning && (
        <div className="fixed inset-0 z-[60] bg-foreground/40 flex items-center justify-center px-4" onClick={() => setDuplicateWarning(null)}>
          <div className="bg-surface rounded-[4px] p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <p className="eyebrow mb-2">Antes de salvar</p>
            <h3 className="display text-xl mb-4">Peça parecida encontrada</h3>
            <div className="flex items-center gap-3 py-3 border-y border-border mb-4">
              {duplicateWarning.imagem_url && (
                <div className="w-12 h-16 overflow-hidden rounded-[2px] flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={duplicateWarning.imagem_url} alt={duplicateWarning.nome} className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-foreground">{duplicateWarning.nome}</p>
                <p className="text-xs text-muted">{duplicateWarning.cor} · {CATEGORIAS[duplicateWarning.categoria as Categoria] || duplicateWarning.categoria}</p>
              </div>
            </div>
            <p className="text-sm text-muted mb-5">Já existe uma peça parecida no seu armário. Deseja adicionar mesmo assim?</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setDuplicateWarning(null)} className="btn btn-outline">Cancelar</button>
              <button onClick={handleConfirmSave} className="btn btn-primary">Adicionar</button>
            </div>
          </div>
        </div>
      )}
      {selectedPeca && <PieceDetail peca={selectedPeca as any} onClose={() => setSelectedPeca(null)} onUpdate={(updated) => { setPecas(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } as PecaRow : p)); setSelectedPeca(null); }} />}
    </div>
  );
}