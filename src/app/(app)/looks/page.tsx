'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  RefreshCw,
  Shirt,
  Heart,
  Meh,
  Frown,
  SmilePlus,
  Pin,
  Check,
} from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { OCASIOES, FORMALIDADE_LABELS, LOOK_TIPOS } from '@/lib/constants';
import type { Peca, PerfilEstilo, LookTipo } from '@/types/database';
import { WeatherCard } from '@/components/WeatherCard';
import { atributosDaFicha } from '@/lib/ficha-ia';
import { perfilAtivo } from '@/lib/retrato';
import { FlatLayView } from '@/components/FlatLayView';

// ============================================
// Types
// ============================================
interface WeatherData {
  temp: number;
  description: string;
  city_name: string;
  humidity: number | null;
  wind_speedy: string | null;
}

interface GeneratedLook {
  tipo: LookTipo;
  pecas: string[];
  por_que_funciona: string;
  formalidade_resultante: number;
  grupo_id: string;
  ocasiao: string;
  formalidade_alvo: number;
  clima_temp: number | null;
  clima_condicao: string | null;
}

type Step = 'select' | 'generating' | 'results';

type AjusteClima = -1 | 0 | 1;

/** Clima que o servidor considerou para montar os looks. */
interface ClimaUsado {
  resumo: string;
  faixa: string;
  min: number;
  max: number;
  ajuste: AjusteClima;
  fonte: 'previsao' | 'informada';
  cidade: string | null;
}

const AJUSTES_CLIMA: { valor: AjusteClima; label: string }[] = [
  { valor: -1, label: 'Mais frio' },
  { valor: 0, label: 'Como previsto' },
  { valor: 1, label: 'Mais quente' },
];

type ErroLooks = {
  titulo: string;
  texto: string;
  acoes: ('armario' | 'outra_ocasiao' | 'tentar')[];
};

// Nunca mostrar status HTTP, nome de erro ou mensagem técnica para a usuária.
function erroHumano(code: string | undefined, ocasiaoLabel: string | null): ErroLooks {
  if (code === 'POUCAS_PECAS') {
    return {
      titulo: 'Ainda faltam peças para essa combinação',
      texto: ocasiaoLabel
        ? `Ainda faltam peças adequadas para montar um look de ${ocasiaoLabel.toLowerCase()} com o seu perfil. Adicione mais peças ou escolha outra ocasião.`
        : 'Ainda faltam peças adequadas para montar um look com o seu perfil. Adicione mais peças ou escolha outra ocasião.',
      acoes: ['armario', 'outra_ocasiao'],
    };
  }
  if (code === 'CONEXAO') {
    return {
      titulo: 'A conexão caiu',
      texto: 'Verifique sua internet e tente de novo.',
      acoes: ['tentar'],
    };
  }
  return {
    titulo: 'Não conseguimos montar seus looks agora',
    texto: 'Tente novamente em instantes.',
    acoes: ['tentar'],
  };
}

