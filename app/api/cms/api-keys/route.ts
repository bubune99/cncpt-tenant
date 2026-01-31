/**
 * MCP API Keys Management Route
 *
 * GET - List user's API keys
 * POST - Create new API key
 * DELETE - Revoke an API key
 */

import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { prisma } from "@/lib/cms/db"
import { generateApiKey } from "@/lib/cms/mcp/auth"
import { validateScopes, MCP_SCOPES } from "@/lib/cms/mcp/scopes"
import { RATE_LIMIT_TIERS } from "@/lib/cms/mcp/rate-limit"

export const dynamic = "force-dynamic"

/**
 * GET /api/cms/api-keys - List user's API keys
 */
export async function GET() {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId: user.id,
        revokedAt: null
      },
      select: {
        id: true,
        name: true,
        description: true,
        keyPrefix: true,
        scopes: true,
        rateLimitTier: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({
      apiKeys: apiKeys.map((key: typeof apiKeys[number]) => ({
        id: key.id,
        name: key.name,
        description: key.description,
        keyPrefix: key.keyPrefix,
        scopes: key.scopes,
        rateLimitTier: key.rateLimitTier,
        lastUsedAt: key.lastUsedAt,
        expiresAt: key.expiresAt,
        createdAt: key.createdAt,
        isExpired: key.expiresAt ? new Date(key.expiresAt) < new Date() : false
      }))
    })
  } catch (error) {
    console.error("[api-keys] Error listing keys:", error)
    return NextResponse.json(
      { error: "Failed to list API keys" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cms/api-keys - Create new API key
 *
 * Request body:
 * - name: string (required) - Human-readable name
 * - description: string (optional) - Description
 * - scopes: string[] (optional) - Granular permission scopes
 * - expiresInDays: number (optional) - Days until expiration
 * - rateLimitTier: string (optional) - Rate limit tier (free, pro, enterprise)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, scopes, expiresInDays, rateLimitTier } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    // Validate scopes - support both legacy (read/write) and granular scopes
    const requestedScopes: string[] = scopes || [MCP_SCOPES.READ, MCP_SCOPES.WRITE]

    // Check for invalid scopes
    const invalidScopes = validateScopes(requestedScopes)
    if (invalidScopes.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid scopes: ${invalidScopes.join(", ")}`,
          hint: "Valid scopes include: products:read, products:write, orders:read, blog:write, etc. Use '*' for full access."
        },
        { status: 400 }
      )
    }

    // Validate rate limit tier
    const validTiers = Object.keys(RATE_LIMIT_TIERS)
    const tier = rateLimitTier || "free"
    if (!validTiers.includes(tier)) {
      return NextResponse.json(
        { error: `Invalid rate limit tier: ${tier}. Valid tiers: ${validTiers.join(", ")}` },
        { status: 400 }
      )
    }

    // Generate the key
    const { key, hash, prefix } = generateApiKey()

    // Calculate expiration
    let expiresAt: Date | null = null
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiresInDays)
    }

    // Store in database
    const apiKey = await prisma.apiKey.create({
      data: {
        userId: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        keyHash: hash,
        keyPrefix: prefix,
        scopes: requestedScopes,
        rateLimitTier: tier,
        expiresAt
      },
      select: {
        id: true,
        name: true,
        description: true,
        keyPrefix: true,
        scopes: true,
        rateLimitTier: true,
        expiresAt: true,
        createdAt: true
      }
    })

    // Return the raw key - this is the only time it will be shown!
    return NextResponse.json({
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        description: apiKey.description,
        keyPrefix: apiKey.keyPrefix,
        scopes: apiKey.scopes,
        rateLimitTier: apiKey.rateLimitTier,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt
      },
      // IMPORTANT: Raw key is only returned on creation!
      rawKey: key,
      message: "API key created. Copy the key now - it won't be shown again!"
    })
  } catch (error) {
    console.error("[api-keys] Error creating key:", error)
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/cms/api-keys - Revoke an API key
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const keyId = searchParams.get("id")

    if (!keyId) {
      return NextResponse.json(
        { error: "Key ID is required" },
        { status: 400 }
      )
    }

    // Verify ownership
    const existingKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        userId: user.id,
        revokedAt: null
      }
    })

    if (!existingKey) {
      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      )
    }

    // Revoke the key (soft delete)
    await prisma.apiKey.update({
      where: { id: keyId },
      data: {
        revokedAt: new Date(),
        revokedBy: user.id
      }
    })

    return NextResponse.json({
      success: true,
      message: "API key revoked successfully"
    })
  } catch (error) {
    console.error("[api-keys] Error revoking key:", error)
    return NextResponse.json(
      { error: "Failed to revoke API key" },
      { status: 500 }
    )
  }
}
