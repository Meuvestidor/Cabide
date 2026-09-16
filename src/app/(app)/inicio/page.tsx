'use client';

import { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, Wind, Loader2 } from 'lucide-react';
import { OCASIOES } from '@/lib/constants';

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
      <header className="mb-8">
        <h1 className="text-3xl text-foreground leading-tight">
          Meu Vestidor
        </h1>
        <p className="text-muted mt-1 text-sm">
          Sua estilista pessoal com IA
        </p>
      </header>

      {/* Weather Card */}
      <div className="rounded-2xl bg-surface border border-border p-4 mb-6">
        {loadingWeather ? (
          <div className="flex items-center gap-2 text-muted">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Carregando clima...</span>
          </div>
        ) : weather ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-alt flex items-center justify-center text-primary">
                <WeatherIcon description={weather.description} />
              </div>
              <div>
                <p className="font-semibold text-lg">{weather.temp}°C</p>
                <p className="text-muted text-sm">{weather.city_name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-foreground">{weather.description}</p>
              {weather.humidity && (
                <p className="text-xs text-muted flex items-center gap-1 justify-end">
                  <Wind size={12} /> {weather.wind_speedy}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">Clima indisponível</p>
        )}
      </div>

      {/* Main Question */}
      <section className="mb-6">
        <h2 className="text-xl text-foreground mb-4">
          O que você vai fazer hoje?
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {Object.entries(OCASIOES).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedOcasiao(
                selectedOcasiao === key ? null : key
              )}
              className={`rounded-xl border p-3 text-left text-sm transition-all ${
                selectedOcasiao === key
                  ? 'border-primary bg-primary/5 text-primary font-medium'
                  : 'border-border bg-surface text-foreground hover:border-primary/40'
              }`}
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
        className="w-full py-4 rounded-2xl text-base font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-primary text-white hover:bg-primary-hover active:scale-[0.98]"
      >
        Criar meus looks
      </button>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-surface-alt p-3">
          <p className="text-lg font-semibold text-foreground">—</p>
          <p className="text-xs text-muted">Peças</p>
        </div>
        <div className="rounded-xl bg-surface-alt p-3">
          <p className="text-lg font-semibold text-foreground">—</p>
          <p className="text-xs text-muted">Looks criados</p>
        </div>
        <div className="rounded-xl bg-surface-alt p-3">
          <p className="text-lg font-semibold text-foreground">—</p>
          <p className="text-xs text-muted">Favoritos</p>
        </div>
      </div>
    </div>
  );
}