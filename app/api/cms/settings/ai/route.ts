/**
 * AI Settings API
 *
 * GET: Retrieve AI settings
 * PUT: Update AI settings
 *
 * Uses Vercel AI Gateway - no API key needed when deployed on Vercel.
 */

import { NextResponse } from 'next/server';
import { stackServerApp } from '@/lib/cms/stack';
import { getAiSettings, updateSettings } from '@/lib/cms/settings';

export async function GET() {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getAiSettings();

    return NextResponse.json({
      settings,
    });
  } catch (error) {
    console.error('[AI Settings] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load AI settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { enabled, enabledModels, maxTokens, temperature } = body;

    // Build settings object for Vercel AI Gateway
    const settingsToUpdate: Record<string, unknown> = {
      enabled,
      provider: 'gateway',
      enabledModels: enabledModels || ['anthropic/claude-sonnet-4.5', 'anthropic/claude-haiku-4.5'],
      maxTokens,
      temperature,
    };

    await updateSettings('ai', settingsToUpdate);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[AI Settings] PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to save AI settings' },
      { status: 500 }
    );
  }
}
