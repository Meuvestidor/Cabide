// ============================================
// MEU VESTIDOR — Database Types
// Based on PRD sections 15 (Banco de dados)
// ============================================

export type Categoria =
  | 'parte_de_cima'
  | 'parte_de_baixo'
  | 'vestido'
  | 'macacao'
  | 'casaco'
  | 'calcado'
  | 'bolsa'
  | 'acessorio'
  | 'joias'
  | 'roupa_intima'
  | 'praia'
  | 'esporte'
  | 'outros';

export type Temporada = 'primavera_verao' | 'outono_inverno' | 'todas';

export type Ocasiao =
  | 'trabalho'
  | 'reuniao'
  | 'networking'
  | 'palestra'
  | 'evento'
  | 'casual'
  | 'gravacao'
  | 'viagem'
  | 'encontro';

export type ComoMeQueda = 'apertada' | 'justa' | 'meu_tamanho' | 'folgada' | 'oversize';

export type LookTipo = 'safe' | 'cool' | 'risky';

export type Decisao = 'usei' | 'nao_usei' | 'nao_gostei';

// ============================================
// USER
// ============================================
export interface User {
  id: string;
  nome: string;
  email: string;
  cidade: string;
  idioma: string;
  perfil_estilo: PerfilEstilo | null;
  created_at: string;
}

export interface PerfilEstilo {
  vida_profissional: {
    profissao: string;
    rotina: string;
    compromissos: string[];
    frequencia_eventos: string;
  };
  estilo: {
    pecas_basicas: string[];
    pecas_pouco_usadas: string[];
    cores_preferidas: string[];
    cores_evita: string[];
    como_quer_ser_percebida: string;
  };
  limites: {
    pecas_nunca_usa: string[];
    preferencias: string[];
    tamanho_roupa: string;
    tamanho_calcado: string;
  };
  objetivo: {
    como_usar_sistema: string;
    quantidade_opcoes: number;
    preferencia_visual: 'imagem' | 'texto' | 'ambos';
  };
}

// ============================================
// WARDROBE / ARMÁRIO (PRD section 15)
// ============================================
export interface Peca {
  id: string;
  user_id: string;
  nome: string;
  categoria: Categoria;
  subcategoria: string;
  cor: string;
  hex: string | null;
  formalidade: number; // 1-5
  protagonismo: number; // 1-5
  temporadas: Temporada[];
  temperatura_min: number;
  temperatura_max: number;
  ocasioes: Ocasiao[];
  estilos: string[];
  estado: string;
  comprimento: string | null;
  material: string | null;
  marca: string | null;
  tamanho: string | null;
  imagem_url: string;
  ficha_ia: string | null;
  duvidas: string | null;
  revisar: boolean;
  fixado_pela_usuaria: string[]; // campos fixados manualmente
  como_me_queda: ComoMeQueda | null;
  notas: string | null;
  vezes_usada: number;
  ultima_utilizacao: string | null;
  disponivel: boolean;
  created_at: string;
}

// ============================================
// LOOK (PRD section 15)
// ============================================
export interface Look {
  id: string;
  user_id: string;
  tipo: LookTipo;
  pecas: string[]; // IDs das peças
  pecas_detalhes?: Peca[]; // joined
  decisao: Decisao | null;
  por_que_funciona: string;
  por_que_nao: string | null;
  clima_temp: number | null;
  clima_condicao: string | null;
  ocasiao: string;
  formalidade_alvo: number;
  data: string;
  created_at: string;
}

// ============================================
// USAGE / REGISTRO DE USO (PRD section 15)
// ============================================
export interface RegistroUso {
  id: string;
  user_id: string;
  data: string;
  look_id: string;
  pecas: string[];
  ocasiao: string;
  como_me_senti: string | null;
  feedback: string | null;
  created_at: string;
}

// ============================================
// Flat lay composition
// ============================================
export interface FlatLaySlot {
  peca: Peca;
  posicao: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  };
}