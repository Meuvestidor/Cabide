// ============================================
// EMBUDO DE PEÇAS — lógica determinística antes do modelo
// Depois dos vetos (aplicarFiltrosDuros), reduz o armário às peças que
// fazem sentido para o clima, a ocasião e a formalidade de hoje e limita
// a quantidade por categoria. O modelo recebe no máximo ~25 peças em
// formato compacto, qualquer que seja o tamanho do armário: o custo por
// geração deixa de crescer com o armário.
// ============================================
import type { ClimaDia } from '@/lib/clima';
import { ESTILO_LABEL_PECA } from '@/lib/retrato';
import type { PecaEntrada, SinalPeca, AtributosDerivados } from '@/lib/perfil-looks';

// Peças que complementam o look: não passam pelos filtros de clima e reuso.
const COMPLEMENTOS = new Set(['bolsa', 'acessorio', 'joias']);
// Calçado pode repetir em dias seguidos; roupa não.
const LIVRES_DE_REUSO = new Set(['calcado', 'bolsa', 'acessorio', 'joias']);

/** Máximo de peças por categoria enviadas ao modelo (peças fixadas sempre entram). */
export const LIMITE_POR_CATEGORIA: Record<string, number> = {
  parte_de_cima: 6,
  parte_de_baixo: 5,
  vestido: 3,
  macacao: 2,
  casaco: 3,
  calcado: 4,
  bolsa: 3,
  acessorio: 3,
  joias: 3,
  esporte: 2,
  praia: 2,
  outros: 2,
  roupa_intima: 0,
};

const DIAS_SEM_REPETIR = 3;

interface Tolerancias {
  temperatura: number;
  formalidade: number;
  ocasiao: boolean;
  reuso: boolean;
}

// Nível 0 = estrito; nível 1 = relaxado (usado só quando o estrito não monta um look).
const NIVEIS: Tolerancias[] = [
  { temperatura: 3, formalidade: 1.5, ocasiao: true, reuso: true },
  { temperatura: 5, formalidade: 2, ocasiao: false, reuso: false },
];

export interface ContextoEmbudo {
  ocasiao: string;
  formalidadeAlvo: number;
  clima: ClimaDia | null;
  /** Data de hoje (AAAA-MM-DD) no fuso da usuária. */
  hoje: string;
  fixadas: string[];
}

