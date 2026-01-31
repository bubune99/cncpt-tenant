/**
 * Site Settings API for Puck Editor
 *
 * GET /api/site-settings - Get site settings with header/footer Puck data
 * PUT /api/site-settings - Update header/footer Puck data
 *
 * This is a simplified API for the visual editor.
 * For full site settings management, use /api/admin/site-settings
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/cms/db";
import { stackServerApp } from "@/lib/cms/stack";
import { Data } from "@puckeditor/core";

export const dynamic = 'force-dynamic'

const DEFAULT_SITE_SETTINGS_ID = "default";

// Default empty Puck data
const defaultData: Data = {
  content: [],
  root: {
    props: {
      title: "Untitled",
    },
  },
};

/**
 * Transform site settings to editor format
 */
function transformToEditorFormat(settings: {
  id: string;
  header: unknown;
  footer: unknown;
  showAnnouncementBar: boolean;
}) {
  // The header/footer can be stored in two formats:
  // 1. Direct Puck Data: { content: [], root: {} }
  // 2. Wrapped format: { enabled: true, sticky: true, data: { content: [], root: {} } }

  const headerRaw = settings.header as Record<string, unknown> | null;
  const footerRaw = settings.footer as Record<string, unknown> | null;

  // Check if it's wrapped format
  const isWrappedHeader = headerRaw && "data" in headerRaw;
  const isWrappedFooter = footerRaw && "data" in footerRaw;

  return {
    id: settings.id,
    layout: {
      containerWidth: "1200px",
      containerized: true,
    },
    header: {
      enabled: isWrappedHeader ? (headerRaw.enabled ?? true) : true,
      sticky: isWrappedHeader ? (headerRaw.sticky ?? true) : true,
      data: isWrappedHeader
        ? (headerRaw.data as Data) || defaultData
        : (headerRaw as Data) || defaultData,
    },
    footer: {
      enabled: isWrappedFooter ? (footerRaw.enabled ?? true) : true,
      data: isWrappedFooter
        ? (footerRaw.data as Data) || defaultData
        : (footerRaw as Data) || defaultData,
    },
  };
}

/**
 * GET - Get site settings for the editor
 */
export async function GET() {
  try {
    // Check authentication
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let settings = await prisma.siteSettings.findUnique({
      where: { id: DEFAULT_SITE_SETTINGS_ID },
      select: {
        id: true,
        header: true,
        footer: true,
        showAnnouncementBar: true,
      },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          id: DEFAULT_SITE_SETTINGS_ID,
          showAnnouncementBar: false,
        },
        select: {
          id: true,
          header: true,
          footer: true,
          showAnnouncementBar: true,
        },
      });
    }

    return NextResponse.json(
      transformToEditorFormat({
        id: settings.id,
        header: settings.header,
        footer: settings.footer,
        showAnnouncementBar: settings.showAnnouncementBar,
      })
    );
  } catch (error) {
    console.error("Get site settings error:", error);
    return NextResponse.json(
      { error: "Failed to get site settings" },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update site settings (header/footer)
 * Accepts partial updates in the format:
 * { header?: { enabled?, sticky?, data? }, footer?: { enabled?, data? } }
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    // Handle header update
    if (body.header !== undefined) {
      updateData.header = {
        enabled: body.header.enabled ?? true,
        sticky: body.header.sticky ?? true,
        data: body.header.data || defaultData,
      };
    }

    // Handle footer update
    if (body.footer !== undefined) {
      updateData.footer = {
        enabled: body.footer.enabled ?? true,
        data: body.footer.data || defaultData,
      };
    }

    // Ensure settings exist
    let settings = await prisma.siteSettings.findUnique({
      where: { id: DEFAULT_SITE_SETTINGS_ID },
    });

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          id: DEFAULT_SITE_SETTINGS_ID,
          showAnnouncementBar: false,
          ...updateData,
        },
      });
    } else {
      settings = await prisma.siteSettings.update({
        where: { id: DEFAULT_SITE_SETTINGS_ID },
        data: updateData,
      });
    }

    return NextResponse.json(
      transformToEditorFormat({
        id: settings.id,
        header: settings.header,
        footer: settings.footer,
        showAnnouncementBar: settings.showAnnouncementBar,
      })
    );
  } catch (error) {
    console.error("Update site settings error:", error);
    return NextResponse.json(
      { error: "Failed to update site settings" },
      { status: 500 }
    );
  }
}
