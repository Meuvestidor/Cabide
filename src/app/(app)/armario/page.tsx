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
} from 'lucide-react';
import { CATEGORIAS } from '@/lib/constants';
import { PieceDetail } from '@/components/PieceDetail';
import type { Categoria } from '@/types/database';

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
  duvidas: string | null;
}

// ==================================
// PIECE CARD (tappable)
// ==================================
function PieceCard({
  peca,
  onTap,
}: {
  peca: PecaRow;
  onTap: () => void;
}) {
  return (
    <button
      onClick={onTap}
      className="rounded-2xl bg-surface border border-border overflow-hidden text-left w-full transition-transform active:scale-[0.97]"
    >
      <div className="aspect-square bg-surface-alt relative">
        {peca.imagem_url ? (
          <img
            src={peca.imagem_url}
            alt={peca.nome}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Shirt size={32} className="text-muted" />
          </div>
        )}
        {peca.duvidas && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-warning/20 flex items-center justify-center">
            <AlertCircle size={14} className="text-warning" />
          </div>
        )}
        {peca.hex && (
          <div
            className="absolute bottom-2 left-2 w-5 h-5 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: peca.hex }}
          />
        )}
        {!peca.disponivel && (
          <div className="absolute inset-0 bg-background/40 flex items-center justify-center">
            <span className="text-[10px] font-medium text-foreground bg-surface/90 px-2 py-0.5 rounded-full">
              Indisponível
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-foreground truncate">
          {peca.nome}
        </p>
        <p className="text-xs text-muted mt-0.5">
          {CATEGORIAS[peca.categoria as Categoria] || peca.categoria}
        </p>
      </div>
    </button>
  );
}

// ==================================
// CATALOG REVIEW SHEET
// ==================================
function CatalogReview({
  data,
  imagePreview,
  onConfirm,
  onCancel,
  saving,
}: {
  data: CatalogResult;
  imagePreview: string;
  onConfirm: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end justify-center">
      <div className="bg-surface w-full max-w-lg rounded-t-3xl border border-border border-b-0 max-h-[85dvh] overflow-y-auto">
        <div className="sticky top-0 bg-surface border-b border-border px-4 py-3 flex items-center justify-between rounded-t-3xl">
          <button
            onClick={onCancel}
            className="w-10 h-10 rounded-full hover:bg-surface-alt flex items-center justify-center transition-colors"
          >
            <X size={20} className="text-muted" />
          </button>
          <h2 className="text-base font-semibold text-foreground">
            Ficha da peça
          </h2>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={18} className="text-white animate-spin" />
            ) : (
              <Check size={18} className="text-white" />
            )}
          </button>
        </div>

        <div className="px-4 pt-4">
          <div className="rounded-2xl overflow-hidden aspect-square bg-surface-alt">
            <img
              src={imagePreview}
              alt="Peça"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="px-4 py-4 space-y-3">
          <div className="rounded-xl bg-surface-alt p-3">
            <p className="text-xs text-muted mb-1">Nome</p>
            <p className="text-sm font-medium text-foreground">{data.nome}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface-alt p-3">
              <p className="text-xs text-muted mb-1">Categoria</p>
              <p className="text-sm font-medium text-foreground">
                {CATEGORIAS[data.categoria as Categoria] || data.categoria}
              </p>
            </div>
            <div className="rounded-xl bg-surface-alt p-3">
              <p className="text-xs text-muted mb-1">Subcategoria</p>
              <p className="text-sm font-medium text-foreground">
                {data.subcategoria}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface-alt p-3">
              <p className="text-xs text-muted mb-1">Cor</p>
              <div className="flex items-center gap-2">
                {data.hex && (
                  <div
                    className="w-4 h-4 rounded-full border border-border"
                    style={{ backgroundColor: data.hex }}
                  />
                )}
                <p className="text-sm font-medium text-foreground">{data.cor}</p>
              </div>
            </div>
            <div className="rounded-xl bg-surface-alt p-3">
              <p className="text-xs text-muted mb-1">Formalidade</p>
              <p className="text-sm font-medium text-foreground">
                {data.formalidade}/5
              </p>
            </div>
          </div>

          {data.ocasioes?.length > 0 && (
            <div className="rounded-xl bg-surface-alt p-3">
              <p className="text-xs text-muted mb-2">Ocasiões</p>
              <div className="flex flex-wrap gap-1.5">
                {data.ocasioes.map((o, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full bg-primary/10 text-xs text-primary font-medium"
                  >
                    {o}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.duvidas && (
            <div className="rounded-xl bg-warning/10 border border-warning/20 p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle size={14} className="text-warning" />
                <p className="text-xs text-warning font-medium">Dúvidas da IA</p>
              </div>
              <p className="text-sm text-foreground">{data.duvidas}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================================
// MAIN PAGE
// ==================================
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load pieces
  const loadPecas = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from('pecas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (filtroCategoria !== 'todas') {
      query = query.eq('categoria', filtroCategoria);
    }

    const { data } = await query;
    setPecas((data as PecaRow[]) || []);
    setLoading(false);
  }, [filtroCategoria]);

  useEffect(() => {
    loadPecas();
  }, [loadPecas]);

  // Handle file selection
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    setAnalyzing(true);

    const base64Reader = new FileReader();
    base64Reader.onloadend = async () => {
      const base64 = (base64Reader.result as string).split(',')[1];
      try {
        const res = await fetch('/api/catalog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            mediaType: file.type || 'image/jpeg',
          }),
        });
        const result = await res.json();
        if (result.error) {
          setError(result.error);
          setAnalyzing(false);
          return;
        }
        setCatalogResult(result.data);
      } catch {
        setError('Erro ao analisar a peça. Tente novamente.');
      }
      setAnalyzing(false);
    };
    base64Reader.readAsDataURL(file);
    e.target.value = '';
  }

  // Save piece to Supabase
  async function handleConfirmSave() {
    if (!catalogResult || !imageFile) return;
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      return;
    }

    const fileExt = imageFile.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('pecas')
      .upload(fileName, imageFile, {
        contentType: imageFile.type || 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      setError('Erro ao salvar a foto. Tente novamente.');
      setSaving(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('pecas').getPublicUrl(fileName);

    const { error: insertError } = await supabase.from('pecas').insert({
      user_id: user.id,
      nome: catalogResult.nome,
      categoria: catalogResult.categoria,
      subcategoria: catalogResult.subcategoria,
      cor: catalogResult.cor,
      hex: catalogResult.hex,
      formalidade: catalogResult.formalidade,
      protagonismo: catalogResult.protagonismo,
      temporadas: catalogResult.temporadas,
      temperatura_min: catalogResult.temperatura_min,
      temperatura_max: catalogResult.temperatura_max,
      ocasioes: catalogResult.ocasioes,
      estilos: catalogResult.estilos,
      estado: catalogResult.estado,
      comprimento: catalogResult.comprimento,
      material: catalogResult.material,
      marca: catalogResult.marca,
      imagem_url: publicUrl,
      ficha_ia: JSON.stringify(catalogResult),
      duvidas: catalogResult.duvidas,
      revisar: !!catalogResult.duvidas,
    });

    if (insertError) {
      setError('Erro ao salvar a peça. Tente novamente.');
      setSaving(false);
      return;
    }

    setCatalogResult(null);
    setImagePreview('');
    setImageFile(null);
    setSaving(false);
    loadPecas();
  }

  function handleCancelCatalog() {
    setCatalogResult(null);
    setImagePreview('');
    setImageFile(null);
    setError(null);
  }

  const contagem = pecas.length;

  return (
    <div className="pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl text-foreground">Meu Armário</h1>
          <p className="text-muted text-sm mt-1">
            {contagem} {contagem === 1 ? 'peça' : 'peças'}
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={analyzing}
          className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-hover transition-colors disabled:opacity-50 shadow-lg"
        >
          <Plus size={20} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide mb-4">
        <button
          onClick={() => setFiltroCategoria('todas')}
          className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            filtroCategoria === 'todas'
              ? 'bg-primary text-white'
              : 'bg-surface border border-border text-foreground hover:bg-surface-alt'
          }`}
        >
          Todas
        </button>
        {Object.entries(CATEGORIAS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFiltroCategoria(key)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filtroCategoria === key
                ? 'bg-primary text-white'
                : 'bg-surface border border-border text-foreground hover:bg-surface-alt'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/20 flex items-center gap-2">
          <AlertCircle size={16} className="text-danger flex-shrink-0" />
          <p className="text-sm text-danger">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-danger">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Analyzing overlay */}
      {analyzing && (
        <div className="mb-4 p-4 rounded-2xl bg-surface border border-border flex flex-col items-center gap-3">
          {imagePreview && (
            <div className="w-24 h-24 rounded-xl overflow-hidden">
              <img
                src={imagePreview}
                alt="Analisando"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin text-primary" />
            <p className="text-sm text-muted">Analisando sua peça com IA...</p>
          </div>
        </div>
      )}

      {/* Pieces grid */}
      {loading ? (
        <div className="flex items-center justify-center pt-12">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : pecas.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Camera size={32} className="text-primary" />
          </div>
          <div>
            <p className="text-foreground font-semibold text-lg mb-1">
              Armário vazio
            </p>
            <p className="text-muted text-sm max-w-xs">
              Toque no botão + para fotografar sua primeira peça. A IA vai
              catalogar automaticamente.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {pecas.map((peca) => (
            <PieceCard
              key={peca.id}
              peca={peca}
              onTap={() => setSelectedPeca(peca)}
            />
          ))}
        </div>
      )}

      {/* Catalog review sheet */}
      {catalogResult && imagePreview && (
        <CatalogReview
          data={catalogResult}
          imagePreview={imagePreview}
          onConfirm={handleConfirmSave}
          onCancel={handleCancelCatalog}
          saving={saving}
        />
      )}

      {/* Piece detail sheet */}
      {selectedPeca && (
        <PieceDetail
          peca={selectedPeca as any}
          onClose={() => setSelectedPeca(null)}
        />
      )}
    </div>
  );
}
