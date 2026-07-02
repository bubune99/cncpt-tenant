/**
 * Debug endpoint for CMS Chat API
 * Returns diagnostic information about the chat configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/lib/cms/stack';
import { prisma } from '@/lib/cms/db';
import { isAiAvailable, getAiStatus } from '@/lib/cms/ai';
import { getAiSettings } from '@/lib/cms/settings';
import { myProvider } from '@/lib/cms/ai/providers';
import { withTenant } from '@/lib/cms/api/tenant';

export async function GET(request: NextRequest) {
  return withTenant(request, async () => {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    checks: {},
    errors: [],
  };

  // Check 1: AI availability
  try {
    diagnostics.checks.aiAvailable = await isAiAvailable();
  } catch (error) {
    diagnostics.checks.aiAvailable = false;
    diagnostics.errors.push({ check: 'aiAvailable', error: String(error) });
  }

  // Check 2: AI status
  try {
    diagnostics.checks.aiStatus = await getAiStatus();
  } catch (error) {
    diagnostics.checks.aiStatus = null;
    diagnostics.errors.push({ check: 'aiStatus', error: String(error) });
  }

  // Check 3: AI settings
  try {
    const settings = await getAiSettings();
    diagnostics.checks.aiSettings = {
      enabled: settings.enabled,
      enabledModels: settings.enabledModels,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
    };
  } catch (error) {
    diagnostics.checks.aiSettings = null;
    diagnostics.errors.push({ check: 'aiSettings', error: String(error) });
  }

  // Check 4: Stack Auth user
  try {
    const user = await stackServerApp.getUser();
    diagnostics.checks.stackAuthUser = user ? { id: user.id, email: user.primaryEmail } : null;
  } catch (error) {
    diagnostics.checks.stackAuthUser = null;
    diagnostics.errors.push({ check: 'stackAuthUser', error: String(error) });
  }

  // Check 5: Database user (if Stack Auth user exists)
  if (diagnostics.checks.stackAuthUser?.id) {
    try {
      const dbUser = await prisma.user.findFirst({
        where: { stackAuthId: diagnostics.checks.stackAuthUser.id },
      });
      diagnostics.checks.dbUser = dbUser ? { id: dbUser.id, email: dbUser.email } : null;
    } catch (error) {
      diagnostics.checks.dbUser = null;
      diagnostics.errors.push({ check: 'dbUser', error: String(error) });
    }

    // Check 6: Rate limit status
    if (diagnostics.checks.dbUser?.id) {
      try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const messageCount = await prisma.aiMessage.count({
          where: {
            conversation: { userId: diagnostics.checks.dbUser.id },
            createdAt: { gte: oneDayAgo },
          },
        });
        diagnostics.checks.rateLimit = {
          messagesLast24h: messageCount,
          limit: 200,
          remaining: Math.max(0, 200 - messageCount),
          exceeded: messageCount >= 200,
        };
      } catch (error) {
        diagnostics.checks.rateLimit = null;
        diagnostics.errors.push({ check: 'rateLimit', error: String(error) });
      }
    }
  }

  // Check 7: Model provider
  try {
    const modelId = diagnostics.checks.aiSettings?.enabledModels?.[0] || 'anthropic/claude-sonnet-4.5';
    const model = myProvider.languageModel(modelId);
    diagnostics.checks.modelProvider = {
      modelId,
      modelCreated: !!model,
      modelType: model?.constructor?.name || 'unknown',
    };
  } catch (error) {
    diagnostics.checks.modelProvider = null;
    diagnostics.errors.push({ check: 'modelProvider', error: String(error) });
  }

  // Check 8: Environment variables (no values, just presence)
  diagnostics.checks.envVars = {
    VERCEL: !!process.env.VERCEL,
    AI_GATEWAY_API_KEY: !!process.env.AI_GATEWAY_API_KEY,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    DATABASE_URL: !!process.env.DATABASE_URL,
  };

  // Summary
  diagnostics.summary = {
    isReady:
      diagnostics.checks.aiAvailable &&
      diagnostics.checks.stackAuthUser &&
      diagnostics.checks.dbUser &&
      !diagnostics.checks.rateLimit?.exceeded &&
      diagnostics.checks.modelProvider?.modelCreated,
    issues: diagnostics.errors.length > 0 ? diagnostics.errors.map((e: any) => e.check) : [],
  };

  return NextResponse.json(diagnostics, { status: 200 });
  })
}
