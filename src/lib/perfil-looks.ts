// ============================================
// PERSONALIZAÇÃO DE LOOKS — lógica determinística (sem ML)
// Camada A: filtros duros (antes do modelo)       -> aplicarFiltrosDuros
// Camada B: preferências (regras explícitas)      -> buildPerfilRules
// Camada C: dor principal                          -> buildPerfilRules
// Sinais por peça: caimento/tamanho e comportamento -> sinaisDeCaimento, sinaisDeComportamento
// ============================================
import type { Estilo, Ocasiao, PerfilEstilo, Veto } from '@/types/database';
import type { AtributosFicha, CaimentoPeca, DetalhePeca, EstampaPeca, SaltoPeca } from '@/lib/ficha-ia';
import {
  CAIMENTO_BAIXO,
  CAIMENTO_CIMA,
  COMPRIMENTOS,
  CONTEXTOS_MOVIMENTO,
  CORES_VETO,
  ESTILO_LABEL_PECA,
  INTENCOES,
  PALETAS,
  SENTIMENTOS,
  VETOS,
  contextoLabel,
  labelOf,
  normalizeEstilo,
} from '@/lib/retrato';

// ------------------------------------------
// Tipos
// ------------------------------------------
export interface PecaEntrada {
  id: string;
  nome: string;
  categoria: string;
  subcategoria?: string | null;
  cor?: string | null;
  formalidade?: number;
  protagonismo?: number;
  temporadas?: string[];
  temperatura_min?: number;
  temperatura_max?: number;
  ocasioes?: string[];
  estilos?: string[] | null;
  estado?: string | null;
  comprimento?: string | null;
  material?: string | null;
  disponivel?: boolean;
  vezes_usada?: number;
  ultima_utilizacao?: string | null;
  tamanho?: string | null;
  como_me_queda?: string | null;
  atributos?: AtributosFicha;
}

export type SinalPeca =
  | 'possible_caimento_pequeno'
  | 'possible_caimento_amplo'
  | 'possible_numeracao_diferente'
  | 'penalidade_caimento'
  | 'penalidade_salto_alto'
  | 'penalidade_rigida'
  | 'penalizada_feedback'
  | 'peca_querida'
  | 'confianca'
  | 'redescobrir'
  | 'ancora';

export interface AtributosDerivados {
  estampa: EstampaPeca | null;
  salto: SaltoPeca | null;
  caimento: CaimentoPeca | null;
  detalhes: DetalhePeca[];
  rigida: boolean;
  estilos: Estilo[];
}

export interface Excluida {
  id: string;
  nome: string;
  motivo: string;
}

// ------------------------------------------
// Utilidades de texto
// ------------------------------------------
function norm(s: string | null | undefined): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function textoDaPeca(p: PecaEntrada): string {
  return norm(`${p.nome} ${p.subcategoria ?? ''} ${p.comprimento ?? ''} ${p.material ?? ''}`);
}

// ------------------------------------------
// Atributos da peça: ficha_ia (quando existe) + heurística documentada
// A heurística só é usada quando a ficha não traz o atributo (peças antigas).
// Em dúvida, é conservadora a favor dos limites da usuária.
// ------------------------------------------
const RE_SALTO_ALTO = /scarpin|stiletto|salto alto|salto fino|salto agulha|meia pata|plataforma alta/;
const RE_SALTO_MEDIO = /salto medio|kitten|salto bloco|salto grosso|anabela/;
const RE_SEM_SALTO = /rasteir|tenis|sapatilha|mocassim|oxford|chinelo|slide|flat|loafer|papete|bota sem salto|coturno/;
const RE_ESTAMPA_CHAMATIVA = /animal print|oncinha|zebra|tropical|tie dye|neon|floral|estampa grande|psicodel|geometric/;
const RE_ESTAMPA_DISCRETA = /listrad|xadrez|poa|risca|quadriculad|micro ?estampa|estampad|print|pied de poule|jacquard/;
const RE_AJUSTADO = /justa|justo|colad|skinny|bodycon|slim|ajustad|legging|segunda pele/;
const RE_AMPLO = /oversize|ampl|pantalona|wide|fluid|solt|boyfriend|mom jeans|balone|evase|pijama/;
const RE_RETO = /\breta\b|\breto\b|straight|alfaiataria reta/;
const RE_RIGIDA = /estruturad|corset|espartilho|rigid|couro duro/;

