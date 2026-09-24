// ============================================
// CABIDÊ — Constants
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

export const COMO_ME_QUEDA = {
  apertada: 'Apertada',
  justa: 'Justa',
  meu_tamanho: 'Meu tamanho',
  folgada: 'Folgada',
  oversize: 'Oversize',
} as const;

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

// ============================================
// Tipos de look — nomes visíveis ao usuário
// ============================================
// Os códigos 'safe' | 'cool' | 'risky' são apenas representação interna
// (valores já gravados em looks.tipo). Nunca exibi-los na interface.
// Os três caminhos NÃO são um ranking: mesma hierarquia visual.
export const LOOK_TIPOS = {
  safe: {
    nome: 'Essencial',
    curta: 'Você, como já se veste.',
    completa:
      'Looks que respeitam seu estilo atual e combinam com aquilo que você já sabe que funciona para você.',
  },
  cool: {
    nome: 'Autoral',
    curta: 'Você + uma nova possibilidade.',
    completa:
      'Looks que mantêm sua essência, mas introduzem uma combinação, proporção ou peça diferente para ampliar seu repertório.',
  },
  risky: {
    nome: 'Ousado',
    curta: 'Uma versão mais experimental de você.',
    completa:
      'Looks que saem mais da sua zona de conforto e propõem algo novo, sempre respeitando seus limites.',
  },
} as const;

export const LOOK_TIPO_ORDEM = ['safe', 'cool', 'risky'] as const;
