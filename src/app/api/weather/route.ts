import { NextRequest, NextResponse } from 'next/server';

// Open-Meteo — FREE, no API key, no registration
// https://open-meteo.com/en/docs
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

// Default coordinates (Curitiba) — fallback when no city is provided
const DEFAULT_CITY = { lat: -25.4284, lon: -49.2733, name: 'Curitiba', tz: 'America/Sao_Paulo' };

// WMO Weather codes → descriptions in Portuguese + condition slug
const WMO_CODES: Record<number, { desc: string; condition: string }> = {
  0: { desc: 'Céu limpo', condition: 'clear_day' },
  1: { desc: 'Predominantemente limpo', condition: 'clear_day' },
  2: { desc: 'Parcialmente nublado', condition: 'cloudly_day' },
  3: { desc: 'Nublado', condition: 'cloud' },
  45: { desc: 'Nevoeiro', condition: 'fog' },
  48: { desc: 'Nevoeiro com geada', condition: 'fog' },
  51: { desc: 'Chuvisco leve', condition: 'rain' },
  53: { desc: 'Chuvisco moderado', condition: 'rain' },
  55: { desc: 'Chuvisco forte', condition: 'rain' },
  61: { desc: 'Chuva leve', condition: 'rain' },
  63: { desc: 'Chuva moderada', condition: 'rain' },
  65: { desc: 'Chuva forte', condition: 'rain' },
  71: { desc: 'Neve leve', condition: 'snow' },
  73: { desc: 'Neve moderada', condition: 'snow' },
  75: { desc: 'Neve forte', condition: 'snow' },
  80: { desc: 'Pancadas de chuva leves', condition: 'rain' },
  81: { desc: 'Pancadas de chuva moderadas', condition: 'rain' },
  82: { desc: 'Pancadas de chuva fortes', condition: 'rain' },
  95: { desc: 'Tempestade', condition: 'storm' },
  96: { desc: 'Tempestade com granizo leve', condition: 'storm' },
  99: { desc: 'Tempestade com granizo forte', condition: 'storm' },
};

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function getWeatherInfo(code: number) {
  return WMO_CODES[code] || { desc: 'Indefinido', condition: 'cloud' };
}

// Geocode a city name using Open-Meteo (free, no API key)
async function geocodeCity(cityName: string): Promise<{ lat: number; lon: number; name: string; tz: string } | null> {
  try {
    // Clean the city name — remove state abbreviation if present (e.g. "Curitiba, PR" → "Curitiba")
    const cleanName = cityName.split(',')[0].trim();

    const res = await fetch(
      `${GEOCODING_URL}?name=${encodeURIComponent(cleanName)}&count=5&language=pt&format=json`,
      { next: { revalidate: 86400 } } // Cache geocoding for 24h
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;

    // Prefer results in Brazil (country_code = BR)
    const brResult = data.results.find(
      (r: { country_code?: string }) => r.country_code === 'BR'
    );
    const best = brResult || data.results[0];

    return {
      lat: best.latitude,
      lon: best.longitude,
      name: best.name,
      tz: best.timezone || 'America/Sao_Paulo',
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cityParam = searchParams.get('city');
    const latParam = searchParams.get('lat');
    const lonParam = searchParams.get('lon');

    // Resolve location: direct coordinates > city geocoding > default (Curitiba)
    let location = DEFAULT_CITY;

    if (latParam && lonParam) {
      const lat = parseFloat(latParam);
      const lon = parseFloat(lonParam);
      if (!isNaN(lat) && !isNaN(lon)) {
        location = { lat, lon, name: cityParam || 'Localização atual', tz: 'America/Sao_Paulo' };
      }
    } else if (cityParam) {
      const geocoded = await geocodeCity(cityParam);
      if (geocoded) {
        location = geocoded;
      }
      // If geocoding fails, keep default (Curitiba)
    }

    const res = await fetch(
      `${OPEN_METEO_URL}?latitude=${location.lat}&longitude=${location.lon}` +
      `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
      `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max` +
      `&timezone=${encodeURIComponent(location.tz)}` +
      `&forecast_days=3`,
      { next: { revalidate: 1800 } } // Cache 30 min
    );

    if (!res.ok) {
      throw new Error(`Open-Meteo returned ${res.status}`);
    }

    const data = await res.json();

    // Current weather
    const currentCode = data.current?.weather_code ?? 2;
    const currentInfo = getWeatherInfo(currentCode);

    // Tomorrow = daily index 1
    const tomorrowCode = data.daily?.weather_code?.[1] ?? 2;
    const tomorrowInfo = getWeatherInfo(tomorrowCode);
    const tomorrowDate = new Date(data.daily?.time?.[1] || Date.now() + 86400000);

    return NextResponse.json({
      current: {
        temp: Math.round(data.current?.temperature_2m ?? 18),
        description: currentInfo.desc,
        condition: currentInfo.condition,
        humidity: data.current?.relative_humidity_2m ?? null,
        wind: data.current?.wind_speed_10m
          ? `${Math.round(data.current.wind_speed_10m)} km/h`
          : null,
        city: location.name,
      },
      tomorrow: {
        max: Math.round(data.daily?.temperature_2m_max?.[1] ?? 22),
        min: Math.round(data.daily?.temperature_2m_min?.[1] ?? 14),
        description: tomorrowInfo.desc,
        condition: tomorrowInfo.condition,
        precipitation: data.daily?.precipitation_probability_max?.[1] ?? null,
        weekday: WEEKDAYS[tomorrowDate.getDay()],
      },
      source: 'open-meteo',
    });
  } catch (error) {
    console.error('Weather API error:', error);

    // Fallback estático para que a demo nunca falhe
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return NextResponse.json({
      current: {
        temp: 18,
        description: 'Parcialmente nublado',
        condition: 'cloudly_day',
        humidity: 72,
        wind: '12 km/h',
        city: 'Curitiba',
      },
      tomorrow: {
        max: 22,
        min: 14,
        description: 'Sol com nuvens',
        condition: 'cloudly_day',
        precipitation: 20,
        weekday: WEEKDAYS[tomorrow.getDay()],
      },
      source: 'fallback',
    });
  }
}