function detalhesHeuristicos(p: PecaEntrada, t: string): DetalhePeca[] {
  const d = new Set<DetalhePeca>();
  if (/cropped/.test(t)) d.add('cropped');
  if (/transparen|\btule\b|voil|telinha|mesh/.test(t)) d.add('transparencia');
  if (/decote profundo|decote v profundo|decote em v profundo|plunge/.test(t)) d.add('decote_profundo');
  if (/tomara que caia|frente unica|costas nuas|costas abertas|fenda|cut ?out|ombro a ombro|ciganinha|biquini|cavad/.test(t))
    d.add('expoe_pele');
  const comp = norm(p.comprimento);
  if (
    ['parte_de_baixo', 'vestido', 'macacao'].includes(p.categoria) &&
    (comp === 'curto' || comp === 'mini' || /\bmini\b|\bcurt[ao]\b/.test(t))
  )
    d.add('curta');
  if (/linho|linen/.test(norm(p.material)) || /linho/.test(t)) d.add('amassa_facil');
  return Array.from(d);
}

export function atributosDaPeca(p: PecaEntrada): AtributosDerivados {
  const t = textoDaPeca(p);
  const a = p.atributos ?? {};

  let salto: SaltoPeca | null = a.salto ?? null;
  if (!salto && p.categoria === 'calcado') {
    if (RE_SALTO_ALTO.test(t)) salto = 'alto';
    else if (RE_SALTO_MEDIO.test(t)) salto = 'medio';
    else if (RE_SEM_SALTO.test(t)) salto = 'sem';
    else if (/\bsalto\b/.test(t)) salto = 'alto'; // "salto" sem qualificação: conservador
  }

  let estampa: EstampaPeca | null = a.estampa ?? null;
  if (!estampa) {
    if (RE_ESTAMPA_CHAMATIVA.test(t)) estampa = 'chamativa';
    else if (RE_ESTAMPA_DISCRETA.test(t)) estampa = 'discreta';
  }

  let caimento: CaimentoPeca | null = a.caimento ?? null;
  if (!caimento) {
    if (RE_AJUSTADO.test(t)) caimento = 'ajustado';
    else if (RE_AMPLO.test(t)) caimento = 'amplo';
    else if (RE_RETO.test(t)) caimento = 'reto';
  }

  const detalhes = Array.from(new Set([...(a.detalhes ?? []), ...detalhesHeuristicos(p, t)]));

  const estilos = Array.from(
    new Set((p.estilos ?? []).map((e) => normalizeEstilo(e)).filter((e): e is Estilo => !!e))
  );

  return { estampa, salto, caimento, detalhes, rigida: RE_RIGIDA.test(t), estilos };
}

// ------------------------------------------
// Cores
// ------------------------------------------
const SINONIMOS_COR: Record<string, string[]> = {
  preto: ['preto', 'preta', 'black', 'onix'],
  branco: ['branco', 'branca', 'off white', 'offwhite', 'off-white'],
  cinza: ['cinza', 'grafite', 'chumbo', 'mescla'],
  bege: ['bege', 'nude', 'areia', 'camel', 'caqui', 'khaki'],
  marrom: ['marrom', 'caramelo', 'chocolate', 'cafe', 'tabaco', 'conhaque'],
  vermelho: ['vermelho', 'vermelha', 'carmim', 'cereja', 'escarlate'],
  vinho: ['vinho', 'bordo', 'marsala', 'burgundy'],
  rosa: ['rosa', 'pink', 'rose', 'fucsia', 'magenta'],
  laranja: ['laranja', 'terracota', 'ferrugem', 'tangerina'],
  amarelo: ['amarelo', 'amarela', 'mostarda', 'ouro'],
  verde: ['verde', 'oliva', 'militar', 'menta', 'esmeralda', 'musgo'],
  azul: ['azul', 'marinho', 'royal', 'celeste', 'turquesa', 'anil'],
  roxo: ['roxo', 'roxa', 'lilas', 'violeta', 'lavanda', 'uva', 'berinjela'],
};

