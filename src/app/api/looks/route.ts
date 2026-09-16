import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildLooksPrompt } from '@/lib/prompts';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { ocasiao, temperatura, condicaoClima, perfilEstilo, pecas, formalidadeAlvo } =
      await req.json();

    if (!ocasiao || !pecas || pecas.length === 0) {
      return NextResponse.json(
        { error: 'Ocasião and wardrobe pieces required' },
        { status: 400 }
      );
    }

    const prompt = buildLooksPrompt({
      ocasiao,
      temperatura,
      condicaoClima,
      perfilEstilo: perfilEstilo || {},
      pecasDisponiveis: pecas,
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    let jsonStr: string | null = null;
    const fenceMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) { jsonStr = fenceMatch[1].trim(); }
    else { const rawMatch = responseText.match(/\{[\s\S]*\}/); if (rawMatch) jsonStr = rawMatch[0]; }

    if (!jsonStr) return NextResponse.json({ error: 'Could not parse AI response', raw: responseText }, { status: 500 });

    const looksData = JSON.parse(jsonStr);
    const grupoId = crypto.randomUUID();

    const pecaIds = new Set(pecas.map((p: { id: string }) => p.id));
    for (const look of looksData.looks) {
      look.grupo_id = grupoId;
      look.ocasiao = ocasiao;
      look.formalidade_alvo = formalidadeAlvo || 3;
      look.clima_temp = temperatura || null;
      look.clima_condicao = condicaoClima || null;
      const invalid = look.pecas.filter((id: string) => !pecaIds.has(id));
      if (invalid.length > 0) {
        look.pecas = look.pecas.filter((id: string) => pecaIds.has(id));
        look.por_que_funciona += ' (Algumas peças foram ajustadas pela validação.)';
      }
    }

    return NextResponse.json({ data: looksData });
  } catch (error) {
    console.error('Looks API error:', error);
    return NextResponse.json({ error: 'Failed to generate looks' }, { status: 500 });
  }
}