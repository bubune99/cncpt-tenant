/**
 * Email Templates Seed API
 *
 * POST /api/admin/email-templates/seed - Seed default email templates
 * GET  /api/admin/email-templates/seed - Check if seeding is needed
 */

import { NextRequest, NextResponse } from 'next/server';
import { seedEmailTemplates, needsSeeding } from '@/lib/cms/email/templates/seed';
import { withTenantAuth } from '@/lib/cms/api/tenant';

export const dynamic = 'force-dynamic'

// POST — admin-only (one-time-style seed; replaces auth-only check that
// would let any signed-in user seed any tenant's templates)
export async function POST(request: NextRequest) {
  return withTenantAuth(request, 'edit', async () => {
    try {
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
  })
}

// GET — admin-only (status check)
export async function GET(request: NextRequest) {
  return withTenantAuth(request, 'view', async () => {
    try {
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
  })
}