function termosCor(veto: string): string[] {
  const v = norm(veto).trim();
  return SINONIMOS_COR[v] ?? [v];
}

const STOPWORDS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'com', 'sem', 'que', 'para', 'muito', 'muita', 'peca', 'pecas',
  'roupa', 'roupas', 'nada', 'nenhum', 'nenhuma', 'tipo', 'tipos', 'uso', 'usar', 'nunca', 'gosto', 'nao', 'e', 'ou',
]);

/** Termos significativos de um texto livre ("Outra"). */
function termosLivres(texto: string | undefined): string[] {
  return norm(texto)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
}

// ------------------------------------------
// CAMADA A — Filtros duros
// Vetos NUNCA são violados, nem no OUSADO, nem por peças fixadas.
// ------------------------------------------
function motivoVeto(v: Veto, p: PecaEntrada, a: AtributosDerivados, t: string): boolean {
  switch (v) {
    case 'salto_alto':
      return a.salto === 'alto';
    case 'saia_curta':
      return /\bsaia/.test(t) && a.detalhes.includes('curta');
    case 'decote_profundo':
      return a.detalhes.includes('decote_profundo');
    case 'muito_justa':
      return (
        p.como_me_queda === 'apertada' ||
        p.como_me_queda === 'justa' ||
        /colad|bodycon|segunda pele/.test(t)
      );
    case 'transparencia':
      return a.detalhes.includes('transparencia');
    case 'cropped':
      return a.detalhes.includes('cropped');
    case 'amassa_facil':
      return a.detalhes.includes('amassa_facil');
    case 'estampa_chamativa':
      return a.estampa === 'chamativa';
    case 'expoe_corpo':
      return ['expoe_pele', 'decote_profundo', 'cropped', 'transparencia', 'curta'].some((d) =>
        a.detalhes.includes(d as DetalhePeca)
      );
    default:
      return false;
  }
}

export function aplicarFiltrosDuros(
  pecas: PecaEntrada[],
  perfil: PerfilEstilo | null,
  fixadas: string[] = []
): { aptas: PecaEntrada[]; excluidas: Excluida[]; fixadas: string[]; avisos: string[] } {
  if (!perfil) return { aptas: pecas, excluidas: [], fixadas, avisos: [] };
  const r = perfil.respostas;
  const vetos = r.vetos ?? [];
  const termosOutra = termosLivres(r.vetos_outra);
  const coresVeto = [...(r.cores_veto ?? []), ...termosLivres(r.cores_veto_outra)];
  const conforto = r.conforto ?? 0;

  const aptas: PecaEntrada[] = [];
  const excluidas: Excluida[] = [];

  for (const p of pecas) {
    const a = atributosDaPeca(p);
    const t = textoDaPeca(p);
    let motivo: string | null = null;

    const veto = vetos.find((v) => motivoVeto(v, p, a, t));
    if (veto) motivo = `limite: ${labelOf(VETOS, veto)}`;

    if (!motivo && termosOutra.length) {
      const termo = termosOutra.find((w) => t.includes(w));
      if (termo) motivo = `limite: ${r.vetos_outra}`;
    }

    if (!motivo && coresVeto.length) {
      const cor = norm(p.cor);
      const hit = coresVeto.find((c) => termosCor(c).some((x) => cor.includes(x)));
      if (hit) motivo = `cor evitada: ${CORES_VETO.find((c) => c.value === hit)?.label ?? hit}`;
    }

    // Conforto alto: peça apertada é incompatível
    if (!motivo && conforto >= 4 && p.como_me_queda === 'apertada') motivo = 'conforto: peça apertada';

    if (motivo) excluidas.push({ id: p.id, nome: p.nome, motivo });
    else aptas.push(p);
  }

  const idsExcluidos = new Set(excluidas.map((e) => e.id));
  const fixadasValidas = fixadas.filter((id) => !idsExcluidos.has(id));
  const avisos = fixadas
    .filter((id) => idsExcluidos.has(id))
    .map((id) => {
      const nome = excluidas.find((e) => e.id === id)?.nome ?? 'Uma peça fixada';
      return `“${nome}” ficou de fora porque vai contra um limite que você definiu no seu perfil.`;
    });

  return { aptas, excluidas, fixadas: fixadasValidas, avisos };
}

