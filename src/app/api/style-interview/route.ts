import { NextRequest, NextResponse } from 'next/server';
import { requireAppUser } from '@/server/auth';
import { getAnthropic, AI_MODELS } from '@/server/ai/anthropic';
import { STYLE_INTERVIEW_SYSTEM } from '@/server/ai/prompts';
import { getServerT } from '@/i18n/server';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Limites contra abuso de custo da IA
const MAX_MESSAGES = 60;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_NAME_LENGTH = 80;

export async function POST(req: NextRequest) {
  const auth = await requireAppUser();
  if (!auth.ok) return auth.response;
  const t = await getServerT();

  try {
    const { messages, userName } = (await req.json()) as {
      messages: ChatMessage[];
      userName: string;
    };

    const valid =
      Array.isArray(messages) &&
      messages.length > 0 &&
      messages.length <= MAX_MESSAGES &&
      messages.every(
        (m) =>
          (m?.role === 'user' || m?.role === 'assistant') &&
          typeof m.content === 'string' &&
          m.content.length <= MAX_MESSAGE_LENGTH,
      );
    if (!valid) {
      return NextResponse.json({ error: t('api.badRequest') }, { status: 400 });
    }

    const safeName = typeof userName === 'string' ? userName.slice(0, MAX_NAME_LENGTH) : '';
    const systemPrompt = `${STYLE_INTERVIEW_SYSTEM}\n\nO nome da usuária é: ${safeName || 'a usuária'}.`;

    const apiMessages = messages.map((msg) => ({ role: msg.role, content: msg.content }));

    const response = await getAnthropic().messages.create({
      model: AI_MODELS.interview,
      max_tokens: 1024,
      system: systemPrompt,
      messages: apiMessages,
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    const isComplete = responseText.includes('[ENTREVISTA_COMPLETA]');
    let perfilEstilo = null;

    if (isComplete) {
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)```/);
      if (jsonMatch) { try { perfilEstilo = JSON.parse(jsonMatch[1].trim()); } catch {} }
      else { const raw = responseText.match(/\{[\s\S]*"vida_profissional"[\s\S]*\}/); if (raw) { try { perfilEstilo = JSON.parse(raw[0]); } catch {} } }
    }

    let displayText = responseText;
    if (isComplete) {
      displayText = responseText.replace(/```json[\s\S]*?```/, '').replace(/\{[\s\S]*"vida_profissional"[\s\S]*\}/, '').replace('[ENTREVISTA_COMPLETA]', '').trim();
    }

    return NextResponse.json({ message: displayText, isComplete, perfilEstilo });
  } catch (error) {
    console.error('Style interview API error:', error);
    return NextResponse.json({ error: t('api.interviewFailed') }, { status: 500 });
  }
}
