import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { CATALOG_PROMPT } from '@/lib/prompts';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, imageBase64, mediaType } = await req.json();

    if (!imageUrl && !imageBase64) {
      return NextResponse.json(
        { error: 'Image URL or base64 required' },
        { status: 400 }
      );
    }

    const imageContent: Anthropic.ImageBlockParam = imageBase64
      ? {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType || 'image/jpeg',
            data: imageBase64,
          },
        }
      : {
          type: 'image',
          source: {
            type: 'url',
            url: imageUrl,
          },
        };

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20250901',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            imageContent,
            {
              type: 'text',
              text: CATALOG_PROMPT,
            },
          ],
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Could not parse AI response', raw: responseText },
        { status: 500 }
      );
    }

    const catalogData = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ data: catalogData });
  } catch (error) {
    console.error('Catalog API error:', error);
    return NextResponse.json(
      { error: 'Failed to catalog piece' },
      { status: 500 }
    );
  }
}