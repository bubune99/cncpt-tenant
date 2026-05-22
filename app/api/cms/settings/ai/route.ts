/**
 * AI Settings API (tenant-scoped)
 *
 * GET: Retrieve AI settings
 * PUT: Update AI settings
 *
 * Uses Vercel AI Gateway - no API key needed when deployed on Vercel.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAiSettings, updateSettings } from '@/lib/cms/settings';
import { withTenantAuth } from '@/lib/cms/api/tenant';

export const dynamic = 'force-dynamic'

// GET — admin-only (tenant AI gateway config)
export async function GET(request: NextRequest) {
  return withTenantAuth(request, 'admin', async () => {
    try {
      const settings = await getAiSettings();

      return NextResponse.json({ settings });
    } catch (error) {
      console.error('[AI Settings] GET error:', error);
      return NextResponse.json(
        { error: 'Failed to load AI settings' },
        { status: 500 }
      );
    }
  })
}

// PUT — admin-only (modifies tenant AI gateway config — billing impact)
export async function PUT(request: NextRequest) {
  return withTenantAuth(request, 'admin', async () => {
    try {
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
  })
}
