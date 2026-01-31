/**
 * Storage Status API
 *
 * GET /api/media/storage-status - Check if storage is configured
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkStorageConfig } from '../../../../lib/media/upload'
import { getCorsConfigJson } from '../../../../lib/media/types'

export async function GET(request: NextRequest) {
  try {
    const status = await checkStorageConfig()

    // Get the app URL for CORS configuration
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const corsConfig = getCorsConfigJson([appUrl])

    // Add R2-specific setup instructions if using R2
    let setupInstructions: string | undefined
    if (status.provider === 'R2') {
      setupInstructions = `
## Cloudflare R2 Setup Guide

### 1. Enable Public Access
Go to Cloudflare Dashboard > R2 > Your Bucket > Settings

**Option A: Custom Domain (Recommended for production)**
- Under "Custom Domains", click "Connect Domain"
- Enter your domain (e.g., cdn.yourdomain.com)
- The domain must be in your Cloudflare account
- Wait for status to become "Active"
- Set R2_PUBLIC_URL=https://cdn.yourdomain.com

**Option B: r2.dev Public URL (Development)**
- Under "Public access", enable "R2.dev subdomain"
- Type "allow" to confirm
- Copy the public URL (e.g., https://pub-xxx.r2.dev)
- Set R2_PUBLIC_URL to this value
- Note: r2.dev is rate-limited, use custom domain for production

### 2. Configure CORS (Required for browser uploads)
Go to Cloudflare Dashboard > R2 > Your Bucket > Settings > CORS Policy

Click "Add CORS policy" and paste:
\`\`\`json
${corsConfig}
\`\`\`

Or use Wrangler CLI:
\`\`\`bash
npx wrangler r2 bucket cors set YOUR_BUCKET_NAME --file cors.json
\`\`\`

### 3. Required Environment Variables
\`\`\`
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_BUCKET=your-bucket-name
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_PUBLIC_URL=https://your-public-url.com
\`\`\`

Note: R2_ACCOUNT_ID is used to construct the API endpoint automatically.
`.trim()
    }

    return NextResponse.json({
      ...status,
      corsConfig,
      setupInstructions,
    })
  } catch (error) {
    console.error('Storage status check error:', error)
    return NextResponse.json(
      {
        configured: false,
        provider: 'unknown',
        missingFields: [],
        message: error instanceof Error ? error.message : 'Failed to check storage status',
      },
      { status: 500 }
    )
  }
}
