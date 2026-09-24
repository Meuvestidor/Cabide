import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { MODEL_STYLING } from '@/lib/models';
import { buildStylePortraitPrompt } from '@/lib/prompts';
import { createServerSupabase } from '@/lib/supabase-server';
import {
  DORES,
  ESTILOS,
  INTENCOES,
  PALETAS,
  SENTIMENTOS,
  contextoLabel,
  labelOf,
} from '@/lib/retrato';
import type { RespostasRetrato } from '@/types/database';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Nunca devolver texto que fale de corpo, tamanho ou IA.
const PROIBIDO = /\b(IA|I\.A\.)\b|intelig[êe]ncia artificial|algoritmo|tamanho|medida|corpo|peso/i;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ code: 'NAO_AUTENTICADO' }, { status: 401 });
    }

    const { respostas } = (await req.json()) as { respostas?: RespostasRetrato };
    if (!respostas || typeof respostas !== 'object') {
      return NextResponse.json({ code: 'DADOS_INVALIDOS' }, { status: 400 });
    }

    // Somente atributos estruturados, já rotulados. Tamanhos nunca entram aqui.
    const prompt = buildStylePortraitPrompt({
      estilo_atual: (respostas.estilo_atual ?? []).map((e) => labelOf(ESTILOS, e)),
      estilo_desejado: (respostas.estilo_desejado ?? []).map((e) => labelOf(ESTILOS, e)),
      intencao_imagem: respostas.intencao_imagem ? labelOf(INTENCOES, respostas.intencao_imagem) : null,
      estado_desejado: (respostas.estado_desejado ?? []).map((s) => labelOf(SENTIMENTOS, s)),
      contextos: (respostas.contextos ?? []).filter((c) => c !== 'outro').map(contextoLabel),
      conforto: respostas.conforto ?? null,
      ousadia: respostas.ousadia ?? null,
      paletas: (respostas.paletas ?? []).map((p) => labelOf(PALETAS, p)),
      dor_principal: respostas.dor_principal ? labelOf(DORES, respostas.dor_principal) : null,
    });

    const message = await anthropic.messages.create(
      {
        model: MODEL_STYLING,
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      },
      { timeout: 20_000, maxRetries: 1 }
    );

    const texto = message.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    const palavras = texto.split(' ').filter(Boolean).length;
    if (!texto || palavras < 40 || palavras > 120 || PROIBIDO.test(texto)) {
      return NextResponse.json({ code: 'TEXTO_INVALIDO' }, { status: 502 });
    }

    return NextResponse.json({ texto });
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error(`Style portrait API error ${error.status}:`, error.message);
    } else {
      console.error('Style portrait error:', error);
    }
    return NextResponse.json({ code: 'INDISPONIVEL' }, { status: 502 });
  }
}