function diasDesde(data: string | null | undefined, hoje: string): number | null {
  if (!data) return null;
  const a = Date.parse(`${data.slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${hoje}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86_400_000);
}

const naoIdentificado = (v: unknown) => typeof v === 'string' && v.trim() === '?';

/** Motivo de exclusão por contexto, ou null se a peça serve. Exportada para testes. */
export function motivoContexto(p: PecaEntrada, ctx: ContextoEmbudo, t: Tolerancias): string | null {
  if (p.disponivel === false) return 'indisponível';
  // Dúvidas em campos que o look depende: a peça espera a usuária confirmar.
  if (naoIdentificado(p.categoria) || naoIdentificado(p.cor) || naoIdentificado(p.subcategoria)) return 'ficha a confirmar';

  const complemento = COMPLEMENTOS.has(p.categoria);

  if (ctx.clima && !complemento) {
    const pmin = typeof p.temperatura_min === 'number' ? p.temperatura_min : null;
    const pmax = typeof p.temperatura_max === 'number' ? p.temperatura_max : null;
    // Faixas sobrepostas (com tolerância): a peça serve em parte do dia.
    if (pmin !== null && pmax !== null && pmax >= pmin) {
      if (pmax < ctx.clima.min - t.temperatura || pmin > ctx.clima.max + t.temperatura) return 'clima';
    }
  }

  if (typeof p.formalidade === 'number' && p.formalidade > 0) {
    const tol = complemento ? t.formalidade + 0.5 : t.formalidade;
    if (Math.abs(p.formalidade - ctx.formalidadeAlvo) > tol) return 'formalidade';
  }

  if (t.ocasiao && !complemento && Array.isArray(p.ocasioes) && p.ocasioes.length > 0 && !p.ocasioes.includes(ctx.ocasiao)) {
    return 'ocasião';
  }

  if (t.reuso && !LIVRES_DE_REUSO.has(p.categoria)) {
    const d = diasDesde(p.ultima_utilizacao, ctx.hoje);
    if (d !== null && d >= 0 && d < DIAS_SEM_REPETIR) return 'usada recentemente';
  }
  return null;
}

/** Dá para montar ao menos um look? (calçado + [cima e baixo] ou peça inteira) */
export function montaUmLook(pecas: PecaEntrada[]): boolean {
  const tem = (c: string) => pecas.some((p) => p.categoria === c);
  return tem('calcado') && ((tem('parte_de_cima') && tem('parte_de_baixo')) || tem('vestido') || tem('macacao'));
}

export interface ResultadoEmbudo {
  candidatas: PecaEntrada[];
  /** 0 = estrito, 1 = relaxado, 2 = sem filtro de contexto (armário curto). */
  nivel: 0 | 1 | 2;
}

/**
 * Filtra por contexto em níveis. Se nem o nível relaxado monta um look,
 * devolve as peças aptas sem filtro de contexto (o modelo faz o possível).
 * Peças fixadas pela usuária sempre passam.
 */
export function filtrarPorContexto(aptas: PecaEntrada[], ctx: ContextoEmbudo): ResultadoEmbudo {
  const fixadas = new Set(ctx.fixadas);
  for (let nivel = 0; nivel < NIVEIS.length; nivel++) {
    const candidatas = aptas.filter((p) => fixadas.has(p.id) || motivoContexto(p, ctx, NIVEIS[nivel]) === null);
    if (montaUmLook(candidatas)) return { candidatas, nivel: nivel as 0 | 1 };
  }
  return { candidatas: aptas, nivel: 2 };
}

// ------------------------------------------
// Pontuação e limite por categoria
// ------------------------------------------
const PESO_SINAL: Partial<Record<SinalPeca, number>> = {
  ancora: 5,
  peca_querida: 3,
  confianca: 2,
  redescobrir: 2,
  penalizada_feedback: -3,
  penalidade_salto_alto: -2,
  penalidade_rigida: -2,
  penalidade_caimento: -2,
  possible_caimento_pequeno: -1,
  possible_caimento_amplo: -1,
  possible_numeracao_diferente: -1,
};

export function pontuar(p: PecaEntrada, sinais: SinalPeca[], ctx: ContextoEmbudo): number {
  let s = 0;
  for (const sinal of sinais) s += PESO_SINAL[sinal] ?? 0;
  if (Array.isArray(p.ocasioes) && p.ocasioes.includes(ctx.ocasiao)) s += 1;
  if (typeof p.formalidade === 'number' && p.formalidade > 0) s -= Math.abs(p.formalidade - ctx.formalidadeAlvo) * 0.5;
  return s;
}

/**
 * Mantém as melhores peças de cada categoria até o limite. Peças fixadas entram
 * sempre e não ocupam vaga. Ordem determinística (pontuação, depois id).
 */
export function limitarPorCategoria(
  pecas: PecaEntrada[],
  sinaisPorPeca: Map<string, SinalPeca[]>,
  ctx: ContextoEmbudo
): PecaEntrada[] {
  const fixadas = new Set(ctx.fixadas);
  const porCategoria = new Map<string, PecaEntrada[]>();
  for (const p of pecas) {
    const l = porCategoria.get(p.categoria) ?? [];
    l.push(p);
    porCategoria.set(p.categoria, l);
  }
  const out: PecaEntrada[] = [];
  for (const [categoria, lista] of porCategoria) {
    const limite = LIMITE_POR_CATEGORIA[categoria] ?? 2;
    const pontos = new Map(lista.map((p) => [p.id, pontuar(p, sinaisPorPeca.get(p.id) ?? [], ctx)]));
    const ordenadas = [...lista].sort((a, b) => (pontos.get(b.id)! - pontos.get(a.id)!) || a.id.localeCompare(b.id));
    out.push(...ordenadas.filter((p) => fixadas.has(p.id)));
    out.push(...ordenadas.filter((p) => !fixadas.has(p.id)).slice(0, limite));
  }
  return out;
}

// ------------------------------------------
// Formato compacto: uma linha por peça, IDs curtos
// ------------------------------------------
export const LEGENDA_PECAS = 'id|nome|categoria/subcategoria|cor|formalidade|protagonismo|estilos|material|estampa|caimento|comprimento|como_me_queda|sinais';

function limpar(v: unknown): string {
  if (v === null || v === undefined) return '-';
  const s = String(v).replace(/[|\n\r]+/g, ' ').trim();
  return s && s !== '?' ? s : '-';
}

export interface PecasCompactas {
  texto: string;
  /** id curto (p1…) → id real (uuid) */
  paraReal: Map<string, string>;
  /** id real → id curto */
  paraCurto: Map<string, string>;
}

export function compactarPecas(
  pecas: PecaEntrada[],
  atributos: Map<string, AtributosDerivados>,
  sinais: Map<string, SinalPeca[]>
): PecasCompactas {
  const paraReal = new Map<string, string>();
  const paraCurto = new Map<string, string>();
  const linhas = pecas.map((p, i) => {
    const curto = `p${i + 1}`;
    paraReal.set(curto, p.id);
    paraCurto.set(p.id, curto);
    const a = atributos.get(p.id);
    const estilos = a && a.estilos.length ? a.estilos.map((e) => ESTILO_LABEL_PECA[e]).join(', ') : (p.estilos ?? []).join(', ');
    const s = sinais.get(p.id) ?? [];
    return [
      curto,
      limpar(p.nome),
      `${limpar(p.categoria)}/${limpar(p.subcategoria)}`,
      limpar(p.cor),
      limpar(p.formalidade),
      limpar(p.protagonismo),
      limpar(estilos),
      limpar(p.material),
      limpar(a?.estampa),
      limpar(a?.caimento),
      limpar(p.comprimento),
      limpar(p.como_me_queda),
      s.length ? s.join(',') : '-',
    ].join('|');
  });
  return { texto: linhas.join('\n'), paraReal, paraCurto };
}

/** Formalidade do look calculada pelas peças principais (sem bolsa, acessório e joias). */
export function formalidadeDoLook(ids: string[], pecas: Map<string, PecaEntrada>, padrao: number): number {
  const valores = ids
    .map((id) => pecas.get(id))
    .filter((p): p is PecaEntrada => !!p && !COMPLEMENTOS.has(p.categoria) && typeof p.formalidade === 'number' && p.formalidade > 0)
    .map((p) => p.formalidade as number);
  if (!valores.length) return padrao;
  return Math.round(valores.reduce((a, b) => a + b, 0) / valores.length);
}
