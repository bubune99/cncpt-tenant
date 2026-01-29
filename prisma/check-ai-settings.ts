/**
 * Check AI Settings
 *
 * Diagnoses and fixes AI chat configuration issues.
 * Run with: npx tsx prisma/check-ai-settings.ts
 */

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL!;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('=== AI Settings Diagnostic ===\n');

  // Check environment variable
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  console.log(`ANTHROPIC_API_KEY env var: ${hasApiKey ? 'SET' : 'NOT SET'}`);

  if (hasApiKey) {
    const keyPrefix = process.env.ANTHROPIC_API_KEY?.substring(0, 10);
    console.log(`  Key prefix: ${keyPrefix}...`);
  }

  // Check database settings
  console.log('\n--- Database Settings ---');

  const aiSettings = await prisma.setting.findMany({
    where: { group: 'ai' },
  });

  if (aiSettings.length === 0) {
    console.log('No AI settings found in database (will use defaults)');
  } else {
    console.log('Found AI settings:');
    for (const setting of aiSettings) {
      const displayValue = setting.encrypted ? '[ENCRYPTED]' : setting.value;
      console.log(`  ${setting.key}: ${displayValue}`);
    }
  }

  // Check if ai.enabled exists and its value
  const enabledSetting = aiSettings.find(s => s.key === 'ai.enabled');

  if (!enabledSetting) {
    console.log('\n"ai.enabled" not set - defaults to true');
  } else {
    const isEnabled = enabledSetting.value === 'true';
    console.log(`\n"ai.enabled" is set to: ${enabledSetting.value}`);

    if (!isEnabled) {
      console.log('\n!!! AI is DISABLED in database settings !!!');
      console.log('Would you like to enable it? Run with --fix flag');
    }
  }

  // Check for ai.apiKey in database
  const apiKeySetting = aiSettings.find(s => s.key === 'ai.apiKey');
  if (apiKeySetting) {
    console.log(`\nai.apiKey in database: ${apiKeySetting.encrypted ? '[ENCRYPTED VALUE PRESENT]' : '[SET]'}`);
  } else if (!hasApiKey) {
    console.log('\n!!! No API key found (neither env var nor database) !!!');
  }

  // Check if --fix flag provided
  if (process.argv.includes('--fix')) {
    console.log('\n--- Applying Fixes ---');

    // Enable AI if disabled
    await prisma.setting.upsert({
      where: { key: 'ai.enabled' },
      create: {
        key: 'ai.enabled',
        value: 'true',
        group: 'ai',
        encrypted: false,
      },
      update: {
        value: 'true',
      },
    });
    console.log('Set ai.enabled = true');

    // Set provider
    await prisma.setting.upsert({
      where: { key: 'ai.provider' },
      create: {
        key: 'ai.provider',
        value: 'anthropic',
        group: 'ai',
        encrypted: false,
      },
      update: {
        value: 'anthropic',
      },
    });
    console.log('Set ai.provider = anthropic');

    // Set default model
    await prisma.setting.upsert({
      where: { key: 'ai.model' },
      create: {
        key: 'ai.model',
        value: 'claude-sonnet-4-5-20250514',
        group: 'ai',
        encrypted: false,
      },
      update: {
        value: 'claude-sonnet-4-5-20250514',
      },
    });
    console.log('Set ai.model = claude-sonnet-4-5-20250514');

    console.log('\n AI settings have been fixed!');
  }

  // Summary
  console.log('\n=== Summary ===');
  const effectivelyEnabled = !enabledSetting || enabledSetting.value === 'true';
  const hasKey = hasApiKey || !!apiKeySetting;

  console.log(`AI Enabled: ${effectivelyEnabled ? 'YES' : 'NO'}`);
  console.log(`API Key Available: ${hasKey ? 'YES' : 'NO'}`);
  console.log(`AI Chat Should Work: ${effectivelyEnabled && hasKey ? 'YES' : 'NO'}`);

  if (!effectivelyEnabled || !hasKey) {
    console.log('\nTo fix: npx tsx prisma/check-ai-settings.ts --fix');
    if (!hasKey) {
      console.log('Also ensure ANTHROPIC_API_KEY is set in .env');
    }
  }
}

main()
  .catch(console.error)
  .finally(() => {
    prisma.$disconnect();
    pool.end();
  });
