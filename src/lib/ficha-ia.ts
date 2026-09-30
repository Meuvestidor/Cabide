// ============================================
// pecas.ficha_ia (coluna TEXT com JSON serializado)
// Hoje: escrita uma vez no insert do armário via JSON.stringify(catalogResult).
// Regra: merge compatível — nunca apagar nem sobrescrever atributos existentes.
// ============================================

export type EstampaPeca = 'lisa' | 'discreta' | 'chamativa';
export type SaltoPeca = 'sem' | 'baixo' | 'medio' | 'alto';
export type CaimentoPeca = 'ajustado' | 'reto' | 'amplo';
export type DetalhePeca = 'decote_profundo' | 'transparencia' | 'cropped' | 'amassa_facil' | 'expoe_pele' | 'curta';

/** Atributos estruturados adicionados ao catálogo (somente com evidência visual). */
export interface AtributosFicha {
  estampa?: EstampaPeca | null;
  salto?: SaltoPeca | null;
  caimento?: CaimentoPeca | null;
  detalhes?: DetalhePeca[];
}

const ESTAMPAS: EstampaPeca[] = ['lisa', 'discreta', 'chamativa'];
const SALTOS: SaltoPeca[] = ['sem', 'baixo', 'medio', 'alto'];
const CAIMENTOS: CaimentoPeca[] = ['ajustado', 'reto', 'amplo'];
const DETALHES: DetalhePeca[] = ['decote_profundo', 'transparencia', 'cropped', 'amassa_facil', 'expoe_pele', 'curta'];

/** Lê ficha_ia com segurança; texto nulo ou inválido => {} (sem tocar no valor salvo). */
export function parseFichaIa(texto: string | null | undefined): Record<string, unknown> {
  if (!texto) return {};
  try {
    const v = JSON.parse(texto);
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** Normaliza os atributos novos vindos do catálogo: valores fora do domínio viram null. */
export function sanitizarAtributos(bruto: Record<string, unknown>): AtributosFicha {
  const out: AtributosFicha = {};
  if (typeof bruto.estampa === 'string' && ESTAMPAS.includes(bruto.estampa as EstampaPeca)) out.estampa = bruto.estampa as EstampaPeca;
  if (typeof bruto.salto === 'string' && SALTOS.includes(bruto.salto as SaltoPeca)) out.salto = bruto.salto as SaltoPeca;
  if (typeof bruto.caimento === 'string' && CAIMENTOS.includes(bruto.caimento as CaimentoPeca)) out.caimento = bruto.caimento as CaimentoPeca;
  if (Array.isArray(bruto.detalhes)) {
    const d = bruto.detalhes.filter((x): x is DetalhePeca => typeof x === 'string' && DETALHES.includes(x as DetalhePeca));
    if (d.length) out.detalhes = Array.from(new Set(d));
  }
  return out;
}

/** Atributos estruturados já presentes em uma ficha salva. */
export function atributosDaFicha(texto: string | null | undefined): AtributosFicha {
  return sanitizarAtributos(parseFichaIa(texto));
}

/**
 * Merge compatível: parte do conteúdo existente e só ADICIONA chaves novas
 * (ou preenche as que estão nulas/ausentes). Nunca remove nem sobrescreve.
 * Se o texto existente não for JSON válido, devolve-o intacto.
 */
export function mergeFichaIa(existente: string | null | undefined, novos: Record<string, unknown>): string {
  let base: Record<string, unknown> = {};
  if (existente) {
    try {
      const v = JSON.parse(existente);
      if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('ficha_ia não é um objeto');
      base = v as Record<string, unknown>;
    } catch (e) {
      console.error('[ficha_ia] Conteúdo existente não é JSON válido; mantido sem alterações.', e);
      return existente;
    }
  }
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(novos)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v) && v.length === 0 && k in out) continue;
    if (!(k in out) || out[k] === null || out[k] === undefined) out[k] = v;
  }
  return JSON.stringify(out);
}

/** Tamanho lido da etiqueta: string não vazia e diferente de "?"; caso contrário null. */
export function sanitizarTamanho(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const t = valor.trim();
  if (!t || t === '?' || /^(null|n\/a|desconhecido|não visível)$/i.test(t)) return null;
  return t.slice(0, 12);
}
