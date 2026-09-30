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
import { TamanhoPecaPicker } from '@/components/armario/TamanhoPecaPicker';
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

/** Máximo de fotos por operação na galeria. */
const MAX_FOTOS_POR_VEZ = 10;

interface ItemFila {
  id: string;
  original: File;
  file?: File;
  preview?: string;
  status: 'aguardando' | 'analisando' | 'pronta';
  result?: CatalogResult;
}

function lerComoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => (typeof r.result === 'string' ? resolve(r.result) : reject(new Error('leitura')));
    r.onerror = () => reject(new Error('leitura'));
    r.readAsDataURL(file);
  });
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

/** O que a usuária completou/corrigiu na ficha antes de salvar. */
interface AjustesFicha {
  tamanho: string | null;
  campos: Partial<Record<CampoTexto, string>>;
}
type CampoTexto = 'nome' | 'subcategoria' | 'cor' | 'material' | 'marca';

/** Valor que a IA marcou como não identificado ("?") ou deixou vazio. */
const naoIdentificado = (v: string | null | undefined) => !v || v.trim() === '?';

/**
 * Campo de texto da ficha que a usuária pode completar/corrigir.
 * Usa o mesmo tipo de edição (texto livre) que o detalhe da peça já oferece.
 */
function CampoCorrigivel({ label, valor, onChange, sempreCorrigivel = false }: {
  label: string; valor: string | null; onChange: (v: string) => void; sempreCorrigivel?: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(naoIdentificado(valor) ? '' : valor!);
  const vazio = naoIdentificado(valor);
  if (!vazio && !sempreCorrigivel) return <Field label={label}>{valor}</Field>;
  return (
    <Field label={label}>
      {editando ? (
        <div className="flex gap-2 mt-1">
          <input
            autoFocus
            value={texto}
            maxLength={60}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && texto.trim()) { onChange(texto.trim()); setEditando(false); } }}
            aria-label={label}
            className="input flex-1 h-10"
          />
          <button type="button" disabled={!texto.trim()} onClick={() => { onChange(texto.trim()); setEditando(false); }} className="btn btn-outline h-10 min-h-10">OK</button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <span className={vazio ? 'text-muted' : ''}>{vazio ? 'Não identificado' : valor}</span>
          <button type="button" onClick={() => setEditando(true)} className="text-[13px] font-semibold text-primary underline underline-offset-4 decoration-gold whitespace-nowrap">
            {vazio ? `Informar ${label.toLowerCase()}` : 'Corrigir'}
          </button>
        </div>
      )}
    </Field>
  );
}

