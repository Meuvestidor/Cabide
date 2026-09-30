// Tradutor puro (sem React/Next): reutilizável no servidor, no cliente
// e numa futura app mobile.
import ptBR from './messages/pt-BR.json';
import es from './messages/es.json';
import type { Locale } from './config';

export type Messages = typeof ptBR;
type Tree = { [key: string]: string | Tree };

const DICTIONARIES: Record<Locale, Tree> = { 'pt-BR': ptBR, es };

function lookup(tree: Tree, key: string): string | undefined {
  let node: string | Tree | undefined = tree;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

export function getMessages(locale: Locale): Tree {
  return DICTIONARIES[locale];
}

export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

// Chaves ausentes no idioma escolhido caem para pt-BR e, por último, para a própria chave.
export function createTranslator(messages: Tree): TranslateFn {
  return (key, vars) => {
    const text = lookup(messages, key) ?? lookup(ptBR, key) ?? key;
    if (!vars) return text;
    return text.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m));
  };
}