// ------------------------------------------
// Formalidade dinâmica
// ------------------------------------------
const OCASIOES_PROFISSIONAIS: Ocasiao[] = ['trabalho', 'reuniao', 'encontro'];

export function formalidadeAlvo(ocasiao: string, perfil: PerfilEstilo | null, padrao = 3): number {
  const f = perfil?.respostas.formalidade_trabalho;
  if (perfil && OCASIOES_PROFISSIONAIS.includes(ocasiao as Ocasiao) && typeof f === 'number') return f;
  return padrao;
}

// ------------------------------------------
// Tamanho → sinal suave de caimento (nunca filtro, nunca exclusão)
// Só compara sistemas compatíveis; nunca converte sistemas diferentes.
// ------------------------------------------
const ESCALA_LETRAS = ['PP', 'P', 'M', 'G', 'GG', 'XG'];

type TamanhoLido = { sistema: 'letra'; indice: number } | { sistema: 'numero'; valor: number } | null;

function lerTamanho(v: string | null | undefined): TamanhoLido {
  const t = (v ?? '').trim().toUpperCase();
  if (!t) return null;
  const i = ESCALA_LETRAS.indexOf(t);
  if (i >= 0) return { sistema: 'letra', indice: i };
  if (/^\d{2}$/.test(t)) return { sistema: 'numero', valor: Number(t) };
  return null; // U, único, S/M/L internacional, faixas etc.: não comparável
}

function regiao(categoria: string): 'cima' | 'baixo' | 'inteira' | null {
  if (categoria === 'parte_de_cima' || categoria === 'casaco') return 'cima';
  if (categoria === 'parte_de_baixo') return 'baixo';
  if (categoria === 'vestido' || categoria === 'macacao') return 'inteira';
  return null;
}

export function sinaisDeCaimento(p: PecaEntrada, perfil: PerfilEstilo | null): SinalPeca[] {
  if (!perfil?.medidas) return [];
  if (p.como_me_queda) return []; // a percepção real da usuária tem prioridade sobre o tamanho

  const med = perfil.medidas;
  const peca = lerTamanho(p.tamanho);
  if (!peca) return [];

  if (p.categoria === 'calcado') {
    const pe = lerTamanho(med.tamanho_calcado);
    if (pe?.sistema === 'numero' && peca.sistema === 'numero' && pe.valor !== peca.valor) {
      return ['possible_numeracao_diferente'];
    }
    return [];
  }

  const reg = regiao(p.categoria);
  if (!reg) return [];
  const usuaria = lerTamanho(med.tamanho_roupa);
  if (!usuaria || usuaria.sistema !== peca.sistema) return [];

  const diff =
    peca.sistema === 'letra' && usuaria.sistema === 'letra'
      ? peca.indice - usuaria.indice
      : peca.sistema === 'numero' && usuaria.sistema === 'numero'
      ? peca.valor - usuaria.valor
      : 0;
  if (diff === 0) return [];
  if (diff < 0) return ['possible_caimento_pequeno'];

  const s = perfil.respostas.silhueta ?? {};
  const prefereAjustado =
    (reg === 'cima' && s.cima === 'ajustada') ||
    (reg === 'baixo' && s.baixo === 'justa') ||
    (reg === 'inteira' && (s.cima === 'ajustada' || s.baixo === 'justa'));
  return prefereAjustado ? ['possible_caimento_amplo', 'penalidade_caimento'] : ['possible_caimento_amplo'];
}

// ------------------------------------------
// Aprendizado comportamental — regras determinísticas
// ------------------------------------------
export interface LookHistorico {
  id: string;
  tipo: string;
  pecas: string[] | null;
  decisao: string | null;
  grupo_id: string | null;
  created_at?: string | null;
}

export interface RegistroUsoHistorico {
  pecas: string[] | null;
  como_me_senti: string | null;
}

export interface SinaisComportamento {
  porPeca: Map<string, SinalPeca[]>;
  estilosEmBaixa: Estilo[];
  paresEvitar: [string, string][];
}

