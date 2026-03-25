/**
 * Image Upload API - Upload images to R2 (tenant-scoped)
 *
 * SECURITY: Uses uploadTenantMedia to ensure files are stored under
 * the tenant's namespace (tenants/{subdomain}/...) preventing
 * cross-tenant file access.
 */

import { NextRequest, NextResponse } from "next/server";
import { uploadTenantMedia, getStorageConfig } from "@/lib/cms/r2";
import { withRequiredTenantContext } from '@/lib/cms/tenant-context';
import type { MediaCategory } from "@/lib/cms/r2";

export const dynamic = 'force-dynamic'

export const POST = withRequiredTenantContext(async (request: NextRequest, tenantContext) => {
  const storageConfig = await getStorageConfig();
  if (!storageConfig.isConfigured) {
    return NextResponse.json(
      { error: "Storage is not configured. Configure via Admin > Settings > Storage or set env vars." },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string) || "media/images";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to R2 under the tenant's namespace
    const result = await uploadTenantMedia(
      tenantContext.subdomain,
      buffer,
      file.name,
      category as MediaCategory,
      file.type
    );

    if (!result) {
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      image: result,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
})
