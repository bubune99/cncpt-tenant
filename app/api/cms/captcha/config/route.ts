import { NextResponse } from 'next/server'
import { getCaptchaSiteKey } from '@/lib/cms/captcha'

export const dynamic = 'force-dynamic'

export async function GET() {
  const siteKey = await getCaptchaSiteKey()
  return NextResponse.json({ siteKey })
}
