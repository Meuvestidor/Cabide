import 'server-only';
import Anthropic from '@anthropic-ai/sdk';

// Chave lida somente no servidor. Nunca usar prefixo NEXT_PUBLIC_.
let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export const AI_MODELS = {
  catalog: process.env.CABIDE_MODEL_CATALOG || 'claude-haiku-4-5-20251001',
  looks: process.env.CABIDE_MODEL_LOOKS || 'claude-sonnet-4-20250514',
  interview: process.env.CABIDE_MODEL_INTERVIEW || 'claude-sonnet-4-20250514',
} as const;

// Extrai o primeiro bloco JSON de uma resposta (com ou sem ```json).
export function extractJson(text: string): string | null {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const raw = text.match(/\{[\s\S]*\}/);
  return raw ? raw[0] : null;
}