function CatalogReview({ data, imagePreview, onConfirm, onCancel, saving, posicao }: {
  data: CatalogResult; imagePreview: string; onConfirm: (ajustes: AjustesFicha) => void; onCancel: () => void; saving: boolean;
  /** "Peça 2 de 4" quando há várias fotos na operação. */
  posicao?: { atual: number; total: number };
}) {
  const tamanhoIa = sanitizarTamanho(data.tamanho);
  const [tamanho, setTamanho] = useState<string | null>(tamanhoIa);
  const [tamanhoDefinido, setTamanhoDefinido] = useState(false); // usuária escolheu (inclui "Não informado")
  const [escolhendoTamanho, setEscolhendoTamanho] = useState(false);
  const [campos, setCampos] = useState<AjustesFicha['campos']>({});
  const valor = (c: CampoTexto) => campos[c] ?? (data[c] as string | null);
  const setCampo = (c: CampoTexto) => (v: string) => setCampos((prev) => ({ ...prev, [c]: v }));

  const textoTamanho = tamanho ?? (tamanhoDefinido ? 'Não informado' : 'Tamanho não identificado');

  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end justify-center">
      <div className="sheet w-full max-w-lg max-h-[88dvh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
          <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center" aria-label="Descartar esta peça">
            <X size={20} className="text-muted" />
          </button>
          <div className="text-center">
            <h2 className="display text-xl">Ficha da peça</h2>
            {posicao && posicao.total > 1 && <p className="text-[11px] text-muted">Peça {posicao.atual} de {posicao.total}</p>}
          </div>
          <span className="w-10" />
        </div>
        <div className="px-4 pt-4">
          <div className="overflow-hidden aspect-[3/4] max-h-[42dvh] mx-auto bg-surface-alt rounded-[4px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Peça" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="px-4 py-2">
          <CampoCorrigivel label="Nome" valor={valor('nome')} onChange={setCampo('nome')} />
          <div className="grid grid-cols-2 gap-x-4">
            <Field label="Categoria">{CATEGORIAS[data.categoria as Categoria] || data.categoria}</Field>
            <CampoCorrigivel label="Tipo" valor={valor('subcategoria')} onChange={setCampo('subcategoria')} />
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            {naoIdentificado(valor('cor')) ? (
              <CampoCorrigivel label="Cor" valor={valor('cor')} onChange={setCampo('cor')} />
            ) : (
              <Field label="Cor">
                <span className="inline-flex items-center gap-2">
                  {data.hex && !campos.cor && <span className="w-3.5 h-3.5 rounded-full border border-border" style={{ backgroundColor: data.hex }} />}
                  {valor('cor')}
                </span>
              </Field>
            )}
            <Field label="Formalidade">{FORMALIDADE_LABELS[data.formalidade] || `${data.formalidade}/5`}</Field>
          </div>

          {/* Tamanho DA PEÇA (etiqueta) — a IA só preenche se a etiqueta estiver legível */}
          <Field label="Tamanho">
            <div className="flex items-center justify-between gap-3">
              <span className={tamanho ? 'font-semibold' : 'text-muted'} data-testid="tamanho-peca">{textoTamanho}</span>
              {!escolhendoTamanho && (
                <button type="button" onClick={() => setEscolhendoTamanho(true)} className="text-[13px] font-semibold text-primary underline underline-offset-4 decoration-gold whitespace-nowrap">
                  {tamanho || tamanhoDefinido ? 'Alterar' : 'Informar tamanho'}
                </button>
              )}
            </div>
            {tamanhoIa && tamanho === tamanhoIa && !tamanhoDefinido && <p className="text-[11px] text-muted mt-1">Lido na etiqueta da foto.</p>}
            {escolhendoTamanho && (
              <TamanhoPecaPicker
                categoria={data.categoria}
                valor={tamanho}
                onEscolher={(v) => { setTamanho(v); setTamanhoDefinido(true); setEscolhendoTamanho(false); }}
              />
            )}
          </Field>

          <CampoCorrigivel label="Material" valor={valor('material')} onChange={setCampo('material')} sempreCorrigivel />
          {!naoIdentificado(data.marca) && <Field label="Marca">{data.marca}</Field>}

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
              {!tamanho && !tamanhoDefinido && !escolhendoTamanho && (
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-3">
                  <span className="text-sm"><span className="font-semibold">Tamanho</span> <span className="text-muted">· Não identificado</span></span>
                  <button type="button" onClick={() => setEscolhendoTamanho(true)} className="btn btn-outline h-9 min-h-9 px-3 text-[13px]">
                    Informar tamanho
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="sticky bottom-0 bg-surface border-t border-border p-4 grid grid-cols-2 gap-3">
          <button onClick={onCancel} className="btn btn-outline">Descartar</button>
          <button onClick={() => onConfirm({ tamanho, campos })} disabled={saving} className="btn btn-primary">
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
  // Fila da operação atual: 1 foto (câmera ou galeria) ou até 10 (galeria).
  // Cada foto vira uma peça independente; a análise roda UMA por vez.
  const [fila, setFila] = useState<ItemFila[]>([]);
  const [loteTotal, setLoteTotal] = useState(0);
  const [loteErros, setLoteErros] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ajustesPendentes, setAjustesPendentes] = useState<AjustesFicha | null>(null);
  const processandoRef = useRef(false);
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
    if (fila.length > 0) return; // uma operação por vez
    // No celular: escolher entre câmera e galeria. No computador: seletor de arquivos direto.
    const toque = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
    if (toque) setOrigemAberta(true);
    else galeriaInputRef.current?.click();
  }

  // Item em revisão = o primeiro da fila, quando já analisado.
  const atual = fila[0]?.status === 'pronta' ? fila[0] : null;
  const catalogResult = atual?.result ?? null;
  const imagePreview = atual?.preview ?? '';
  const imageFile = atual?.file ?? null;
  const analyzing = fila.some((i) => i.status === 'aguardando' || i.status === 'analisando');
  const itemAnalisando = fila.find((i) => i.status === 'analisando') ?? fila.find((i) => i.status === 'aguardando');

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const todas = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!todas.length) return;
    setOrigemAberta(false);
    setError(null);
    setAviso(null);
    const imagens = todas.filter((f) => !f.type || f.type.startsWith('image/'));
    if (!imagens.length) {
      setError('Escolha uma foto (JPG, PNG ou similar).');
      return;
    }
    const selecionadas = imagens.slice(0, MAX_FOTOS_POR_VEZ);
    if (imagens.length > MAX_FOTOS_POR_VEZ) setAviso(`Você pode adicionar até ${MAX_FOTOS_POR_VEZ} fotos por vez.`);
    setLoteTotal(selecionadas.length);
    setLoteErros(0);
    setFila(selecionadas.map((original, i) => ({ id: `${Date.now()}-${i}`, original, status: 'aguardando' })));
  }

  // Processamento controlado: uma foto por vez (reduz, lê e envia para a mesma análise de sempre).
  useEffect(() => {
    if (processandoRef.current) return;
    const proximo = fila.find((i) => i.status === 'aguardando');
    if (!proximo) return;
    processandoRef.current = true;
    const atualizar = (patch: Partial<ItemFila>) => setFila((f) => f.map((i) => (i.id === proximo.id ? { ...i, ...patch } : i)));
    atualizar({ status: 'analisando' });
    (async () => {
      try {
        const file = await prepararFoto(proximo.original);
        const dataUrl = await lerComoDataUrl(file);
        atualizar({ file, preview: dataUrl });
        const res = await fetch('/api/catalog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: dataUrl.split(',')[1], mediaType: file.type || 'image/jpeg' }),
        });
        const result = await res.json().catch(() => null);
        if (!res.ok || !result || result.error) throw new Error('catalog');
        atualizar({ status: 'pronta', result: result.data });
      } catch {
        // Foto que não pôde ser lida sai da fila; as demais seguem.
        setFila((f) => f.filter((i) => i.id !== proximo.id));
        setLoteErros((n) => n + 1);
      } finally {
        processandoRef.current = false;
        setFila((f) => [...f]); // reavalia a fila para seguir com a próxima
      }
    })();
  }, [fila]);

  // Fim da operação: avisa se alguma foto não pôde ser lida.
  useEffect(() => {
    if (fila.length === 0 && loteErros > 0) {
      setError(
        loteErros === 1
          ? 'Não conseguimos ler bem uma das fotos. Tente com mais luz ou outro ângulo.'
          : `Não conseguimos ler bem ${loteErros} fotos. Tente com mais luz ou outro ângulo.`
      );
      setLoteErros(0);
    }
  }, [fila.length, loteErros]);

  function proximaPeca() {
    setAjustesPendentes(null);
    setFila((f) => f.slice(1));
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

  function handlePreSave(ajustes: AjustesFicha) {
    if (!catalogResult) return;
    setAjustesPendentes(ajustes);
    const dupe = checkForDuplicate({ ...catalogResult, ...ajustes.campos });
    if (dupe) {
      setDuplicateWarning(dupe);
    } else {
      handleConfirmSave(ajustes);
    }
  }

  async function handleConfirmSave(ajustes: AjustesFicha | null = ajustesPendentes) {
    setDuplicateWarning(null);
    if (!catalogResult || !imageFile) return;
    // Correções da usuária têm prioridade sobre o que a IA leu.
    const ficha = { ...catalogResult, ...(ajustes?.campos ?? {}) };
    const tamanhoFinal = ajustes ? sanitizarTamanho(ajustes.tamanho) : sanitizarTamanho(catalogResult.tamanho);
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
      user_id: user.id, nome: ficha.nome, categoria: ficha.categoria,
      subcategoria: ficha.subcategoria, cor: ficha.cor, hex: ficha.hex,
      formalidade: ficha.formalidade, protagonismo: ficha.protagonismo,
      temporadas: ficha.temporadas, temperatura_min: ficha.temperatura_min,
      temperatura_max: ficha.temperatura_max, ocasioes: ficha.ocasioes,
      estilos: ficha.estilos, estado: ficha.estado,
      comprimento: ficha.comprimento, material: ficha.material,
      marca: ficha.marca, imagem_url: publicUrl,
      tamanho: tamanhoFinal,
      // Merge compatível: preserva a ficha original da IA e só acrescenta atributos válidos
      ficha_ia: mergeFichaIa(null, {
        ...catalogResult,
        estampa: undefined, salto: undefined, caimento: undefined, detalhes: undefined,
        ...sanitizarAtributos(catalogResult as unknown as Record<string, unknown>),
      }),
      duvidas: catalogResult.duvidas,
      revisar: !!catalogResult.duvidas,
    });
    if (iErr) { setError('Não conseguimos salvar a peça agora. Tente novamente.'); setSaving(false); return; }
    setSaving(false);
    proximaPeca();
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
          disabled={fila.length > 0}
          aria-label="Adicionar peça"
          className="w-11 h-11 rounded-[4px] bg-primary text-background flex items-center justify-center hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          <Plus size={20} strokeWidth={1.75} />
        </button>
        {/* Câmera traseira direto (celular) e galeria/arquivos (celular e computador). */}
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
        <input ref={galeriaInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
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
      {aviso && (
        <div role="status" className="mb-4 p-3 border-l-2 border-gold bg-surface flex items-start gap-2">
          <p className="text-sm text-foreground flex-1">{aviso}</p>
          <button onClick={() => setAviso(null)} className="text-muted" aria-label="Fechar"><X size={16} /></button>
        </div>
      )}
      {fila.length > 0 && (analyzing || !atual) && (
        <div className="mb-6 flex items-center gap-4 py-3 border-y border-border" aria-live="polite">
          {itemAnalisando?.preview && (
            <div className="w-14 h-[74px] overflow-hidden rounded-[2px] flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={itemAnalisando.preview} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {loteTotal > 1 && (
              <p className="eyebrow mb-1">{loteTotal} fotos selecionadas</p>
            )}
            <p className="display italic text-lg">
              {loteTotal > 1 && itemAnalisando
                ? `Lendo a peça ${loteTotal - fila.length + fila.indexOf(itemAnalisando) + 1} de ${loteTotal}…`
                : 'Lendo os detalhes da sua peça…'}
            </p>
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
      {atual && catalogResult && imagePreview && <CatalogReview key={atual.id} data={catalogResult} imagePreview={imagePreview} onConfirm={handlePreSave} onCancel={() => { setError(null); proximaPeca(); }} saving={saving} posicao={{ atual: loteTotal - fila.length + 1, total: loteTotal }} />}
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
              <button onClick={() => handleConfirmSave()} className="btn btn-primary">Adicionar</button>
            </div>
          </div>
        </div>
      )}
      {selectedPeca && <PieceDetail peca={selectedPeca as any} onClose={() => setSelectedPeca(null)} onUpdate={(updated) => { setPecas(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } as PecaRow : p)); setSelectedPeca(null); }} />}
    </div>
  );
}