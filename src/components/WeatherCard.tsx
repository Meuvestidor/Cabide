'use client';

import { useState, useEffect } from 'react';
import {
  Cloud,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  Sun,
  CloudSun,
  CloudLightning,
  Droplets,
  Wind,
  Thermometer,
  Loader2,
} from 'lucide-react';

interface WeatherData {
  current: {
    temp: number;
    description: string;
    humidity: number;
    wind: string;
    city: string;
  };
  tomorrow: {
    max: number;
    min: number;
    description: string;
    condition: string;
    weekday: string;
  } | null;
  source: string;
}

const CONDITION_ICONS: Record<string, React.ElementType> = {
  clear_day: Sun,
  clear_night: Sun,
  cloudly_day: CloudSun,
  cloudly_night: Cloud,
  cloud: Cloud,
  rain: CloudRain,
  storm: CloudLightning,
  snow: CloudSnow,
  hail: CloudSnow,
  fog: Cloud,
  none_day: Sun,
  none_night: Sun,
};

export function WeatherCard({
  mode = 'current',
  onWeatherLoad,
}: {
  mode?: 'current' | 'tomorrow';
  onWeatherLoad?: (data: {
    temp: number;
    max: number;
    min: number;
    condition: string;
  }) => void;
}) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch('/api/weather?city=Curitiba,PR');
        if (!res.ok) throw new Error();
        const data: WeatherData = await res.json();
        setWeather(data);

        // Callback for parent (looks engine)
        if (onWeatherLoad && data.tomorrow) {
          onWeatherLoad({
            temp: data.current.temp,
            max: data.tomorrow.max,
            min: data.tomorrow.min,
            condition: data.tomorrow.description,
          });
        }
      } catch {
        setError(true);
      }
      setLoading(false);
    }
    fetchWeather();
  }, [onWeatherLoad]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-surface border border-border p-4 flex items-center gap-3">
        <Loader2 size={20} className="animate-spin text-primary" />
        <p className="text-sm text-muted">Carregando clima...</p>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="rounded-2xl bg-surface border border-border p-4">
        <p className="text-sm text-muted">Clima indisponível</p>
      </div>
    );
  }

  const { current, tomorrow } = weather;
  const showData = mode === 'tomorrow' && tomorrow ? tomorrow : null;

  const WeatherIcon =
    showData && CONDITION_ICONS[showData.condition]
      ? CONDITION_ICONS[showData.condition]
      : CloudSun;

  return (
    <div className="rounded-2xl bg-surface border border-border p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted mb-1">
            {mode === 'tomorrow'
              ? `Amanhã · ${tomorrow?.weekday || ''}`
              : 'Agora'}{' '}
            · {current.city}
          </p>

          {mode === 'tomorrow' && tomorrow ? (
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-semibold text-foreground">
                {tomorrow.max}°
              </span>
              <span className="text-lg text-muted">/ {tomorrow.min}°</span>
            </div>
          ) : (
            <span className="text-3xl font-semibold text-foreground">
              {current.temp}°C
            </span>
          )}

          <p className="text-sm text-muted mt-1">
            {showData?.description || current.description}
          </p>
        </div>

        <WeatherIcon
          size={40}
          strokeWidth={1.2}
          className="text-primary/60"
        />
      </div>

      {/* Current extra details */}
      {mode === 'current' && (
        <div className="flex gap-4 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5">
            <Droplets size={14} className="text-muted" />
            <span className="text-xs text-muted">{current.humidity}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wind size={14} className="text-muted" />
            <span className="text-xs text-muted">{current.wind}</span>
          </div>
        </div>
      )}

      {weather.source === 'estimated' && (
        <p className="text-[10px] text-muted/60 mt-2">
          Clima estimado (API não configurada)
        </p>
      )}
    </div>
  );
}
