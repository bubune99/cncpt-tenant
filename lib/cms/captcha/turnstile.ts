/**
 * Cloudflare Turnstile CAPTCHA verification
 * @see https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

import { getCaptchaSettings } from '../settings'
import type { CaptchaSettings } from '../settings/types'

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export interface TurnstileVerifyResult {
  success: boolean
  'error-codes'?: string[]
  challenge_ts?: string
  hostname?: string
}

export async function verifyCaptchaToken(
  token: string,
  remoteIp?: string
): Promise<{ success: boolean; error?: string }> {
  const settings: CaptchaSettings = await getCaptchaSettings()

  if (!settings.secretKey) {
    // CAPTCHA not configured — skip verification
    return { success: true }
  }

  const body = new URLSearchParams({
    secret: settings.secretKey,
    response: token,
  })

  if (remoteIp) {
    body.set('remoteip', remoteIp)
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    const result: TurnstileVerifyResult = await response.json()

    if (!result.success) {
      return {
        success: false,
        error: `CAPTCHA verification failed: ${(result['error-codes'] || []).join(', ')}`,
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[captcha] Turnstile verification error:', error)
    return { success: false, error: 'CAPTCHA verification service unavailable' }
  }
}

/**
 * Check if CAPTCHA is configured and enabled
 */
export async function isCaptchaEnabled(): Promise<boolean> {
  const settings: CaptchaSettings = await getCaptchaSettings()
  return settings.provider === 'turnstile' && !!settings.siteKey && !!settings.secretKey
}

/**
 * Get the site key for client-side widget rendering
 */
export async function getCaptchaSiteKey(): Promise<string | null> {
  const settings: CaptchaSettings = await getCaptchaSettings()
  if (settings.provider === 'turnstile' && settings.siteKey) {
    return settings.siteKey
  }
  return null
}
