import { NextRequest, NextResponse } from 'next/server';
import { requireAppUser } from '@/server/auth';
import { getAnthropic, AI_MODELS, extractJson } from '@/server/ai/anthropic';
import { buildLooksPrompt } from '@/server/ai/prompts';
import { getServerT } from '@/i18n/server';

// Campos das peças enviados à IA (mesmos que o cliente enviava antes).
const PECA_FIELDS =
  'id,nome,categoria,subcategoria,cor,formalidade,protagonismo,temporadas,temperatura_min,' +
  'temperatura_max,ocasioes,estilos,estado,comprimento,material,disponivel,vezes_usada,ultima_utilizacao';

const MAX_TEXT = 200;

function cleanText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, MAX_TEXT) : null;
}

export async function POST(req: NextRequest) {
  const auth = await requireAppUser();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;
  const t = await getServerT();

  try {
    const body = await req.json();
    const ocasiao = cleanText(body.ocasiao);
    const temperatura = typeof body.temperatura === 'number' && Number.isFinite(body.temperatura) ? body.temperatura : null;
    const condicaoClima = cleanText(body.condicaoClima);
    const formalidadeAlvo = typeof body.formalidadeAlvo === 'number' ? body.formalidadeAlvo : 3;

    // O armário e o perfil são lidos no servidor com a sessão da usuária (RLS):
    // o navegador não consegue injetar peças ou perfis de outra pessoa.
    const [{ data: pecas }, { data: profile }] = await Promise.all([
      supabase.from('pecas').select(PECA_FIELDS).eq('user_id', user.id).eq('disponivel', true),
      supabase.from('profiles').select('perfil_estilo').eq('id', user.id).single(),
    ]);
    const pecasDisponiveis = (pecas ?? []) as unknown as Array<Record<string, unknown> & { id: string }>;

    if (!ocasiao || pecasDisponiveis.length === 0) {
      return NextResponse.json({ error: t('api.looksRequired') }, { status: 400 });
    }

    const pecaIds = new Set(pecasDisponiveis.map((p) => p.id));
    const pecasFixadas = Array.isArray(body.pecasFixadas)
      ? body.pecasFixadas.filter((id: unknown): id is string => typeof id === 'string' && pecaIds.has(id))
      : [];

    const prompt = buildLooksPrompt({
      ocasiao,
      temperatura,
      condicaoClima,
      perfilEstilo: (profile?.perfil_estilo as Record<string, unknown>) || {},
      pecasDisponiveis,
      pecasFixadas,
    });

    const message = await getAnthropic().messages.create({
      model: AI_MODELS.looks,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonStr = extractJson(responseText);
    if (!jsonStr) {
      return NextResponse.json({ error: t('api.aiParse') }, { status: 502 });
    }

    const looksData = JSON.parse(jsonStr);

    // Generate a grupo_id to link the 3 looks from this request
    const grupoId = crypto.randomUUID();

    // Validate that all piece IDs actually exist
    for (const look of looksData.looks) {
      look.grupo_id = grupoId;
      look.ocasiao = ocasiao;
      look.formalidade_alvo = formalidadeAlvo || 3;
      look.clima_temp = temperatura || null;
      look.clima_condicao = condicaoClima || null;

      const invalidPecas = look.pecas.filter((id: string) => !pecaIds.has(id));
      if (invalidPecas.length > 0) {
        console.warn(`Look ${look.tipo} references invalid pieces:`, invalidPecas.length);
        look.pecas = look.pecas.filter((id: string) => pecaIds.has(id));
        look.por_que_funciona += t('api.looksAdjusted');
      }
    }

    return NextResponse.json({ data: looksData });
  } catch (error) {
    console.error('Looks API error:', error);
    return NextResponse.json({ error: t('api.looksFailed') }, { status: 500 });
  }
}
