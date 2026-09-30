import { NextRequest, NextResponse } from 'next/server';
import type Anthropic from '@anthropic-ai/sdk';
import { requireAppUser } from '@/server/auth';
import { getAnthropic, AI_MODELS, extractJson } from '@/server/ai/anthropic';
import { CATALOG_PROMPT } from '@/server/ai/prompts';
import { getServerT } from '@/i18n/server';

const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
type MediaType = (typeof ALLOWED_MEDIA_TYPES)[number];
// 10 MB de imagem ≈ 13.4 MB em base64 (mesmo limite do bucket `pecas`)
const MAX_BASE64_LENGTH = Math.ceil((10 * 1024 * 1024 * 4) / 3);

export async function POST(req: NextRequest) {
  const auth = await requireAppUser();
  if (!auth.ok) return auth.response;
  const t = await getServerT();

  try {
    const { imageBase64, mediaType } = await req.json();

    if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
      return NextResponse.json({ error: t('api.imageRequired') }, { status: 400 });
    }
    if (imageBase64.length > MAX_BASE64_LENGTH) {
      return NextResponse.json({ error: t('api.imageTooLarge') }, { status: 413 });
    }
    const type = (mediaType || 'image/jpeg') as MediaType;
    if (!ALLOWED_MEDIA_TYPES.includes(type)) {
      return NextResponse.json({ error: t('api.imageType') }, { status: 415 });
    }

    const imageContent: Anthropic.ImageBlockParam = {
      type: 'image',
      source: { type: 'base64', media_type: type, data: imageBase64 },
    };

    const message = await getAnthropic().messages.create({
      model: AI_MODELS.catalog,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [imageContent, { type: 'text', text: CATALOG_PROMPT }],
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonStr = extractJson(responseText);
    if (!jsonStr) {
      return NextResponse.json({ error: t('api.aiParse') }, { status: 502 });
    }

    return NextResponse.json({ data: JSON.parse(jsonStr) });
  } catch (error) {
    console.error('Catalog API error:', error);
    return NextResponse.json({ error: t('api.catalogFailed') }, { status: 500 });
  }
}
