'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Loader2,
  Cloud,
  Thermometer,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Minus,
  RefreshCw,
  ShieldCheck,
  Zap,
  Flame,
  Shirt,
} from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { OCASIOES, FORMALIDADE_LABELS } from '@/lib/constants';
import type { Peca, PerfilEstilo, LookTipo } from '@/types/database';
import { WeatherCard as RealWeatherCard } from '@/components/WeatherCard';
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

// ============================================
// Sub-components
// ============================================
function WeatherCard({ weather }: { weather: WeatherData | null }) {
  if (!weather) return null;

  return (
    <div className="flex items-center gap-3 bg-surface rounded-xl p-3 border border-border">
      <div className="w-10 h-10 rounded-full bg-surface-alt flex items-center justify-center">
        <Cloud className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{weather.city_name}</p>
        <p className="text-xs text-muted">{weather.description}</p>
      </div>
      <div className="flex items-center gap-1 text-foreground">
        <Thermometer className="w-4 h-4 text-muted" />
        <span className="text-lg font-semibold">{weather.temp}°</span>
      </div>
    </div>
  );
}

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
          onClick={() => onSelect(key)}
          className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
            selected === key
              ? 'bg-primary text-white'
              : 'bg-surface border border-border text-foreground hover:border-primary/50'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

const LOOK_CONFIG: Record<
  LookTipo,
  { label: string; emoji: string; color: string; icon: typeof ShieldCheck; desc: string }
