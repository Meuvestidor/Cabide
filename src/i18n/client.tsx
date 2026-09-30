'use client';

import { createContext, useContext, useMemo } from 'react';
import type { Locale } from './config';
import { createTranslator, type TranslateFn } from './translate';

type Tree = Parameters<typeof createTranslator>[0];

const I18nContext = createContext<{ locale: Locale; t: TranslateFn } | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Tree;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ locale, t: createTranslator(messages) }), [locale, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): TranslateFn {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useT must be used inside <I18nProvider>');
  return ctx.t;
}

export function useLocale(): Locale {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useLocale must be used inside <I18nProvider>');
  return ctx.locale;
}
