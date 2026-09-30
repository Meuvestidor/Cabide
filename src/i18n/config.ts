// ============================================
// CABIDÊ — Internacionalização (configuração central)
// ============================================
// Idioma atual: pt-BR. Espanhol preparado, ainda não liberado.
// Para liberar espanhol, adicione 'es' em ENABLED_LOCALES.

export const LOCALES = ['pt-BR', 'es'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'pt-BR';

// Idiomas que as usuárias podem receber hoje.
export const ENABLED_LOCALES: readonly Locale[] = ['pt-BR'];

// Cookie com a preferência de idioma (espelha profiles.idioma).
export const LOCALE_COOKIE = 'cabide_locale';

export function resolveLocale(candidate?: string | null): Locale {
  const match = ENABLED_LOCALES.find((l) => l.toLowerCase() === candidate?.toLowerCase());
  return match ?? DEFAULT_LOCALE;
}