> = {
  safe: {
    label: 'Safe',
    emoji: '🛡️',
    color: 'text-success',
    icon: ShieldCheck,
    desc: 'Combinação segura e coerente',
  },
  cool: {
    label: 'Cool',
    emoji: '⚡',
    color: 'text-primary',
    icon: Zap,
    desc: 'Combinação mais interessante',
  },
  risky: {
    label: 'Risky',
    emoji: '🔥',
    color: 'text-warning',
    icon: Flame,
    desc: 'Fora da zona de conforto',
  },
};

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
  const config = LOOK_CONFIG[look.tipo];
  const Icon = config.icon;
  const lookPecas = look.pecas
    .map((id) => pecasMap.get(id))
    .filter(Boolean) as Peca[];

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Icon className={`w-5 h-5 ${config.color}`} />
        <div className="flex-1">
          <h3 className="text-base font-semibold text-foreground">
            {config.label}
          </h3>
          <p className="text-xs text-muted">{config.desc}</p>
        </div>
        <span className="text-xs bg-surface-alt px-2 py-1 rounded-full text-muted">
          {FORMALIDADE_LABELS[look.formalidade_resultante] || `F${look.formalidade_resultante}`}
        </span>
      </div>

      {/* Flat lay visual */}
      <div className="p-3">
        {lookPecas.length > 0 ? (
          <FlatLayView pecas={lookPecas} compact />
        ) : (
          <div className="py-6 text-center">
            <Shirt className="w-8 h-8 text-muted mx-auto mb-2" />
            <p className="text-xs text-muted">Peças não encontradas</p>
          </div>
        )}
      </div>

      {/* Explanation */}
      <div className="px-4 pb-3">
        <p className="text-sm text-muted leading-relaxed">
          {look.por_que_funciona}
        </p>
      </div>

      {/* Decision buttons */}
      <div className="flex items-center border-t border-border">
        <button
          onClick={() => onDecision(look.tipo, 'usei')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            savedDecision === 'usei'
              ? 'bg-success/10 text-success'
              : 'text-muted hover:text-success hover:bg-success/5'
          }`}
        >
          <ThumbsUp className="w-4 h-4" />
          Usei
        </button>
        <div className="w-px h-8 bg-border" />
        <button
          onClick={() => onDecision(look.tipo, 'nao_usei')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            savedDecision === 'nao_usei'
              ? 'bg-surface-alt text-foreground'
              : 'text-muted hover:text-foreground hover:bg-surface-alt'
          }`}
        >
          <Minus className="w-4 h-4" />
          Não usei
        </button>
        <div className="w-px h-8 bg-border" />
        <button
          onClick={() => onDecision(look.tipo, 'nao_gostei')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            savedDecision === 'nao_gostei'
              ? 'bg-danger/10 text-danger'
              : 'text-muted hover:text-danger hover:bg-danger/5'
          }`}
        >
          <ThumbsDown className="w-4 h-4" />
          Não gostei
        </button>
      </div>
    </div>
  );
}

function GeneratingOverlay() {
  const tips = [
    'Consultando seu armário...',
    'Verificando temperatura...',
    'Combinando peças...',
    'Aplicando seu perfil de estilo...',
    'Montando looks...',
  ];
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [tips.length]);

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-primary animate-pulse" />
        </div>
        <Loader2 className="w-24 h-24 text-primary/30 animate-spin absolute -top-2 -left-2" />
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-foreground mb-1">
          Criando seus looks
        </p>
        <p className="text-sm text-muted animate-pulse">{tips[tipIndex]}</p>
      </div>
    </div>
  );
}

// ============================================
// Main Page
// ============================================
export default function LooksPage() {
  const [step, setStep] = useState<Step>('select');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [ocasiao, setOcasiao] = useState<string | null>(null);
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [pecasMap, setPecasMap] = useState<Map<string, Peca>>(new Map());
  const [perfilEstilo, setPerfilEstilo] = useState<PerfilEstilo | null>(null);
  const [looks, setLooks] = useState<GeneratedLook[]>([]);
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

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
        .select('perfil_estilo')
        .eq('id', user.id)
        .single();
      if (profile?.perfil_estilo) {
        setPerfilEstilo(profile.perfil_estilo as PerfilEstilo);
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

      // Load weather
      try {
        const weatherRes = await fetch('/api/weather');
        const weatherJson = await weatherRes.json();
        if (weatherJson.data) setWeather(weatherJson.data);
      } catch {
        // Weather is optional
      }
    }
    loadData();
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!ocasiao || pecas.length === 0) return;

    setStep('generating');
    setError(null);
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
      }));

      const res = await fetch('/api/looks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocasiao,
          temperatura: weather?.temp ?? null,
          condicaoClima: weather?.description ?? null,
          perfilEstilo,
          pecas: pecasMinimal,
          formalidadeAlvo: 3,
        }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error || 'Erro ao gerar looks');
        setStep('select');
        return;
      }

      setLooks(json.data.looks as GeneratedLook[]);
      setStep('results');
    } catch {
      setError('Erro de conexão. Tente novamente.');
      setStep('select');
    }
  }, [ocasiao, pecas, weather, perfilEstilo]);

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

      // If "usei", register usage and update piece stats
      if (decisao === 'usei') {
        // Insert usage record
        await supabase.from('registros_uso').insert({
          user_id: userId,
          pecas: look.pecas,
          ocasiao: look.ocasiao,
          data: new Date().toISOString().split('T')[0],
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
      }
    },
    [userId, looks, pecasMap]
  );

  const handleNewLooks = () => {
    setStep('select');
    setLooks([]);
    setDecisions({});
    setOcasiao(null);
  };

  // ============================================
  // Render
  // ============================================

  // No pieces state
  if (pecas.length === 0 && step === 'select') {
    return (
      <div className="pt-8">
        <h1 className="text-2xl text-foreground mb-6">Meus Looks</h1>
        <div className="rounded-2xl border-2 border-dashed border-border p-12 flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-alt flex items-center justify-center">
            <Shirt className="w-8 h-8 text-muted" />
          </div>
          <p className="text-foreground font-medium">Armário vazio</p>
          <p className="text-muted text-xs leading-relaxed">
            Adicione peças no seu armário primeiro para poder gerar looks.
          </p>
        </div>
      </div>
    );
  }

  // Generating state
  if (step === 'generating') {
    return (
      <div className="pt-8">
        <h1 className="text-2xl text-foreground mb-6">Meus Looks</h1>
        <GeneratingOverlay />
      </div>
    );
  }

  // Results state
  if (step === 'results') {
    return (
      <div className="pt-8 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl text-foreground">Seus Looks</h1>
          <button
            onClick={handleNewLooks}
            className="flex items-center gap-1.5 text-sm text-primary font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Novo
          </button>
        </div>
        <p className="text-xs text-muted mb-4">
          {OCASIOES[ocasiao as keyof typeof OCASIOES]} • {weather?.temp ?? '—'}°C •{' '}
          {pecas.length} peças
        </p>

        <div className="flex flex-col gap-4">
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
      </div>
    );
  }

  // Select occasion state (default)
  return (
    <div className="pt-8">
      <h1 className="text-2xl text-foreground mb-2">Meus Looks</h1>
      <p className="text-muted text-sm mb-6">
        Escolha a ocasião e a IA vai montar 3 opções de looks com as peças do
        seu armário.
      </p>

      {/* Weather — real API */}
      <div className="mb-6">
        <RealWeatherCard
          mode="current"
          onWeatherLoad={(data) => {
            setWeather({
              temp: data.temp,
              description: data.condition,
              city_name: 'Curitiba',
              humidity: null,
              wind_speedy: null,
            });
          }}
        />
      </div>

      {/* Occasion selector */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-foreground mb-3">
          Para que ocasião?
        </h2>
        <OcasiaoSelector selected={ocasiao} onSelect={setOcasiao} />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-danger/10 text-danger text-sm rounded-xl p-3 mb-4">
          {error}
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!ocasiao}
        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium text-base transition-all ${
          ocasiao
            ? 'bg-primary text-white hover:bg-primary-hover active:scale-[0.98]'
            : 'bg-surface-alt text-muted cursor-not-allowed'
        }`}
      >
        <Sparkles className="w-5 h-5" />
        Gerar meus looks
        {ocasiao && <ChevronRight className="w-4 h-4" />}
      </button>

      {/* Piece count info */}
      <p className="text-center text-xs text-muted mt-3">
        {pecas.length} peças disponíveis no armário
      </p>

      {!perfilEstilo && (
        <p className="text-center text-xs text-warning mt-2">
          Complete seu perfil de estilo para looks mais personalizados
        </p>
      )}
    </div>
  );
}