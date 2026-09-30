// ============================================
// pecas.duvidas — "Pontos a confirmar" da IA
// O texto vem da análise da foto. Cada ponto (frase) é associado a um tema;
// quando a usuária resolve o tema (ex.: informa o tamanho), o ponto sai.
// Pontos sem tema reconhecido nunca são removidos automaticamente.
// ============================================

export type TemaDuvida = 'tamanho' | 'material' | 'cor' | 'outro';

/** Divide o texto da IA em pontos (frases, linhas ou itens separados por ";"). */
export function dividirDuvidas(texto: string | null | undefined): string[] {
  if (!texto) return [];
  return texto
    .split(/(?<=[.!?])\s+|\n+|;\s*/)
    .map((p) => p.replace(/^[-•*]\s*/, '').trim())
    .filter((p) => p.length > 0);
}

export function temaDaDuvida(ponto: string): TemaDuvida {
  if (/tamanho|numera[çc][ãa]o/i.test(ponto)) return 'tamanho';
  if (/material|tecido|composi[çc][ãa]o|fibra/i.test(ponto)) return 'material';
  if (/etiqueta/i.test(ponto)) return 'tamanho';
  if (/\bcor(es)?\b|tonalidade/i.test(ponto)) return 'cor';
  return 'outro';
}

/** Pontos que continuam em aberto depois do que a usuária já resolveu. */
export function duvidasPendentes(texto: string | null | undefined, resolvidos: ReadonlySet<TemaDuvida>): string[] {
  return dividirDuvidas(texto).filter((p) => {
    const tema = temaDaDuvida(p);
    return tema === 'outro' || !resolvidos.has(tema);
  });
}

/** Texto a gravar em pecas.duvidas: só os pontos em aberto; null quando não resta nenhum. */
export function resolverDuvidas(texto: string | null | undefined, resolvidos: ReadonlySet<TemaDuvida>): string | null {
  if (!texto || resolvidos.size === 0) return texto ?? null;
  const pendentes = duvidasPendentes(texto, resolvidos);
  return pendentes.length ? pendentes.join(' ') : null;
}
