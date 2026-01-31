/**
 * AI Settings Test API
 *
 * POST: Test AI Gateway connection
 *
 * Uses Vercel AI Gateway - no API key needed when deployed on Vercel.
 */

import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { stackServerApp } from '@/lib/cms/stack';
import { getAiSettings } from '@/lib/cms/settings';
import { getLanguageModel } from '@/lib/cms/ai/providers';

export async function POST(request: Request) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { model } = body;

    // Get stored settings
    const settings = await getAiSettings();

    // Get the model ID to test (use provided model or first enabled model)
    const modelId = model || settings.enabledModels?.[0] || 'anthropic/claude-sonnet-4.5';

    // Test with a simple prompt via Vercel AI Gateway
    const { text } = await generateText({
      model: getLanguageModel(modelId),
      prompt: 'Say "Hello! Connection successful." in exactly those words.',
      maxOutputTokens: 50,
    });

    return NextResponse.json({
      success: true,
      message: text.trim(),
    });
  } catch (error: unknown) {
    console.error('[AI Settings Test] Error:', error);

    // Parse gateway errors
    const errorMessage = error instanceof Error ? error.message : 'Connection test failed';

    if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
      return NextResponse.json(
        { error: 'Gateway authentication failed. Make sure you are deployed on Vercel or have AI_GATEWAY_API_KEY set.' },
        { status: 401 }
      );
    }

    if (errorMessage.includes('rate_limit') || errorMessage.includes('429')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    if (errorMessage.includes('insufficient_credits') || errorMessage.includes('402')) {
      return NextResponse.json(
        { error: 'Insufficient AI Gateway credits. Please add credits in Vercel dashboard.' },
        { status: 402 }
      );
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