export function sinaisDeComportamento(
  looks: LookHistorico[],
  registros: RegistroUsoHistorico[],
  pecas: PecaEntrada[]
): SinaisComportamento {
  const porPeca = new Map<string, SinalPeca[]>();
  const add = (id: string, s: SinalPeca) => {
    const l = porPeca.get(id) ?? [];
    if (!l.includes(s)) l.push(s);
    porPeca.set(id, l);
  };
  const estilosDaPeca = new Map(pecas.map((p) => [p.id, atributosDaPeca(p).estilos]));

  // Deduplica decisões repetidas do mesmo look (grupo_id + tipo), mantendo a mais recente
  const ordenados = [...looks].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
  const vistos = new Set<string>();
  const unicos: LookHistorico[] = [];
  for (const l of ordenados) {
    const chave = l.grupo_id ? `${l.grupo_id}:${l.tipo}` : l.id;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    unicos.push(l);
  }

  const rejeitados = unicos.filter((l) => l.decisao === 'nao_gostei');
  const usados = unicos.filter((l) => l.decisao === 'usei');

  // Estilo em baixa: presente em >= 3 "não gostei" e mais rejeitado do que usado
  const contar = (lista: LookHistorico[]) => {
    const c = new Map<Estilo, number>();
    for (const l of lista) {
      const est = new Set<Estilo>();
      for (const pid of l.pecas ?? []) for (const e of estilosDaPeca.get(pid) ?? []) est.add(e);
      for (const e of est) c.set(e, (c.get(e) ?? 0) + 1);
    }
    return c;
  };
  const rej = contar(rejeitados);
  const uso = contar(usados);
  const estilosEmBaixa = Array.from(rej.entries())
    .filter(([e, n]) => n >= 3 && n > (uso.get(e) ?? 0))
    .map(([e]) => e);

  // Peça em >= 2 looks rejeitados → penalizada; par em >= 2 rejeições → evitar combinar
  const rejPeca = new Map<string, number>();
  const rejPar = new Map<string, number>();
  for (const l of rejeitados) {
    const ids = Array.from(new Set(l.pecas ?? [])).sort();
    for (const id of ids) rejPeca.set(id, (rejPeca.get(id) ?? 0) + 1);
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++) {
        const k = `${ids[i]}|${ids[j]}`;
        rejPar.set(k, (rejPar.get(k) ?? 0) + 1);
      }
  }
  for (const [id, n] of rejPeca) if (n >= 2) add(id, 'penalizada_feedback');
  const paresEvitar = Array.from(rejPar.entries())
    .filter(([, n]) => n >= 2)
    .map(([k]) => k.split('|') as [string, string]);

  // "Amei" → peça querida
  for (const r of registros) {
    if (r.como_me_senti === 'amei') for (const id of r.pecas ?? []) add(id, 'peca_querida');
  }

  // Top 20% por vezes_usada → peças de confiança (ESSENCIAL)
  const usadas = pecas.filter((p) => (p.vezes_usada ?? 0) > 0).sort((a, b) => (b.vezes_usada ?? 0) - (a.vezes_usada ?? 0));
  const topN = Math.ceil(usadas.length * 0.2);
  for (const p of usadas.slice(0, topN)) add(p.id, 'confianca');

  // Pouco usadas → candidatas à redescoberta
  for (const p of pecas) {
    if ((p.vezes_usada ?? 0) <= 1 && !(porPeca.get(p.id) ?? []).includes('penalizada_feedback')) add(p.id, 'redescobrir');
  }

  return { porPeca, estilosEmBaixa, paresEvitar };
}

// ------------------------------------------
// Sinais consolidados por peça (enviados ao modelo)
// ------------------------------------------
export function sinaisDaPeca(
  p: PecaEntrada,
  perfil: PerfilEstilo | null,
  comportamento: SinaisComportamento | null
): SinalPeca[] {
  const out = new Set<SinalPeca>();
  if (perfil) {
    const a = atributosDaPeca(p);
    if ((perfil.respostas.conforto ?? 0) >= 4) {
      if (a.salto === 'alto') out.add('penalidade_salto_alto');
      if (a.rigida) out.add('penalidade_rigida');
    }
    for (const s of sinaisDeCaimento(p, perfil)) out.add(s);
    if (perfil.respostas.pecas_ancora?.includes(p.id)) out.add('ancora');
  }
  for (const s of comportamento?.porPeca.get(p.id) ?? []) out.add(s);
  return Array.from(out);
}

