import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { STYLE_INTERVIEW_SYSTEM } from '@/lib/prompts';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, userName } = (await req.json()) as {
      messages: ChatMessage[];
      userName: string;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const systemPrompt = `${STYLE_INTERVIEW_SYSTEM}\n\nO nome da usuária é: ${userName || 'a usuária'}.`;

    const apiMessages = messages.map((msg) => ({ role: msg.role, content: msg.content }));

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
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
    return NextResponse.json({ error: 'Failed to process interview message' }, { status: 500 });
  }
}