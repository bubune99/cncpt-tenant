/**
 * Site Settings API (tenant-scoped)
 *
 * GET /api/admin/site-settings - Get current site settings
 * PUT /api/admin/site-settings - Update site settings
 *
 * Query params:
 * - subdomain: The subdomain to get/update maintenance mode for
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateSiteSettings, updateSiteSettings } from '@/lib/cms/site-settings';
import { prisma } from '@/lib/cms/db';
import { withTenantAuth } from '@/lib/cms/api/tenant';

export const dynamic = 'force-dynamic'

/**
 * GET - Fetch site settings (admin-only — exposes maintenance + analytics IDs)
 */
export async function GET(request: NextRequest) {
  return withTenantAuth(request, 'view', async () => {
    try {
      const settings = await getOrCreateSiteSettings();

      // Get subdomain from query params to fetch maintenance mode
      const { searchParams } = new URL(request.url);
      const subdomainName = searchParams.get('subdomain');

      let maintenanceMode = false;
      let maintenanceMessage: string | null = null;

      if (subdomainName) {
        const subdomain = await prisma.subdomain.findUnique({
          where: { subdomain: subdomainName },
          select: { maintenanceMode: true, maintenanceMsg: true },
        });
        if (subdomain) {
          maintenanceMode = subdomain.maintenanceMode;
          maintenanceMessage = subdomain.maintenanceMsg;
        }
      }

      return NextResponse.json({
        ...settings,
        maintenanceMode,
        maintenanceMessage,
      });
    } catch (error) {
      console.error('Error fetching site settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch site settings' },
        { status: 500 }
      );
    }
  })
}

/**
 * PUT - Update site settings (admin-only — high-impact site mutation)
 */
export async function PUT(request: NextRequest) {
  return withTenantAuth(request, 'edit', async (_tenant, user) => {
    try {
      const body = await request.json();

      // Validate request body for SiteSettings fields
      const allowedFields = [
        'header',
        'footer',
        'announcementBar',
        'showAnnouncementBar',
        'siteName',
        'siteTagline',
        'logoUrl',
        'logoAlt',
        'faviconUrl',
        'socialLinks',
        'defaultMetaTitle',
        'defaultMetaDescription',
        'defaultOgImage',
        'contactEmail',
        'contactPhone',
        'businessAddress',
        'googleAnalyticsId',
        'facebookPixelId',
      ];

      // Filter to only allowed fields for SiteSettings
      const updateData: Record<string, unknown> = {};
      for (const field of allowedFields) {
        if (field in body) {
          updateData[field] = body[field];
        }
      }

      const settings = await updateSiteSettings(updateData);

      // Handle subdomain-specific maintenance mode
      const subdomainName = body.subdomain;
      let maintenanceMode = false;
      let maintenanceMessage: string | null = null;

      if (subdomainName) {
        // Verify user owns/can access this subdomain
        const subdomain = await prisma.subdomain.findUnique({
          where: { subdomain: subdomainName },
          select: { id: true, userId: true },
        });

        if (subdomain && subdomain.userId === user.id) {
          // User owns this subdomain, update maintenance mode
          const updatedSubdomain = await prisma.subdomain.update({
            where: { subdomain: subdomainName },
            data: {
              maintenanceMode: body.maintenanceMode ?? false,
              maintenanceMsg: body.maintenanceMessage ?? null,
            },
            select: { maintenanceMode: true, maintenanceMsg: true },
          });
          maintenanceMode = updatedSubdomain.maintenanceMode;
          maintenanceMessage = updatedSubdomain.maintenanceMsg;
        }
      }

      return NextResponse.json({
        ...settings,
        maintenanceMode,
        maintenanceMessage,
      });
    } catch (error) {
      console.error('Error updating site settings:', error);
      return NextResponse.json(
        { error: 'Failed to update site settings' },
        { status: 500 }
      );
    }
  })
}