// ============================================
// Sub-components
// ============================================
function OcasiaoSelector({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (o: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {Object.entries(OCASIOES).map(([key, label]) => (
        <button
          key={key}
          type="button"
          aria-pressed={selected === key}
          onClick={() => onSelect(key)}
          className="option text-[13px]"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function FeedbackModal({
  onSubmit,
  onCancel,
}: {
  onSubmit: (comoMeSenti: string, feedback: string) => void;
  onCancel: () => void;
}) {
  const [sentiment, setSentiment] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  const sentiments = [
    { key: 'amei', label: 'Amei', icon: Heart },
    { key: 'gostei', label: 'Gostei', icon: SmilePlus },
    { key: 'ok', label: 'Ok', icon: Meh },
    { key: 'nao_gostei', label: 'Não curti', icon: Frown },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end justify-center" onClick={onCancel}>
      <div className="sheet w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center pb-4">
          <div className="w-10 h-1 rounded-full bg-sand" />
        </div>
        <p className="eyebrow mb-2">Depois de usar</p>
        <h3 className="display text-2xl mb-1">Como você se sentiu?</h3>
        <p className="text-xs text-muted mb-5">Sua resposta ajuda o Cabidê a entender o que funciona para você.</p>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {sentiments.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              aria-pressed={sentiment === key}
              onClick={() => setSentiment(key)}
              className="option flex-col justify-center gap-1.5 py-3 text-center"
            >
              <Icon size={20} strokeWidth={1.5} />
              <span className="text-[11px] font-medium">{label}</span>
            </button>
          ))}
        </div>

        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Algum comentário? (opcional)"
          rows={3}
          className="input py-3 min-h-0 resize-none mb-4"
        />

        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancel} className="btn btn-outline">
            Pular
          </button>
          <button type="button" onClick={() => onSubmit(sentiment || 'ok', feedback)} className="btn btn-primary">
            Salvar
          </button>
        </div>
        <div className="h-4" />
      </div>
    </div>
  );
}

function LookCard({
  look,
  pecasMap,
  onDecision,
  savedDecision,
}: {
  look: GeneratedLook;
  pecasMap: Map<string, Peca>;
  onDecision: (tipo: LookTipo, decisao: string) => void;
  savedDecision: string | null;
}) {
  const info = LOOK_TIPOS[look.tipo];
  const lookPecas = look.pecas.map((id) => pecasMap.get(id)).filter(Boolean) as Peca[];

  const decisoes = [
    { key: 'usei', label: 'Usei' },
    { key: 'nao_usei', label: 'Não usei' },
    { key: 'nao_gostei', label: 'Não gostei' },
  ];

  return (
    <article className="pt-6 border-t border-border">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <p className="eyebrow text-foreground">{info.nome}</p>
        <span className="text-[11px] text-muted">
          {FORMALIDADE_LABELS[look.formalidade_resultante] || ''}
        </span>
      </div>
      <h3 className="display italic text-[1.5rem] leading-snug">{info.curta}</h3>
      <p className="text-xs text-muted mt-1 mb-4 leading-relaxed">{info.completa}</p>

      {lookPecas.length > 0 ? (
        <>
          <FlatLayView pecas={lookPecas} compact />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {lookPecas.map((p) => (
              <span key={p.id} className="chip">
                {p.hex && (
                  <span className="w-2.5 h-2.5 rounded-full border border-border flex-shrink-0" style={{ backgroundColor: p.hex }} />
                )}
                {p.nome}
              </span>
            ))}
          </div>
        </>
      ) : (
        <div className="py-8 text-center bg-surface-alt rounded-[4px]">
          <Shirt size={24} strokeWidth={1.25} className="text-muted mx-auto mb-2" />
          <p className="text-xs text-muted">Peças não encontradas</p>
        </div>
      )}

      <div className="mt-4">
        <p className="eyebrow mb-1.5">Por que funciona</p>
        <p className="text-sm text-foreground leading-relaxed">{look.por_que_funciona}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-5">
        {decisoes.map((d) => (
          <button
            key={d.key}
            type="button"
            aria-pressed={savedDecision === d.key}
            onClick={() => onDecision(look.tipo, d.key)}
            className="option justify-center text-[13px] font-medium min-h-11 py-2"
          >
            {savedDecision === d.key && <Check size={14} />}
            {d.label}
          </button>
        ))}
      </div>
    </article>
  );
}

function GeneratingState() {
  const tips = [
    'Consultando seu armário…',
    'Verificando a temperatura…',
    'Combinando peças…',
    'Considerando o seu estilo…',
    'Montando seus looks…',
  ];
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [tips.length]);

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
      <div className="loader-line" />
      <div>
        <p className="display text-[1.75rem] mb-2">Criando seus looks</p>
        <p className="display italic text-muted">{tips[tipIndex]}</p>
      </div>
    </div>
  );
}

// ============================================
// Main Page
// ============================================
function LooksPage() {
  const searchParams = useSearchParams();
  const ocasiaoParam = searchParams.get('ocasiao');
  const tempParam = searchParams.get('temp');

  const [step, setStep] = useState<Step>('select');
  const [weather, setWeather] = useState<WeatherData | null>(() => {
    const t = tempParam ? Number(tempParam) : NaN;
    return Number.isFinite(t)
      ? { temp: t, description: '', city_name: '', humidity: null, wind_speedy: null }
      : null;
  });
  const [ocasiao, setOcasiao] = useState<string | null>(() =>
    ocasiaoParam && ocasiaoParam in OCASIOES ? ocasiaoParam : null
  );
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [pecasMap, setPecasMap] = useState<Map<string, Peca>>(new Map());
  const [perfilEstilo, setPerfilEstilo] = useState<PerfilEstilo | null>(null);
  const [looks, setLooks] = useState<GeneratedLook[]>([]);
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [erro, setErro] = useState<ErroLooks | null>(null);
  const [avisos, setAvisos] = useState<string[]>([]);
  const [fixedPecas, setFixedPecas] = useState<Set<string>>(new Set());
  // A usuária está na rua e sabe melhor que a previsão: desloca a faixa do dia.
  const [ajusteClima, setAjusteClima] = useState<AjusteClima>(0);
  const [climaUsado, setClimaUsado] = useState<ClimaUsado | null>(null);
  const [feedbackFor, setFeedbackFor] = useState<LookTipo | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userCity, setUserCity] = useState<string>('');
  const [loadingPecas, setLoadingPecas] = useState(true);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Load profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('perfil_estilo, cidade')
        .eq('id', user.id)
        .single();
      if (profile?.perfil_estilo) {
        setPerfilEstilo(profile.perfil_estilo as PerfilEstilo);
      }
      if (profile?.cidade) {
        setUserCity(profile.cidade);
      }

      // Load all available pieces
      const { data: pecasData } = await supabase
        .from('pecas')
        .select('*')
        .eq('user_id', user.id)
        .eq('disponivel', true);
      if (pecasData) {
        setPecas(pecasData as Peca[]);
        const map = new Map<string, Peca>();
        (pecasData as Peca[]).forEach((p) => map.set(p.id, p));
        setPecasMap(map);
      }
      setLoadingPecas(false);
    }
    loadData();
  }, []);

  // Estável: evita que o WeatherCard refaça o fetch a cada renderização
  const handleWeatherLoad = useCallback(
    (data: { temp: number; max: number; min: number; condition: string }) => {
      setWeather({
        temp: data.temp,
        description: data.condition,
        city_name: userCity || 'Curitiba',
        humidity: null,
        wind_speedy: null,
      });
    },
    [userCity]
  );

  const handleGenerate = useCallback(async (ajuste: AjusteClima = ajusteClima) => {
    if (!ocasiao || pecas.length === 0) return;

    setStep('generating');
    setErro(null);
    setAvisos([]);
    setDecisions({});

    try {
      // Send minimal piece data to reduce token usage
      const pecasMinimal = pecas.map((p) => ({
        id: p.id,
        nome: p.nome,
        categoria: p.categoria,
        subcategoria: p.subcategoria,
        cor: p.cor,
        formalidade: p.formalidade,
        protagonismo: p.protagonismo,
        temporadas: p.temporadas,
        temperatura_min: p.temperatura_min,
        temperatura_max: p.temperatura_max,
        ocasioes: p.ocasioes,
        estilos: p.estilos,
        estado: p.estado,
        comprimento: p.comprimento,
        material: p.material,
        disponivel: p.disponivel,
        vezes_usada: p.vezes_usada,
        ultima_utilizacao: p.ultima_utilizacao,
        // Sinais de caimento e limites: calculados no servidor a partir destes campos
        tamanho: p.tamanho,
        como_me_queda: p.como_me_queda,
        atributos: atributosDaFicha(p.ficha_ia),
      }));

      const res = await fetch('/api/looks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocasiao,
          temperatura: weather?.temp ?? null,
          condicaoClima: weather?.description || null,
          perfilEstilo,
          pecas: pecasMinimal,
          formalidadeAlvo: 3,
          pecasFixadas: Array.from(fixedPecas),
          ajusteClima: ajuste,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || json.error || !json.data?.looks) {
        setErro(erroHumano(json.code, OCASIOES[ocasiao as keyof typeof OCASIOES] || null));
        setStep('select');
        return;
      }

      setLooks(json.data.looks as GeneratedLook[]);
      setAvisos(Array.isArray(json.data.avisos) ? json.data.avisos : []);
      setClimaUsado(json.data.clima ?? null);
      setStep('results');
    } catch {
      setErro(erroHumano('CONEXAO', null));
      setStep('select');
    }
  }, [ocasiao, pecas, weather, perfilEstilo, fixedPecas, ajusteClima]);

  // Refaz os looks com o clima ajustado pela usuária (nova geração).
  const handleAjustarClima = (ajuste: AjusteClima) => {
    setAjusteClima(ajuste);
    handleGenerate(ajuste);
  };

  const handleDecision = useCallback(
    async (tipo: LookTipo, decisao: string) => {
      setDecisions((prev) => ({ ...prev, [tipo]: decisao }));

      if (!userId) return;

      const look = looks.find((l) => l.tipo === tipo);
      if (!look) return;

      const supabase = createClient();

      // Save look to database
      const { error: insertError } = await supabase.from('looks').upsert(
        {
          user_id: userId,
          tipo: look.tipo,
          pecas: look.pecas,
          decisao: decisao,
          por_que_funciona: look.por_que_funciona,
          clima_temp: look.clima_temp,
          clima_condicao: look.clima_condicao,
          ocasiao: look.ocasiao,
          formalidade_alvo: look.formalidade_alvo,
          grupo_id: look.grupo_id,
          data: new Date().toISOString().split('T')[0],
        },
        {
          onConflict: 'id',
        }
      );

      if (insertError) {
        console.error('Error saving look decision:', insertError);
      }

      // If "usei", show feedback modal then register usage
      if (decisao === 'usei') {
        setFeedbackFor(tipo);
      }
    },
    [userId, looks]
  );

  const handleFeedbackSubmit = useCallback(
    async (comoMeSenti: string, feedbackText: string) => {
      if (!userId || !feedbackFor) return;
      const look = looks.find((l) => l.tipo === feedbackFor);
      if (!look) { setFeedbackFor(null); return; }

      const supabase = createClient();

      // Insert usage record with feedback
      await supabase.from('registros_uso').insert({
        user_id: userId,
        pecas: look.pecas,
        ocasiao: look.ocasiao,
        data: new Date().toISOString().split('T')[0],
        como_me_senti: comoMeSenti,
        feedback: feedbackText || null,
      });

      // Update vezes_usada + ultima_utilizacao for each piece
      for (const pecaId of look.pecas) {
        const peca = pecasMap.get(pecaId);
        if (peca) {
          await supabase
            .from('pecas')
            .update({
              vezes_usada: peca.vezes_usada + 1,
              ultima_utilizacao: new Date().toISOString().split('T')[0],
            })
            .eq('id', pecaId);
        }
      }

      setFeedbackFor(null);
    },
    [userId, feedbackFor, looks, pecasMap]
  );

  const handleNewLooks = () => {
    setStep('select');
    setLooks([]);
    setAvisos([]);
    setDecisions({});
    setOcasiao(null);
  };

  // ============================================
  // Render
  // ============================================

  if (loadingPecas && step === 'select') {
    return (
      <div className="flex justify-center pt-24">
        <div className="loader-line" />
      </div>
    );
  }

  // No pieces state
  if (pecas.length === 0 && step === 'select') {
    return (
      <div className="pt-8">
        <h1 className="display text-[2.25rem] mb-8">Looks para você</h1>
        <div className="pt-6 text-center max-w-xs mx-auto">
          <Shirt size={28} strokeWidth={1.25} className="mx-auto text-gold mb-5" />
          <h2 className="display text-[1.75rem] mb-2">Seu armário está vazio</h2>
          <p className="text-sm text-muted leading-relaxed mb-6">
            Adicione peças ao seu armário para começar a criar looks.
          </p>
          <Link href="/armario" className="btn btn-primary w-full">
            Adicionar peças
          </Link>
        </div>
      </div>
    );
  }

  // Generating state
  if (step === 'generating') {
    return (
      <div className="pt-8">
        <h1 className="display text-[2.25rem]">Looks para você</h1>
        <GeneratingState />
      </div>
    );
  }

  // Results state
  if (step === 'results') {
    return (
      <div className="pt-8 pb-4">
        <div className="flex items-start justify-between mb-2">
          <h1 className="display text-[2.25rem]">Looks para você</h1>
          <button
            type="button"
            onClick={handleNewLooks}
            className="flex items-center gap-1.5 text-sm font-semibold mt-3"
          >
            <RefreshCw size={14} />
            Novo
          </button>
        </div>
        <p className="text-[13px] text-muted mb-6">
          {OCASIOES[ocasiao as keyof typeof OCASIOES]} · {climaUsado ? climaUsado.resumo : `${weather?.temp ?? '—'}°C`} · {pecas.length} peças
        </p>
        {climaUsado && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-6 -mt-4 text-[12px] text-muted">
            <span>O clima não bate com o que você sente?</span>
            {climaUsado.ajuste !== -1 && (
              <button type="button" onClick={() => handleAjustarClima(-1)} className="link font-semibold">Está mais frio</button>
            )}
            {climaUsado.ajuste !== 1 && (
              <button type="button" onClick={() => handleAjustarClima(1)} className="link font-semibold">Está mais quente</button>
            )}
            {climaUsado.ajuste !== 0 && (
              <button type="button" onClick={() => handleAjustarClima(0)} className="link font-semibold">Como previsto</button>
            )}
          </div>
        )}

        {avisos.length > 0 && (
          <div className="mb-6 p-3 border-l-2 border-gold bg-surface-alt">
            {avisos.map((a, i) => (
              <p key={i} className="text-[13px] text-foreground leading-relaxed">{a}</p>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-8">
          {looks.map((look) => (
            <LookCard
              key={look.tipo}
              look={look}
              pecasMap={pecasMap}
              onDecision={handleDecision}
              savedDecision={decisions[look.tipo] || null}
            />
          ))}
        </div>

        {feedbackFor && (
          <FeedbackModal
            onSubmit={handleFeedbackSubmit}
            onCancel={() => setFeedbackFor(null)}
          />
        )}
      </div>
    );
  }

  // Select occasion state (default)
  return (
    <div className="pt-8 pb-4">
      <h1 className="display text-[2.25rem] mb-2">Looks para você</h1>
      <p className="text-[13px] text-muted mb-6">
        Escolha a ocasião e montamos três caminhos com as peças do seu armário.
      </p>

      <div className="mb-8">
        <WeatherCard mode="current" city={userCity || undefined} onWeatherLoad={handleWeatherLoad} />
        <div className="mt-3">
          <p className="text-xs text-muted mb-2">Como está aí fora?</p>
          <div className="grid grid-cols-3 gap-2">
            {AJUSTES_CLIMA.map(({ valor, label }) => (
              <button
                key={valor}
                type="button"
                aria-pressed={ajusteClima === valor}
                onClick={() => setAjusteClima(valor)}
                className="option text-[12px]"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Occasion selector */}
      <div className="mb-8">
        <p className="eyebrow mb-3">Para que ocasião?</p>
        <OcasiaoSelector selected={ocasiao} onSelect={setOcasiao} />
      </div>

      {erro && (
        <div role="alert" className="mb-6 p-4 border-l-2 border-danger bg-surface">
          <p className="display text-lg mb-1">{erro.titulo}</p>
          <p className="text-[13px] text-muted leading-relaxed">{erro.texto}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {erro.acoes.includes('armario') && (
              <Link href="/armario" className="btn btn-primary min-h-10 text-[13px]">Adicionar peças</Link>
            )}
            {erro.acoes.includes('outra_ocasiao') && (
              <button type="button" onClick={() => { setErro(null); setOcasiao(null); }} className="btn btn-outline min-h-10 text-[13px]">
                Escolher outra ocasião
              </button>
            )}
            {erro.acoes.includes('tentar') && (
              <button type="button" onClick={() => handleGenerate()} className="btn btn-outline min-h-10 text-[13px]">
                Tentar de novo
              </button>
            )}
          </div>
        </div>
      )}

      {/* Fixed pieces selector */}
      {pecas.length > 0 && (
        <div className="mb-8">
          <div className="flex items-baseline gap-2 mb-1">
            <p className="eyebrow">Peças que quero usar</p>
            <span className="text-[11px] text-muted">({fixedPecas.size})</span>
          </div>
          <p className="text-xs text-muted mb-3">
            Opcional: fixe peças e os looks serão montados a partir delas.
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {pecas.slice(0, 20).map((p) => {
              const fixed = fixedPecas.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={fixed}
                  aria-label={p.nome}
                  onClick={() => {
                    setFixedPecas(prev => {
                      const next = new Set(prev);
                      if (next.has(p.id)) next.delete(p.id);
                      else next.add(p.id);
                      return next;
                    });
                  }}
                  className={`flex-shrink-0 w-14 h-[74px] overflow-hidden rounded-[2px] relative transition-all ${
                    fixed ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'opacity-70'
                  }`}
                >
                  {p.imagem_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imagem_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-surface-alt flex items-center justify-center">
                      <Shirt size={16} className="text-muted" />
                    </div>
                  )}
                  {fixed && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <Pin size={8} className="text-background" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Generate button */}
      <button type="button" onClick={() => handleGenerate()} disabled={!ocasiao} className="btn btn-primary w-full">
        Criar meus looks
        {ocasiao && <ArrowRight size={16} />}
      </button>

      <p className="text-center text-xs text-muted mt-3">
        {pecas.length} peças disponíveis no armário
      </p>

      {!perfilAtivo(perfilEstilo) && (
        <p className="text-center text-xs text-muted mt-2">
          <Link href="/estilo" className="link">Complete seu perfil de estilo</Link> para looks mais personalizados.
        </p>
      )}
    </div>
  );
}

export default function LooksPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center pt-24">
          <div className="loader-line" />
        </div>
      }
    >
      <LooksPage />
    </Suspense>
  );
}
