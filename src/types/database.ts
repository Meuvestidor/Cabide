// ============================================
// CABIDÊ — Database Types
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

// Códigos internos gravados em looks.tipo. Na interface e na linguagem do
// produto são sempre ESSENCIAL (safe), AUTORAL (cool) e OUSADO (risky) —
// ver LOOK_TIPOS em lib/constants.
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

// ============================================
// RETRATO CABIDÊ — Perfil de estilo v2
// Persistido em profiles.perfil_estilo (JSONB).
// O estado do Retrato vem SOMENTE de perfil_estilo.status.
// Atributos ausentes = pergunta pulada/não respondida (nunca inventar).
// ============================================
export type RetratoStatus = 'nao_iniciado' | 'skipped' | 'completed' | 'confirmed';

export type Contexto =
  | 'trabalho_presencial' | 'home_office' | 'reunioes_clientes' | 'palestras_aulas'
  | 'eventos_networking' | 'vida_social' | 'gravacao_conteudo'
  | 'academia' | 'pilates_yoga' | 'running' | 'outros_esportes'
  | 'casa_filhos' | 'viagens' | 'outro';

export type DressCode = 'formal' | 'business_casual' | 'smart_casual' | 'livre' | 'uniforme';

export type Estilo =
  | 'classico' | 'minimalista' | 'elegante' | 'moderno' | 'romantico' | 'descontraido'
  | 'criativo' | 'sofisticado' | 'natural' | 'marcante' | 'esportivo' | 'boemio';

export type Intencao =
  | 'autoridade' | 'proximidade' | 'criatividade' | 'elegancia_discreta'
  | 'energia_presenca' | 'tranquilidade_leveza' | 'personalidade' | 'sofisticacao';

export type Sentimento =
  | 'confiante' | 'bonita' | 'elegante' | 'leve' | 'feminina' | 'confortavel'
  | 'poderosa' | 'autentica' | 'criativa' | 'descontraida' | 'segura';

export type CaimentoCima = 'ajustada' | 'reta' | 'ampla' | 'depende';
export type CaimentoBaixo = 'justa' | 'reta' | 'ampla' | 'depende';
export type Comprimento = 'curto' | 'midi' | 'longo';

export type Paleta = 'neutros_claros' | 'neutros_escuros' | 'terrosos' | 'pasteis' | 'cores_vivas' | 'tons_profundos';
export type Estampas = 'evita' | 'discretas' | 'adora' | 'depende';

export type Veto =
  | 'salto_alto' | 'saia_curta' | 'decote_profundo' | 'muito_justa' | 'transparencia'
  | 'cropped' | 'amassa_facil' | 'estampa_chamativa' | 'expoe_corpo';

export type Dor =
  | 'muitas_roupas_poucas_opcoes' | 'repito_pecas' | 'dificuldade_combinar'
  | 'adequacao_ocasiao' | 'perco_tempo' | 'gosto_mas_nao_uso' | 'sei_o_que_quero';

export type Escala = 1 | 2 | 3 | 4 | 5;

export interface RespostasRetrato {
  // P1 — Minha vida real
  contextos?: Contexto[];
  contextos_outro?: string;
  dress_code?: DressCode;
  formalidade_trabalho?: Escala | 'uniforme';
  // P2 — Meu estilo hoje (até 4)
  estilo_atual?: Estilo[];
  // P3 — Como quero me vestir (até 3)
  estilo_desejado?: Estilo[];
  // P4 — O que quero transmitir aos outros (até 3).
  // Perfis salvos antes aceitavam só 1 (string) — ler sempre via intencoesDe().
  intencao_imagem?: Intencao[] | Intencao;
  // P5 — Conforto + ousadia (escalas independentes)
  conforto?: Escala;
  ousadia?: Escala;
  // P6 — Como gosto que a roupa caia
  silhueta?: { cima?: CaimentoCima; baixo?: CaimentoBaixo; comprimentos?: Comprimento[] };
  // P7 — Cores e estampas
  paletas?: Paleta[];
  estampas?: Estampas;
  cores_veto?: string[];
  cores_veto_outra?: string;
  // P8 — O que não funciona para mim
  vetos?: Veto[];
  vetos_outra?: string;
  dor_principal?: Dor;
  // P9 — Como quero me sentir
  estado_desejado?: Sentimento[];
  // P10 — A peça mais "eu" (opcional)
  pecas_ancora?: string[];
}

/**
 * Tamanhos por região do corpo — o corpo não é tratado como simétrico.
 * Cada campo é independente e opcional; sistemas diferentes podem coexistir
 * (ex.: cima "G", baixo "M" e numeração "44", calçado "37").
 */
export interface MedidasUsuaria {
  /** Parte de cima: PP…XG ou texto livre ("Outro"). */
  tamanho_cima?: string;
  /** Parte de baixo em letras: PP…XG. */
  tamanho_baixo?: string;
  /** Parte de baixo em numeração: 36…48 ou texto livre ("Outro"). */
  tamanho_baixo_numero?: string;
  /** Calçado (numeração), independente das roupas. */
  tamanho_calcado?: string;
  /** @deprecated Tamanho único de roupa (versões anteriores). Não é usado nos sinais de caimento. */
  tamanho_roupa?: string;
}

export interface PerfilEstilo {
  version: 2;
  status: Exclude<RetratoStatus, 'nao_iniciado'>;
  respostas: RespostasRetrato;
  /**
   * Tamanhos declarados (opcionais, coletados no fim da P6).
   * Uso atual: sinal suave de caimento por peça na geração de looks
   * (nunca filtro, nunca enviado ao modelo como "usuária usa M").
   * Reservado também para sugestões de compra e parcerias com lojas/brechós.
   */
  medidas?: MedidasUsuaria;
  /** Texto editorial "Seu retrato de estilo". */
  retrato?: string;
  atualizado_em: string;
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