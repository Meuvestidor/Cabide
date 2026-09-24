// ============================================
// RETRATO CABIDÊ — perguntas, validação e perfil
// Entrevista + armário real + comportamento.
// As perguntas e opções abaixo são definidas pelo produto: não alterar o texto.
// ============================================
import type {
  CaimentoBaixo,
  CaimentoCima,
  Comprimento,
  Contexto,
  Dor,
  DressCode,
  Escala,
  Estampas,
  Estilo,
  Intencao,
  MedidasUsuaria,
  Ocasiao,
  Paleta,
  PerfilEstilo,
  RespostasRetrato,
  RetratoStatus,
  Sentimento,
  Veto,
} from '@/types/database';

export const TOTAL_PERGUNTAS = 9;

type Opcao<T extends string> = { value: T; label: string };

// ------------------------------------------
// P1 — Minha vida real
// ------------------------------------------
export const P1_MIN = 4;
export const P1_MAX = 6;

export const CONTEXTO_GRUPOS: { titulo: string; opcoes: Opcao<Contexto>[] }[] = [
  {
    titulo: 'Trabalho',
    opcoes: [
      { value: 'trabalho_presencial', label: 'Trabalho presencial' },
      { value: 'home_office', label: 'Home office' },
      { value: 'reunioes_clientes', label: 'Reuniões com clientes' },
      { value: 'palestras_aulas', label: 'Palestras e aulas' },
    ],
  },
  {
    titulo: 'Social',
    opcoes: [
      { value: 'eventos_networking', label: 'Eventos e networking' },
      { value: 'vida_social', label: 'Vida social / encontros' },
      { value: 'gravacao_conteudo', label: 'Gravação de conteúdo / câmera' },
    ],
  },
  {
    titulo: 'Movimento',
    opcoes: [
      { value: 'academia', label: 'Academia' },
      { value: 'pilates_yoga', label: 'Pilates / Yoga' },
      { value: 'running', label: 'Running / corrida' },
      { value: 'outros_esportes', label: 'Outros esportes' },
    ],
  },
  {
    titulo: 'Vida',
    opcoes: [
      { value: 'casa_filhos', label: 'Rotina com casa e filhos' },
      { value: 'viagens', label: 'Viagens frequentes' },
      { value: 'outro', label: 'Outro' },
    ],
  },
];

export const CONTEXTOS_TRABALHO: Contexto[] = [
  'trabalho_presencial',
  'home_office',
  'reunioes_clientes',
  'palestras_aulas',
];

export const CONTEXTOS_MOVIMENTO: Contexto[] = ['academia', 'pilates_yoga', 'running', 'outros_esportes'];

/**
 * Contexto de vida → ocasiões do sistema.
 * Movimento (academia, pilates/yoga, running, outros esportes) é contexto de vida
 * e NÃO cria ocasião artificial.
 */
export const CONTEXTO_OCASIOES: Partial<Record<Contexto, Ocasiao[]>> = {
  trabalho_presencial: ['trabalho'],
  home_office: ['trabalho', 'casual'],
  reunioes_clientes: ['reuniao', 'encontro'],
  palestras_aulas: ['palestra'],
  eventos_networking: ['evento', 'networking'],
  vida_social: ['casual', 'evento'],
  gravacao_conteudo: ['gravacao'],
  casa_filhos: ['casual'],
  viagens: ['viagem'],
};

export const DRESS_CODES: (Opcao<DressCode> & { formalidade: Escala | 'uniforme' })[] = [
  { value: 'formal', label: 'Formal', formalidade: 5 },
  { value: 'business_casual', label: 'Social leve / business casual', formalidade: 4 },
  { value: 'smart_casual', label: 'Arrumado sem ser formal / smart casual', formalidade: 3 },
  { value: 'livre', label: 'Livre / criativo', formalidade: 2 },
  { value: 'uniforme', label: 'Uniforme', formalidade: 'uniforme' },
];

// ------------------------------------------
// P2 / P3 — Vocabulário controlado de estilos
// Mesmo vocabulário usado pelo catálogo das peças (ver normalizeEstilo).
// ------------------------------------------
export const ESTILOS: Opcao<Estilo>[] = [
  { value: 'classico', label: 'Clássica' },
  { value: 'minimalista', label: 'Minimalista' },
  { value: 'elegante', label: 'Elegante' },
  { value: 'moderno', label: 'Moderna' },
  { value: 'romantico', label: 'Romântica' },
  { value: 'descontraido', label: 'Descontraída' },
  { value: 'criativo', label: 'Criativa' },
  { value: 'sofisticado', label: 'Sofisticada' },
  { value: 'natural', label: 'Natural' },
  { value: 'marcante', label: 'Marcante' },
  { value: 'esportivo', label: 'Esportiva' },
  { value: 'boemio', label: 'Boêmia' },
];