// ------------------------------------------
// CAMADAS B e C — regras explícitas para o prompt
// ------------------------------------------
const INTENCAO_REGRAS: Record<string, string> = {
  autoridade: 'estrutura, tons profundos e, quando possível, uma peça de alfaiataria; linhas limpas',
  proximidade: 'texturas suaves, tons mais acolhedores e menor rigidez; nada que pareça distante ou excessivamente formal',
  criatividade: 'permita uma peça protagonista e combinações menos convencionais, com intenção',
  elegancia_discreta: 'baixo excesso visual, tonalidades coordenadas e protagonismo controlado (sem peça protagonista 5)',
  energia_presenca: 'um ponto de cor ou uma peça de presença, com contraste bem dosado',
  tranquilidade_leveza: 'tecidos fluidos, tons claros ou suaves e poucas camadas',
  personalidade: 'um elemento de assinatura (acessório ou peça marcante) coerente com o estilo dela',
  sofisticacao: 'acabamento refinado, materiais nobres, tom sobre tom e acessórios precisos',
};

const DOR_REGRAS: Record<string, string> = {
  repito_pecas:
    'Ela sente que repete sempre as mesmas peças: priorize peças marcadas "redescobrir" (pouco usadas) e evite repetir peças de confiança em mais de um look.',
  muitas_roupas_poucas_opcoes:
    'Ela sente que tem muitas roupas e poucas opções: maximize a variedade — nenhuma peça repetida entre os 3 looks e combinações que ela provavelmente ainda não fez.',
  dificuldade_combinar:
    'Ela tem dificuldade em combinar: em "por_que_funciona", seja didática em 3 a 4 frases curtas — harmonia de cor, proporção entre as peças, por que a combinação funciona e por que é adequada à ocasião.',
  adequacao_ocasiao:
    'Ela não sabe o que é adequado para cada ocasião: em "por_que_funciona", explique por que o look é adequado à ocasião (formalidade e códigos da ocasião).',
  perco_tempo:
    'Ela perde muito tempo decidindo: ESSENCIAL deve ser uma recomendação pronta para vestir agora; explicações curtas e objetivas (1 a 2 frases).',
  gosto_mas_nao_uso:
    'Ela tem roupas de que gosta mas quase não usa: priorize descobrir combinações para as peças marcadas "redescobrir" que conversam com o estilo dela.',
  sei_o_que_quero:
    'Ela sabe o que quer vestir: respeite fortemente o estilo atual e seja objetiva nas explicações.',
};

function ousadiaRegra(ousadia: number | undefined): string {
  if (!ousadia || ousadia <= 2)
    return 'OUSADO com ousadia baixa: apenas UMA pequena ruptura (uma cor, uma proporção OU uma peça fora do habitual) — o resto do look continua familiar.';
  if (ousadia === 3)
    return 'OUSADO com ousadia moderada: até DOIS elementos novos (por exemplo, uma proporção diferente e uma combinação de cor menos óbvia).';
  return 'OUSADO com ousadia alta: pode propor uma combinação inesperada, com mistura de estilos, proporções e cores fora do habitual.';
}

