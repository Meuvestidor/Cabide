// ============================================
// CLIMA DO DIA — usado pelo servidor na geração de looks
// Fonte: Open-Meteo (sem chave). Diferenças de 1–3 °C para outros serviços
// são normais (modelo de previsão vs. estação), por isso o motor de looks
// trabalha com a FAIXA do dia (próximas 12 h, sensação térmica) e tolerância,
// nunca com um número exato.
// ============================================

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

// Códigos WMO → descrição em português + slug de condição
export const WMO_CODES: Record<number, { desc: string; condition: string }> = {
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

export function descricaoClima(code: number): { desc: string; condition: string } {
  return WMO_CODES[code] || { desc: 'Indefinido', condition: 'cloud' };
}

/** Ajuste pedido pela usuária: ela está na rua e sabe melhor que a previsão. */
export type AjusteClima = -1 | 0 | 1;

/** Quanto cada passo de ajuste desloca a faixa do dia (°C). */
export const PASSO_AJUSTE = 4;

export type FaixaTermica = 'frio' | 'fresco' | 'ameno' | 'calor';

export const FAIXA_LABEL: Record<FaixaTermica, string> = {
  frio: 'Frio',
  fresco: 'Fresco',
  ameno: 'Ameno',
  calor: 'Calor',
};

export interface ClimaDia {
  /** Temperatura agora (°C), só para exibir. */
  agora: number | null;
  /** Mínima e máxima de sensação térmica nas próximas ~12 h (°C), já com o ajuste. */
  min: number;
  max: number;
  faixa: FaixaTermica;
  /** Maior probabilidade de chuva nas próximas ~12 h (0–100), se conhecida. */
  chuva: number | null;
  descricao: string;
  cidade: string | null;
  fonte: 'previsao' | 'informada';
  ajuste: AjusteClima;
}

export function faixaDe(temperatura: number): FaixaTermica {
  if (temperatura < 15) return 'frio';
  if (temperatura < 20) return 'fresco';
  if (temperatura <= 25) return 'ameno';
  return 'calor';
}

/** O dia pede uma camada que possa ser tirada? (amplitude grande ou manhã/noite fria) */
export function pedeCamada(c: ClimaDia): boolean {
  return c.max - c.min >= 8 || c.min < 15;
}

export function aplicarAjuste(c: Omit<ClimaDia, 'faixa' | 'ajuste'>, ajuste: AjusteClima): ClimaDia {
  const d = ajuste * PASSO_AJUSTE;
  const min = c.min + d;
  const max = c.max + d;
  return { ...c, min, max, faixa: faixaDe((min + max) / 2), ajuste };
}

export function normalizarAjuste(v: unknown): AjusteClima {
  return v === -1 || v === 1 ? v : 0;
}

/** Resumo curto em português para o prompt e para a interface. */
export function resumoClima(c: ClimaDia): string {
  const partes = [`${FAIXA_LABEL[c.faixa]}, ${Math.round(c.min)}–${Math.round(c.max)} °C`];
  if (c.descricao) partes.push(c.descricao.toLowerCase());
  if (c.chuva !== null && c.chuva >= 40) partes.push(`chuva ${c.chuva}%`);
  return partes.join(' · ');
}

// ------------------------------------------
// Busca (servidor)
// ------------------------------------------
interface Local {
  lat: number;
  lon: number;
  nome: string;
}

async function geocodificar(cidade: string): Promise<Local | null> {
  try {
    const nome = cidade.split(',')[0].trim();
    if (!nome) return null;
    const res = await fetch(`${GEOCODING_URL}?name=${encodeURIComponent(nome)}&count=5&language=pt&format=json`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const resultados: { latitude: number; longitude: number; name: string; country_code?: string }[] = data.results ?? [];
    if (!resultados.length) return null;
    const melhor = resultados.find((r) => r.country_code === 'BR') ?? resultados[0];
    return { lat: melhor.latitude, lon: melhor.longitude, nome: melhor.name };
  } catch {
    return null;
  }
}

interface RespostaPrevisao {
  current?: { temperature_2m?: number; weather_code?: number };
  hourly?: {
    temperature_2m?: (number | null)[];
    apparent_temperature?: (number | null)[];
    precipitation_probability?: (number | null)[];
  };
}

/** Converte a resposta da Open-Meteo em clima do dia (sem ajuste). Exportada para testes. */
export function lerPrevisao(data: RespostaPrevisao, cidade: string | null): Omit<ClimaDia, 'faixa' | 'ajuste'> | null {
  const numeros = (xs: (number | null)[] | undefined) => (xs ?? []).filter((x): x is number => typeof x === 'number');
  // Sensação térmica é o que importa para vestir; temperatura do ar como reserva.
  let horas = numeros(data.hourly?.apparent_temperature);
  if (!horas.length) horas = numeros(data.hourly?.temperature_2m);
  const agora = typeof data.current?.temperature_2m === 'number' ? data.current.temperature_2m : null;
  if (!horas.length && agora === null) return null;
  if (!horas.length) horas = [agora as number];

  const chuvas = numeros(data.hourly?.precipitation_probability);
  const code = data.current?.weather_code;
  return {
    agora: agora === null ? null : Math.round(agora),
    min: Math.min(...horas),
    max: Math.max(...horas),
    chuva: chuvas.length ? Math.max(...chuvas) : null,
    descricao: typeof code === 'number' ? descricaoClima(code).desc : '',
    cidade,
    fonte: 'previsao',
  };
}

/**
 * Clima das próximas 12 h para a cidade do perfil. Devolve null quando a cidade
 * não é encontrada ou a previsão falha — nunca um clima inventado.
 */
export async function buscarClimaDia(cidade: string, ajuste: AjusteClima = 0): Promise<ClimaDia | null> {
  const local = await geocodificar(cidade);
  if (!local) return null;
  try {
    const res = await fetch(
      `${OPEN_METEO_URL}?latitude=${local.lat}&longitude=${local.lon}` +
        '&current=temperature_2m,weather_code' +
        '&hourly=temperature_2m,apparent_temperature,precipitation_probability' +
        '&forecast_hours=12&timezone=auto',
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) return null;
    const base = lerPrevisao(await res.json(), local.nome);
    return base ? aplicarAjuste(base, ajuste) : null;
  } catch {
    return null;
  }
}

/** Reserva quando não há previsão: a temperatura que o aparelho já mostrou, com margem de ±3 °C. */
export function climaInformado(temperatura: number, descricao: string | null, ajuste: AjusteClima): ClimaDia {
  return aplicarAjuste(
    { agora: Math.round(temperatura), min: temperatura - 3, max: temperatura + 3, chuva: null, descricao: descricao ?? '', cidade: null, fonte: 'informada' },
    ajuste
  );
}