/** Rótulo do estilo aplicado a peças (masculino), usado pelo catálogo. */
export const ESTILO_LABEL_PECA: Record<Estilo, string> = {
  classico: 'clássico',
  minimalista: 'minimalista',
  elegante: 'elegante',
  moderno: 'moderno',
  romantico: 'romântico',
  descontraido: 'descontraído',
  criativo: 'criativo',
  sofisticado: 'sofisticado',
  natural: 'natural',
  marcante: 'marcante',
  esportivo: 'esportivo',
  boemio: 'boêmio',
};

function semAcento(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

const ESTILO_SINONIMOS: Record<string, Estilo> = {
  classico: 'classico', classica: 'classico', tradicional: 'classico', atemporal: 'classico',
  minimalista: 'minimalista', minimal: 'minimalista', basico: 'minimalista', basica: 'minimalista',
  elegante: 'elegante', chic: 'elegante',
  moderno: 'moderno', moderna: 'moderno', contemporaneo: 'moderno', contemporanea: 'moderno', urbano: 'moderno', urbana: 'moderno',
  romantico: 'romantico', romantica: 'romantico', delicado: 'romantico', delicada: 'romantico', feminino: 'romantico',
  descontraido: 'descontraido', descontraida: 'descontraido', casual: 'descontraido', despojado: 'descontraido', despojada: 'descontraido',
  criativo: 'criativo', criativa: 'criativo', artistico: 'criativo', artistica: 'criativo',
  sofisticado: 'sofisticado', sofisticada: 'sofisticado', refinado: 'sofisticado', refinada: 'sofisticado', luxuoso: 'sofisticado',
  natural: 'natural', organico: 'natural', organica: 'natural',
  marcante: 'marcante', ousado: 'marcante', ousada: 'marcante', statement: 'marcante',
  esportivo: 'esportivo', esportiva: 'esportivo', athleisure: 'esportivo', sporty: 'esportivo',
  boemio: 'boemio', boemia: 'boemio', boho: 'boemio', hippie: 'boemio',
};

/** Normaliza estilos livres (catálogos antigos, gênero, acentos) para o vocabulário controlado. */
export function normalizeEstilo(valor: string): Estilo | null {
  return ESTILO_SINONIMOS[semAcento(valor)] ?? null;
}

// ------------------------------------------
// P4 — O que quero transmitir (1)
// ------------------------------------------
export const INTENCOES: Opcao<Intencao>[] = [
  { value: 'autoridade', label: 'Confiança e autoridade' },
  { value: 'proximidade', label: 'Proximidade e simpatia' },
  { value: 'criatividade', label: 'Criatividade' },
  { value: 'elegancia_discreta', label: 'Elegância discreta' },
  { value: 'energia_presenca', label: 'Energia e presença' },
  { value: 'tranquilidade_leveza', label: 'Tranquilidade e leveza' },
  { value: 'personalidade', label: 'Personalidade' },
  { value: 'sofisticacao', label: 'Sofisticação' },
];

// ------------------------------------------
// P6 — Caimento + tamanhos (opcionais, mesma etapa)
// ------------------------------------------
export const CAIMENTO_CIMA: Opcao<CaimentoCima>[] = [
  { value: 'ajustada', label: 'Mais ajustada' },
  { value: 'reta', label: 'Reta' },
  { value: 'ampla', label: 'Mais ampla' },
  { value: 'depende', label: 'Depende da peça' },
];
export const CAIMENTO_BAIXO: Opcao<CaimentoBaixo>[] = [
  { value: 'justa', label: 'Justa' },
  { value: 'reta', label: 'Reta' },
  { value: 'ampla', label: 'Ampla / fluida' },
  { value: 'depende', label: 'Depende da peça' },
];
export const COMPRIMENTOS: Opcao<Comprimento>[] = [
  { value: 'curto', label: 'Curto' },
  { value: 'midi', label: 'Midi' },
  { value: 'longo', label: 'Longo' },
];
export const TAMANHOS_ROUPA = ['PP', 'P', 'M', 'G', 'GG', 'XG'] as const;

// ------------------------------------------
// P7 — Cores e estampas
// ------------------------------------------
export const PALETAS: (Opcao<Paleta> & { amostras: string[] })[] = [
  { value: 'neutros_claros', label: 'Neutros claros', amostras: ['#F4EFE6', '#E4D9C6', '#FFFFFF'] },
  { value: 'neutros_escuros', label: 'Neutros escuros', amostras: ['#1A1A1A', '#4A4A4A', '#2F3A4A'] },
  { value: 'terrosos', label: 'Terrosos', amostras: ['#8B5E3C', '#B07D4F', '#6E6B3A'] },
  { value: 'pasteis', label: 'Pastéis', amostras: ['#F2D4D7', '#D6E6F2', '#E8F0D8'] },
  { value: 'cores_vivas', label: 'Cores vivas', amostras: ['#D7263D', '#1B6FD1', '#F4B400'] },
  { value: 'tons_profundos', label: 'Tons profundos', amostras: ['#5B1A2A', '#1E3F33', '#1F2A55'] },
];
export const ESTAMPAS: Opcao<Estampas>[] = [
  { value: 'evita', label: 'Quase nunca uso' },
  { value: 'discretas', label: 'Gosto de estampas discretas' },
  { value: 'adora', label: 'Adoro estampas' },
  { value: 'depende', label: 'Depende da ocasião' },
];
export const CORES_VETO: { value: string; label: string; hex: string }[] = [
  { value: 'preto', label: 'Preto', hex: '#1A1A1A' },
  { value: 'branco', label: 'Branco', hex: '#FFFFFF' },
  { value: 'cinza', label: 'Cinza', hex: '#8C8C8C' },
  { value: 'bege', label: 'Bege', hex: '#D8C9B4' },
  { value: 'marrom', label: 'Marrom', hex: '#6B4A33' },
  { value: 'vermelho', label: 'Vermelho', hex: '#C62828' },
  { value: 'vinho', label: 'Vinho', hex: '#5B1A2A' },
  { value: 'rosa', label: 'Rosa', hex: '#E8A0B4' },
  { value: 'laranja', label: 'Laranja', hex: '#E07B39' },
  { value: 'amarelo', label: 'Amarelo', hex: '#F2C94C' },
  { value: 'verde', label: 'Verde', hex: '#4E7D5B' },
  { value: 'azul', label: 'Azul', hex: '#2F5DA8' },
  { value: 'roxo', label: 'Roxo', hex: '#6A4C93' },
];

// ------------------------------------------
// P8 — O que não funciona para mim
// ------------------------------------------
export const VETOS: Opcao<Veto>[] = [
  { value: 'salto_alto', label: 'Salto alto' },
  { value: 'saia_curta', label: 'Saia curta' },
  { value: 'decote_profundo', label: 'Decote profundo' },
  { value: 'muito_justa', label: 'Roupa muito justa' },
  { value: 'transparencia', label: 'Transparência' },
  { value: 'cropped', label: 'Cropped' },
  { value: 'amassa_facil', label: 'Tecido que amassa fácil' },
  { value: 'estampa_chamativa', label: 'Estampa chamativa' },
  { value: 'expoe_corpo', label: 'Peças que deixam alguma parte do corpo exposta' },
];
export const DORES: Opcao<Dor>[] = [
  { value: 'muitas_roupas_poucas_opcoes', label: 'Tenho muitas roupas e poucas opções' },
  { value: 'repito_pecas', label: 'Repito sempre as mesmas peças' },
  { value: 'dificuldade_combinar', label: 'Tenho dificuldade em combinar' },
  { value: 'adequacao_ocasiao', label: 'Não sei o que é adequado para cada ocasião' },
  { value: 'perco_tempo', label: 'Perco muito tempo decidindo' },
  { value: 'gosto_mas_nao_uso', label: 'Tenho roupas que gosto, mas quase não uso' },
  { value: 'sei_o_que_quero', label: 'Sei exatamente o que quero vestir' },
];

// ------------------------------------------
// P9 — Como quero me sentir (até 3)
// ------------------------------------------
export const SENTIMENTOS: Opcao<Sentimento>[] = [
  { value: 'confiante', label: 'Confiante' },
  { value: 'bonita', label: 'Bonita' },
  { value: 'elegante', label: 'Elegante' },
  { value: 'leve', label: 'Leve' },
  { value: 'feminina', label: 'Feminina' },
  { value: 'confortavel', label: 'Confortável' },
  { value: 'poderosa', label: 'Poderosa' },
  { value: 'autentica', label: 'Autêntica' },
  { value: 'criativa', label: 'Criativa' },
  { value: 'descontraida', label: 'Descontraída' },
  { value: 'segura', label: 'Segura de si' },
];

// ------------------------------------------
// Rótulos
// ------------------------------------------
export function labelOf<T extends string>(opcoes: Opcao<T>[], value: T | undefined | null): string {
  if (!value) return '';
  return opcoes.find((o) => o.value === value)?.label ?? value;
}

export function contextoLabel(c: Contexto): string {
  for (const g of CONTEXTO_GRUPOS) {
    const o = g.opcoes.find((x) => x.value === c);
    if (o) return o.label;
  }
  return c;
}

// ------------------------------------------
// Validação por etapa
// ------------------------------------------
export function temContextoTrabalho(contextos: Contexto[] | undefined): boolean {
  return !!contextos?.some((c) => CONTEXTOS_TRABALHO.includes(c));
}

/** Pode avançar com "Próxima"? ("Pular" é sempre permitido.) */
export function etapaValida(etapa: number, r: RespostasRetrato): boolean {
  switch (etapa) {
    case 1: {
      const n = r.contextos?.length ?? 0;
      if (n < P1_MIN || n > P1_MAX) return false;
      if (r.contextos?.includes('outro') && !r.contextos_outro?.trim()) return false;
      return true;
    }
    case 2:
      return (r.estilo_atual?.length ?? 0) === 3;
    case 3: {
      const n = r.estilo_desejado?.length ?? 0;
      return n >= 1 && n <= 3;
    }
    case 4:
      return !!r.intencao_imagem;
    case 5:
      return !!r.conforto || !!r.ousadia;
    case 6:
      return !!(r.silhueta?.cima || r.silhueta?.baixo || r.silhueta?.comprimentos?.length);
    case 7:
      return !!(r.paletas?.length || r.estampas || r.cores_veto?.length || r.cores_veto_outra?.trim());
    case 8:
      return !!(r.vetos?.length || r.vetos_outra?.trim() || r.dor_principal);
    case 9: {
      const n = r.estado_desejado?.length ?? 0;
      return n >= 1 && n <= 3;
    }
    default:
      return true;
  }
}

/** Remove as respostas de uma etapa pulada — nunca manter preferência falsa. */
export function limparEtapa(etapa: number, r: RespostasRetrato): RespostasRetrato {
  const n = { ...r };
  switch (etapa) {
    case 1: delete n.contextos; delete n.contextos_outro; delete n.dress_code; delete n.formalidade_trabalho; break;
    case 2: delete n.estilo_atual; break;
    case 3: delete n.estilo_desejado; break;
    case 4: delete n.intencao_imagem; break;
    case 5: delete n.conforto; delete n.ousadia; break;
    case 6: delete n.silhueta; break;
    case 7: delete n.paletas; delete n.estampas; delete n.cores_veto; delete n.cores_veto_outra; break;
    case 8: delete n.vetos; delete n.vetos_outra; delete n.dor_principal; break;
    case 9: delete n.estado_desejado; break;
    case 10: delete n.pecas_ancora; break;
  }
  return n;
}

// ------------------------------------------
// Perfil e estado
// ------------------------------------------
const STATUS_VALIDOS = ['skipped', 'completed', 'confirmed'] as const;

export function isPerfilEstiloV2(valor: unknown): valor is PerfilEstilo {
  if (!valor || typeof valor !== 'object') return false;
  const v = valor as Record<string, unknown>;
  return (
    v.version === 2 &&
    typeof v.status === 'string' &&
    (STATUS_VALIDOS as readonly string[]).includes(v.status) &&
    !!v.respostas &&
    typeof v.respostas === 'object'
  );
}

/** Estado do Retrato — determinado exclusivamente por profiles.perfil_estilo. */
export function getRetratoStatus(perfilEstilo: unknown): RetratoStatus {
  return isPerfilEstiloV2(perfilEstilo) ? perfilEstilo.status : 'nao_iniciado';
}

/** Somente perfis confirmados ativam a personalização. */
export function perfilAtivo(perfilEstilo: unknown): PerfilEstilo | null {
  return isPerfilEstiloV2(perfilEstilo) && perfilEstilo.status === 'confirmed' ? perfilEstilo : null;
}

function limparMedidas(m: MedidasUsuaria | undefined): MedidasUsuaria | undefined {
  if (!m) return undefined;
  const out: MedidasUsuaria = {};
  if (m.tamanho_roupa?.trim()) out.tamanho_roupa = m.tamanho_roupa.trim();
  if (m.tamanho_calcado?.trim()) out.tamanho_calcado = m.tamanho_calcado.trim();
  return Object.keys(out).length ? out : undefined;
}

/** Monta o perfil estruturado a partir das respostas (sem LLM). */
export function buildPerfil(params: {
  status: PerfilEstilo['status'];
  respostas: RespostasRetrato;
  medidas?: MedidasUsuaria;
  retrato?: string;
}): PerfilEstilo {
  const r = { ...params.respostas };
  // formalidade_trabalho deriva do dress code, e só existe com contexto de trabalho
  if (!temContextoTrabalho(r.contextos)) {
    delete r.dress_code;
    delete r.formalidade_trabalho;
  } else if (r.dress_code) {
    r.formalidade_trabalho = DRESS_CODES.find((d) => d.value === r.dress_code)?.formalidade;
  }
  if (!r.contextos?.includes('outro')) delete r.contextos_outro;
  const perfil: PerfilEstilo = {
    version: 2,
    status: params.status,
    respostas: r,
    atualizado_em: new Date().toISOString(),
  };
  const medidas = limparMedidas(params.medidas);
  if (medidas) perfil.medidas = medidas;
  if (params.retrato) perfil.retrato = params.retrato;
  return perfil;
}

/** Ocasiões relevantes para a vida da usuária, em ordem de prioridade. */
export function ocasioesDoPerfil(perfil: PerfilEstilo | null): Ocasiao[] {
  const out: Ocasiao[] = [];
  for (const c of perfil?.respostas.contextos ?? []) {
    for (const o of CONTEXTO_OCASIOES[c] ?? []) if (!out.includes(o)) out.push(o);
  }
  return out;
}

// ------------------------------------------
// Texto do retrato — versão determinística (fallback)
// Usa SOMENTE atributos coletados; nunca menciona tamanho, corpo ou IA.
// ------------------------------------------
function juntar(itens: string[]): string {
  if (itens.length <= 1) return itens[0] ?? '';
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
}

const INTENCAO_FRASE: Record<Intencao, string> = {
  autoridade: 'transmitir confiança e autoridade',
  proximidade: 'transmitir proximidade e simpatia',
  criatividade: 'mostrar sua criatividade',
  elegancia_discreta: 'transmitir uma elegância discreta',
  energia_presenca: 'chegar com energia e presença',
  tranquilidade_leveza: 'transmitir tranquilidade e leveza',
  personalidade: 'deixar sua personalidade à vista',
  sofisticacao: 'transmitir sofisticação',
};

export function retratoDeterministico(r: RespostasRetrato): string {
  const frases: string[] = [];
  const atual = (r.estilo_atual ?? []).map((e) => labelOf(ESTILOS, e).toLowerCase());
  const desejado = (r.estilo_desejado ?? []).map((e) => labelOf(ESTILOS, e).toLowerCase());
  const sentir = (r.estado_desejado ?? []).map((s) => labelOf(SENTIMENTOS, s).toLowerCase());

  if (atual.length) {
    const cap = juntar(atual);
    frases.push(`${cap.charAt(0).toUpperCase()}${cap.slice(1)}: é assim que o seu estilo aparece hoje.`);
  }
  if (r.intencao_imagem) {
    frases.push(`Quando você chega a um lugar, quer ${INTENCAO_FRASE[r.intencao_imagem]}.`);
  }
  if (sentir.length) {
    frases.push(`E, ao se vestir, quer se sentir ${juntar(sentir)}.`);
  }
  if (desejado.length) {
    const novos = desejado.filter((d) => !atual.includes(d));
    frases.push(
      novos.length
        ? `Seu estilo pode ganhar novas possibilidades em uma direção mais ${juntar(novos)}, sem perder sua essência.`
        : `Seu caminho é aprofundar o que já é seu, com escolhas cada vez mais ${juntar(desejado)}.`
    );
  }
  if (r.conforto && r.conforto >= 4) {
    frases.push('Conforto e praticidade fazem parte de quem você é, e seus looks vão respeitar isso.');
  } else if (r.ousadia && r.ousadia >= 4) {
    frases.push('Você gosta de experimentar, e há espaço para combinações inesperadas.');
  }
  if (!frases.length) {
    return 'Seu retrato está começando. Conforme você usa o Cabidê, seus looks vão refletir cada vez mais quem você é.';
  }
  frases.push('A partir daqui, cada look parte de quem você é.');
  return frases.join(' ');
}
