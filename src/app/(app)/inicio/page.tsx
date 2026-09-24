'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  Loader2,
  ArrowRight,
  Briefcase,
  Users,
  Handshake,
  Presentation,
  CalendarHeart,
  Shirt,
  Video,
  Plane,
  Coffee,
  type LucideIcon,
} from 'lucide-react';
import { OCASIOES } from '@/lib/constants';
import { createClient } from '@/lib/supabase-client';

type WeatherData = {
  temp: number;
  description: string;
  city: string;
  humidity: number | null;
  wind: string | null;
  condition: string;
};

const OCASIAO_ICONS: Record<string, LucideIcon> = {
  trabalho: Briefcase,
  reuniao: Users,
  networking: Handshake,
  palestra: Presentation,
  evento: CalendarHeart,
  casual: Shirt,
  gravacao: Video,
  viagem: Plane,
  encontro: Coffee,
};

function WeatherIcon({ description }: { description: string }) {
  const weatherMap: [string, LucideIcon][] = [
    ['sol', Sun],
    ['limpo', Sun],
    ['nublado', Cloud],
    ['chuva', CloudRain],
    ['tempestade', CloudRain],
    ['neve', CloudSnow],
  ];
  const Icon = weatherMap.find(([key]) => description.toLowerCase().includes(key))?.[1] || Sun;
  return <Icon size={26} strokeWidth={1.25} className="text-gold" />;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function formatToday() {
  const s = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function InicioPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [selectedOcasiao, setSelectedOcasiao] = useState<string | null>(null);
  const [stats, setStats] = useState({ pecas: 0, looks: 0, usados: 0 });
  const [sugestao, setSugestao] = useState<string>('');
  const [sugestaoFoto, setSugestaoFoto] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userCity, setUserCity] = useState<string>('');

  // Load real stats from Supabase
  useEffect(() => {
    async function loadStats() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's name and city from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome, cidade')
        .eq('id', user.id)
        .single();
      if (profile?.nome) {
        setUserName(profile.nome.split(' ')[0]); // First name only
      }
      if (profile?.cidade) {
        setUserCity(profile.cidade);
      }

      const [pecasRes, looksRes, usadosRes] = await Promise.all([
        supabase.from('pecas').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('looks').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('looks').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('decisao', 'usei'),
      ]);

      setStats({
        pecas: pecasRes.count ?? 0,
        looks: looksRes.count ?? 0,
        usados: usadosRes.count ?? 0,
      });

      // Smart suggestion based on real data
      const totalPecas = pecasRes.count ?? 0;
      const totalLooks = looksRes.count ?? 0;

      if (totalPecas === 0) {
        setSugestao('Comece fotografando suas peças. O Cabidê organiza seu armário para você.');
        return;
      }

      // Foto editorial: a peça mais recente do armário
      const { data: recente } = await supabase
        .from('pecas')
        .select('imagem_url')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (recente?.[0]?.imagem_url) setSugestaoFoto(recente[0].imagem_url);

      if (totalPecas < 5) {
        setSugestao(`Você tem ${totalPecas} peças. Com 10 ou mais, seus looks ficam muito mais variados.`);
      } else if (totalLooks === 0) {
        setSugestao('Seu armário está pronto. Que tal criar seus primeiros looks?');
      } else {
        // Check for forgotten pieces
        const { data: forgotten } = await supabase
          .from('pecas')
          .select('nome, imagem_url')
          .eq('user_id', user.id)
          .eq('disponivel', true)
          .lt('vezes_usada', 2)
          .order('vezes_usada')
          .limit(1);

        if (forgotten && forgotten.length > 0) {
          setSugestao(`Que tal dar vida nova a “${forgotten[0].nome}”?`);
          if (forgotten[0].imagem_url) setSugestaoFoto(forgotten[0].imagem_url);
        }
      }
    }
    loadStats();
  }, []);

  useEffect(() => {
    const cityQuery = userCity ? `?city=${encodeURIComponent(userCity)}` : '';
    fetch(`/api/weather${cityQuery}`)
      .then(res => res.json())
      .then(json => {
        if (json.current) {
          setWeather(json.current);
        }
      })
      .catch(() => setWeather(null))
      .finally(() => setLoadingWeather(false));
  }, [userCity]);

  const sugestaoTexto =
    sugestao ||
    (weather && weather.temp < 20
      ? 'Dia fresco pede camadas leves e sofisticadas.'
      : 'Looks leves e sofisticados para um dia agradável.');
  const sugestaoHref = stats.pecas === 0 ? '/armario' : '/looks';

  return (
    <div className="pt-8 pb-4">
      {/* Header */}
      <header className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="display text-[2.25rem]">
            {getGreeting()},
            {userName && (
              <>
                <br />
                {userName}
              </>
            )}
          </h1>
          <p className="text-[13px] text-muted mt-2">
            {userCity || weather?.city || ''}
            {(userCity || weather?.city) && <br />}
            {formatToday()}
          </p>
        </div>

        <div className="text-right pt-1 min-w-20">
          {loadingWeather ? (
            <Loader2 size={18} className="animate-spin text-muted ml-auto" />
          ) : weather ? (
            <>
              <div className="flex items-center justify-end gap-2">
                <WeatherIcon description={weather.description} />
                <span className="display text-[1.75rem]">{weather.temp}°C</span>
              </div>
              <p className="text-xs text-muted mt-0.5 capitalize">{weather.description}</p>
            </>
          ) : (
            <p className="text-xs text-muted">Clima indisponível</p>
          )}
        </div>
      </header>

      {/* Sugestão do dia */}
      <section className="mb-10">
        <div className="rule mb-5" />
        <p className="eyebrow mb-4">Sugestão do dia</p>
        <Link href={sugestaoHref} className="grid grid-cols-[1fr_auto] gap-5 items-stretch group">
          <div className="flex flex-col">
            <p className="display text-[1.5rem] leading-snug">{sugestaoTexto}</p>
            <ArrowRight
              size={22}
              strokeWidth={1.25}
              className="mt-auto pt-4 box-content transition-transform group-hover:translate-x-1"
            />
          </div>
          <div className="relative w-36">
            <div className="aspect-[3/4] w-full bg-surface-alt overflow-hidden rounded-[4px]">
              {sugestaoFoto && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sugestaoFoto} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <p
              className="absolute -bottom-7 -left-4 rotate-[-6deg] text-[1.2rem] leading-none text-gold-text"
              style={{ fontFamily: 'var(--font-hand)' }}
            >
              menos complicação,
              <br />
              <span className="pl-6">mais você.</span>
            </p>
          </div>
        </Link>
      </section>

      {/* Ocasião */}
      <section className="mb-6 mt-12">
        <p className="eyebrow mb-4">O que você vai fazer hoje?</p>

        <div className="grid grid-cols-2 gap-2">
          {Object.entries(OCASIOES).map(([key, label]) => {
            const Icon = OCASIAO_ICONS[key] || Shirt;
            const selected = selectedOcasiao === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                onClick={() => setSelectedOcasiao(selected ? null : key)}
                className="option text-[13px]"
              >
                <Icon size={16} strokeWidth={1.5} className="flex-shrink-0" />
                <span className="leading-tight">{label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <button
        type="button"
        disabled={!selectedOcasiao}
        onClick={() => {
          if (selectedOcasiao) {
            window.location.href = `/looks?ocasiao=${selectedOcasiao}&temp=${weather?.temp ?? ''}`;
          }
        }}
        className="btn btn-primary w-full"
      >
        Criar meus looks
      </button>

      {/* Números */}
      <div className="mt-10 grid grid-cols-3 border-y border-border">
        {[
          { value: stats.pecas, label: 'Peças' },
          { value: stats.looks, label: 'Looks criados' },
          { value: stats.usados, label: 'Looks usados' },
        ].map((s, i) => (
          <div key={s.label} className={`py-4 text-center ${i > 0 ? 'border-l border-border' : ''}`}>
            <p className="display text-[1.75rem] leading-none">{s.value}</p>
            <p className="text-[11px] text-muted mt-1.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
