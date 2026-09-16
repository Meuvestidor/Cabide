'use client';

import { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, Wind, Loader2 } from 'lucide-react';
import { OCASIOES } from '@/lib/constants';
import { createClient } from '@/lib/supabase-client';

type WeatherData = {
  temp: number;
  description: string;
  city_name: string;
  humidity: number | null;
  wind_speedy: string | null;
};

function WeatherIcon({ description }: { description: string }) {
  const weatherMap: [string, typeof Sun][] = [
    ['sol', Sun],
    ['limpo', Sun],
    ['nublado', Cloud],
    ['chuva', CloudRain],
    ['tempestade', CloudRain],
    ['neve', CloudSnow],
  ];
  const Icon = weatherMap.find(
    ([key]) => description.toLowerCase().includes(key)
  )?.[1] || Sun;
  return <Icon size={20} />;
}

export default function InicioPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [selectedOcasiao, setSelectedOcasiao] = useState<string | null>(null);
  const [stats, setStats] = useState({ pecas: 0, looks: 0, favoritos: 0 });
  const [sugestao, setSugestao] = useState<string>('');

  // Load real stats from Supabase
  useEffect(() => {
    async function loadStats() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [pecasRes, looksRes, favRes] = await Promise.all([
        supabase.from('pecas').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('looks').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('looks').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('decisao', 'usei'),
      ]);

      setStats({
        pecas: pecasRes.count ?? 0,
        looks: looksRes.count ?? 0,
        favoritos: favRes.count ?? 0,
      });

      // Smart suggestion based on real data
      const totalPecas = pecasRes.count ?? 0;
      const totalLooks = looksRes.count ?? 0;

      if (totalPecas === 0) {
        setSugestao('Comece adicionando suas peças no armário! Fotografe suas roupas e a IA vai catalogar automaticamente.');
      } else if (totalPecas < 5) {
        setSugestao(`Você tem ${totalPecas} peças. Adicione mais para ter looks mais variados — a mágica começa com 10+ peças.`);
      } else if (totalLooks === 0) {
        setSugestao('Seu armário está pronto! Que tal gerar seus primeiros looks? Escolha uma ocasião abaixo.');
      } else {
        // Check for forgotten pieces
        const { data: forgotten } = await supabase
          .from('pecas')
          .select('nome')
          .eq('user_id', user.id)
          .eq('disponivel', true)
          .lt('vezes_usada', 2)
          .order('vezes_usada')
          .limit(1);

        if (forgotten && forgotten.length > 0) {
          setSugestao(`Que tal usar "${forgotten[0].nome}"? Essa peça está esquecida no armário — vamos dar vida a ela!`);
        }
      }
    }
    loadStats();
  }, []);

  useEffect(() => {
    fetch('/api/weather?city=Curitiba,PR')
      .then(res => res.json())
      .then(json => setWeather(json.data))
      .catch(() => setWeather(null))
      .finally(() => setLoadingWeather(false));
  }, []);

  return (
    <div className="pt-8">
      {/* Header */}
      <header className="mb-6">
        <h1
          className="leading-tight"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '1.75rem',
            fontWeight: 500,
            color: '#2D2A26',
          }}
        >
          Bom dia ✨
        </h1>
        <p
          className="mt-1"
          style={{ fontSize: '0.8125rem', color: '#6B6560' }}
        >
          Sua estilista pessoal com IA
        </p>
      </header>

      {/* Weather Card */}
      <div
        className="rounded-2xl p-4 mb-6"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E8E4DE',
          boxShadow: '0 2px 8px rgba(45,42,38,0.05)',
        }}
      >
        {loadingWeather ? (
          <div className="flex items-center gap-2" style={{ color: '#9A958F' }}>
            <Loader2 size={18} className="animate-spin" />
            <span style={{ fontSize: '0.875rem' }}>Carregando clima...</span>
          </div>
        ) : weather ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: '#F0ECF7', color: '#5E4F72' }}
              >
                <WeatherIcon description={weather.description} />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '1.125rem', color: '#2D2A26' }}>
                  {weather.temp}°C
                </p>
                <p style={{ color: '#6B6560', fontSize: '0.8125rem' }}>
                  {weather.city_name}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p style={{ fontSize: '0.875rem', color: '#2D2A26' }}>
                {weather.description}
              </p>
              {weather.humidity && (
                <p
                  className="flex items-center gap-1 justify-end"
                  style={{ fontSize: '0.75rem', color: '#9A958F' }}
                >
                  <Wind size={12} /> {weather.wind_speedy}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p style={{ fontSize: '0.875rem', color: '#9A958F' }}>
            Clima indisponível
          </p>
        )}
      </div>

      {/* AI Suggestion Card */}
      <div
        className="rounded-2xl p-4 mb-6 relative overflow-hidden"
        style={{
          background: '#F0ECF7',
          border: '1px solid #C4B8E9',
          boxShadow: '0 4px 16px rgba(196,184,233,0.20)',
        }}
      >
        {/* Gradient bar */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{
            height: '3px',
            background: 'linear-gradient(90deg, #C4B8E9 0%, #7A6B8E 50%, #F5E4A8 100%)',
          }}
        />
        <div className="flex items-center gap-2 mb-2">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 1L9.5 5.5L14 7L9.5 8.5L8 13L6.5 8.5L2 7L6.5 5.5Z"
              stroke="#5E4F72"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: '#5E4F72',
              letterSpacing: '0.03em',
            }}
          >
            Sugestão da estilista
          </span>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#2D2A26', lineHeight: 1.5 }}>
          {sugestao || (weather && weather.temp < 20
            ? 'Dia fresco — que tal um look com camadas? Separei algumas opções pra você.'
            : 'Dia agradável — looks leves e frescos vão funcionar muito bem hoje.')}
        </p>
      </div>

      {/* Main Question */}
      <section className="mb-6">
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#2D2A26',
            marginBottom: '1rem',
          }}
        >
          O que você vai fazer hoje?
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {Object.entries(OCASIOES).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedOcasiao(
                selectedOcasiao === key ? null : key
              )}
              className="rounded-xl p-3 text-left text-sm transition-all"
              style={{
                border: selectedOcasiao === key
                  ? '1.5px solid #5E4F72'
                  : '1.5px solid #E8E4DE',
                background: selectedOcasiao === key
                  ? '#F0ECF7'
                  : '#FFFFFF',
                color: selectedOcasiao === key
                  ? '#5E4F72'
                  : '#2D2A26',
                fontWeight: selectedOcasiao === key ? 500 : 400,
                boxShadow: selectedOcasiao === key
                  ? '0 0 0 3px rgba(196,184,233,0.15)'
                  : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* CTA Button */}
      <button
        disabled={!selectedOcasiao}
        onClick={() => {
          if (selectedOcasiao) {
            window.location.href = `/looks?ocasiao=${selectedOcasiao}&temp=${weather?.temp ?? ''}`;
          }
        }}
        className="w-full py-4 text-base font-medium transition-all active:scale-[0.98]"
        style={{
          background: selectedOcasiao ? '#5E4F72' : '#D5D0DC',
          color: selectedOcasiao ? '#FDFBF7' : '#9E97A8',
          borderRadius: '9999px',
          border: 'none',
          cursor: selectedOcasiao ? 'pointer' : 'not-allowed',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        ✦ Criar meus looks
      </button>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl p-3" style={{ background: '#FAF6EE' }}>
          <p
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#5E4F72',
            }}
          >
            {stats.pecas}
          </p>
          <p style={{ fontSize: '0.6875rem', color: '#6B6560' }}>Peças</p>
        </div>
        <div className="rounded-xl p-3" style={{ background: '#FAF6EE' }}>
          <p
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#5E4F72',
            }}
          >
            {stats.looks}
          </p>
          <p style={{ fontSize: '0.6875rem', color: '#6B6560' }}>Looks criados</p>
        </div>
        <div className="rounded-xl p-3" style={{ background: '#FAF6EE' }}>
          <p
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#5E4F72',
            }}
          >
            {stats.favoritos}
          </p>
          <p style={{ fontSize: '0.6875rem', color: '#6B6560' }}>Favoritos</p>
        </div>
      </div>
    </div>
  );
}
