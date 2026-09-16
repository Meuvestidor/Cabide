// ============================================
// MEU VESTIDOR — Constants
// From PRD sections 7, 10, 12
// ============================================

export const CATEGORIAS = {
  parte_de_cima: 'Parte de cima',
  parte_de_baixo: 'Parte de baixo',
  vestido: 'Vestido',
  macacao: 'Macacão',
  casaco: 'Casaco',
  calcado: 'Calçado',
  bolsa: 'Bolsa',
  acessorio: 'Acessório',
  joias: 'Joias',
  roupa_intima: 'Roupa íntima',
  praia: 'Praia',
  esporte: 'Esporte',
  outros: 'Outros',
} as const;

export const OCASIOES = {
  trabalho: 'Trabalho',
  trabalho_arrumado: 'Trabalho arrumado',
  reuniao: 'Reunião',
  networking: 'Networking',
  palestra: 'Palestra',
  evento: 'Evento',
  casual: 'Casual',
  gravacao: 'Gravação de conteúdo',
  viagem: 'Viagem',
  encontro: 'Encontro profissional',
} as const;

export const FORMALIDADE_LABELS: Record<number, string> = {
  1: 'Casual',
  2: 'Smart casual',
  3: 'Business casual',
  4: 'Arrumada',
  5: 'Formal',
};

export const PROTAGONISMO_LABELS: Record<number, string> = {
  1: 'Básica',
  2: 'Discreta',
  3: 'Moderada',
  4: 'Destaque',
  5: 'Protagonista',
};

export const TEMPORADAS = {
  primavera_verao: 'Primavera/Verão',
  outono_inverno: 'Outono/Inverno',
  todas: 'Todas as estações',
} as const;

// Flat lay layout positions by category
export const FLAT_LAY_POSITIONS: Record<string, {
  gridArea: string;
  zIndex: number
}> = {
  parte_de_cima: { gridArea: '1 / 1 / 2 / 2', zIndex: 3 },
  casaco: { gridArea: '1 / 1 / 2 / 2', zIndex: 4 },
  parte_de_baixo: { gridArea: '2 / 1 / 3 / 2', zIndex: 2 },
  vestido: { gridArea: '1 / 1 / 3 / 2', zIndex: 3 },
  macacao: { gridArea: '1 / 1 / 3 / 2', zIndex: 3 },
  calcado: { gridArea: '3 / 1 / 4 / 2', zIndex: 1 },
  bolsa: { gridArea: '2 / 2 / 3 / 3', zIndex: 2 },
  acessorio: { gridArea: '1 / 2 / 2 / 3', zIndex: 1 },
  joias: { gridArea: '1 / 2 / 2 / 3', zIndex: 2 },
};

// Style interview questions (PRD section 6)
export const STYLE_INTERVIEW_QUESTIONS = [
  {
    id: 'profissao',
    question: 'Qual é a sua profissão ou atividade principal?',
    field: 'vida_profissional.profissao',
  },
  {
    id: 'compromissos',
    question: 'Quais são os tipos de compromissos que você tem durante a semana? (reuniões, palestras, networking, eventos...)',
    field: 'vida_profissional.compromissos',
  },
  {
    id: 'pecas_basicas',
    question: 'Quando você não quer pensar no que vestir, quais são as 3 peças que você sempre escolhe?',
    field: 'estilo.pecas_basicas',
  },
  {
    id: 'cores_preferidas',
    question: 'Quais cores você mais gosta de usar?',
    field: 'estilo.cores_preferidas',
  },
  {
    id: 'cores_evita',
    question: 'Tem alguma cor que você evita?',
    field: 'estilo.cores_evita',
  },
  {
    id: 'percepcao',
    question: 'Como você gosta de ser percebida profissionalmente? (ex: confiante, criativa, elegante, acessível...)',
    field: 'estilo.como_quer_ser_percebida',
  },
  {
    id: 'vetos',
    question: 'Existe alguma peça ou tipo de roupa que você nunca usa?',
    field: 'limites.pecas_nunca_usa',
  },
  {
    id: 'tamanhos',
    question: 'Qual o seu tamanho de roupa e de calçado?',
    field: 'limites.tamanho_roupa',
  },
];