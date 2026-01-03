/**
 * Email Templates Seed API
 *
 * POST /api/admin/email-templates/seed - Seed default email templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/lib/stack';
import { seedEmailTemplates, needsSeeding } from '@/lib/email/templates/seed';

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for overwrite flag
    const body = await request.json().catch(() => ({}));
    const overwrite = body.overwrite === true;

    // Seed templates
    const result = await seedEmailTemplates(overwrite);

    return NextResponse.json({
      success: true,
      ...result,
      message: `Created ${result.created} templates, skipped ${result.skipped}`,
    });
  } catch (error) {
    console.error('Error seeding email templates:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to seed templates' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Verify admin access
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if seeding is needed
    const needs = await needsSeeding();

    return NextResponse.json({
      needsSeeding: needs,
    });
  } catch (error) {
    console.error('Error checking email templates:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check templates' },
      { status: 500 }
    );
  }
}
