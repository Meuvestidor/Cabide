// IDs de modelo usados pelo Cabidê — um único lugar para atualizar.
// Fonte: https://platform.claude.com/docs/en/about-claude/model-deprecations
// - claude-sonnet-4-20250514 foi aposentado em 15/06/2026; substituto oficial: claude-sonnet-4-6.
// - Haiku 4.5: o ID válido é claude-haiku-4-5-20251001 (o anterior, -20250901, não existe).

/** Geração de looks e texto do Retrato. */
export const MODEL_STYLING = 'claude-sonnet-4-6';

/**
 * Geração de looks. Por padrão o mesmo modelo de styling; CABIDE_MODEL_LOOKS permite
 * testar um modelo mais barato (ex.: claude-haiku-4-5-20251001) sem mudar código.
 */
export const MODEL_LOOKS = process.env.CABIDE_MODEL_LOOKS || MODEL_STYLING;

/** Catalogação de peças por foto (visão). */
export const MODEL_CATALOGO = 'claude-haiku-4-5-20251001';