export function buildPerfilRules(perfil: PerfilEstilo, comportamento: SinaisComportamento | null): string {
  const r = perfil.respostas;
  const L: string[] = [];
  const estilo = (e: Estilo) => ESTILO_LABEL_PECA[e];

  L.push('## PERFIL DE ESTILO (Retrato Cabidê — confirmado pela usuária)');

  if (r.contextos?.length) {
    const temMov = r.contextos.some((c) => CONTEXTOS_MOVIMENTO.includes(c));
    L.push(
      `- Rotina: ${r.contextos.filter((c) => c !== 'outro').map(contextoLabel).join(', ')}${
        r.contextos_outro ? `, ${r.contextos_outro}` : ''
      }.${temMov ? ' Movimento faz parte da vida dela: peças esportivas podem aparecer em looks casuais quando fizer sentido.' : ''}`
    );
  }

  L.push('');
  L.push('### Os três caminhos (não são um ranking; nenhum é melhor que o outro)');
  L.push(
    `- ESSENCIAL: "Você, como já se veste." Priorize peças alinhadas ao estilo atual${
      r.estilo_atual?.length ? ` (${r.estilo_atual.map(estilo).join(', ')})` : ''
    } e as peças de confiança.`
  );
  L.push(
    `- AUTORAL: "Você + uma nova possibilidade." Mantenha a essência e aproxime do estilo desejado${
      r.estilo_desejado?.length ? ` (${r.estilo_desejado.map(estilo).join(', ')})` : ''
    } com uma combinação, proporção ou peça diferente.`
  );
  L.push(`- ${ousadiaRegra(r.ousadia)}`);
  L.push('- Os três caminhos respeitam SEMPRE os limites dela.');

  L.push('');
  L.push('### Preferências');
  if (r.intencao_imagem) {
    L.push(
      `- O que ela quer transmitir aos outros: ${labelOf(INTENCOES, r.intencao_imagem)} → ${INTENCAO_REGRAS[r.intencao_imagem]}. Use isso para escolher a peça protagonista, a estrutura, as cores e a proporção, e cite-o em "por_que_funciona".`
    );
  }
  if (r.estado_desejado?.length) {
    L.push(
      `- Como ela quer se sentir ao se vestir: ${r.estado_desejado.map((s) => labelOf(SENTIMENTOS, s).toLowerCase()).join(', ')}. Escolha peças que sustentem essa sensação. (Isto é diferente do que ela quer transmitir aos outros — não misture os dois.)`
    );
  }
  const s = r.silhueta;
  if (s?.cima || s?.baixo || s?.comprimentos?.length) {
    const partes: string[] = [];
    if (s.cima && s.cima !== 'depende') partes.push(`parte de cima ${labelOf(CAIMENTO_CIMA, s.cima).toLowerCase()}`);
    if (s.baixo && s.baixo !== 'depende') partes.push(`parte de baixo ${labelOf(CAIMENTO_BAIXO, s.baixo).toLowerCase()}`);
    if (s.comprimentos?.length) partes.push(`comprimentos ${s.comprimentos.map((c) => labelOf(COMPRIMENTOS, c).toLowerCase()).join('/')}`);
    if (partes.length)
      L.push(
        `- Caimento preferido: ${partes.join('; ')}. Oriente as proporções entre cima e baixo por essa preferência (ex.: volume embaixo pede cima mais ajustado ou reto).`
      );
  }
  if (r.paletas?.length) L.push(`- Priorize as famílias de cores: ${r.paletas.map((p) => labelOf(PALETAS, p).toLowerCase()).join(', ')}.`);
  if (r.estampas) {
    const est: Record<string, string> = {
      evita: 'Ela quase nunca usa estampas: prefira peças lisas; no máximo uma estampa discreta, e só se necessário.',
      discretas: 'Ela gosta de estampas discretas: no máximo uma estampa por look e evite as chamativas.',
      adora: 'Ela adora estampas: uma peça estampada pode ser a protagonista.',
      depende: 'Estampas dependem da ocasião: use-as apenas quando combinarem com a ocasião.',
    };
    L.push(`- ${est[r.estampas]}`);
  }
  if (r.pecas_ancora?.length) L.push('- Peças marcadas "ancora" representam o que ela considera "eu": priorize-as sempre que forem adequadas à ocasião.');
  if (comportamento?.estilosEmBaixa.length)
    L.push(`- Estilos que ela tem rejeitado com frequência (reduza o peso): ${comportamento.estilosEmBaixa.map(estilo).join(', ')}.`);

  if (r.dor_principal && DOR_REGRAS[r.dor_principal]) {
    L.push('');
    L.push('### Dor principal');
    L.push(`- ${DOR_REGRAS[r.dor_principal]}`);
  }

  return L.join('\n');
}

/** Regras gerais de comportamento (também para quem não tem Retrato confirmado). */
export function buildComportamentoRules(c: SinaisComportamento | null, nomes: Map<string, string>): string {
  if (!c) return '';
  const L: string[] = [];
  if (c.paresEvitar.length) {
    const pares = c.paresEvitar
      .slice(0, 8)
      .map(([a, b]) => `${nomes.get(a) ?? a} + ${nomes.get(b) ?? b}`)
      .join('; ');
    L.push(`- Combinações que ela rejeitou mais de uma vez (não repita): ${pares}.`);
  }
  return L.join('\n');
}
