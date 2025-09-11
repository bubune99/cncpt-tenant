import { sql } from "@/lib/neon"

export function isValidIcon(str: string) {
  if (str.length > 10) {
    return false
  }

  try {
    // Primary validation: Check if the string contains at least one emoji character
    // This regex pattern matches most emoji Unicode ranges
    const emojiPattern = /[\p{Emoji}]/u
    if (emojiPattern.test(str)) {
      return true
    }
  } catch (error) {
    // If the regex fails (e.g., in environments that don't support Unicode property escapes),
    // fall back to a simpler validation
    console.warn("Emoji regex validation failed, using fallback validation", error)
  }

  // Fallback validation: Check if the string is within a reasonable length
  // This is less secure but better than no validation
  return str.length >= 1 && str.length <= 10
}

type SubdomainData = {
  emoji: string
  createdAt: number
}

export async function getSubdomainData(subdomain: string) {
  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "")

  const result = await sql`
    SELECT emoji, EXTRACT(EPOCH FROM created_at) * 1000 as createdAt
    FROM subdomains 
    WHERE subdomain = ${sanitizedSubdomain}
  `

  if (result.length === 0) {
    return null
  }

  return {
    emoji: result[0].emoji,
    createdAt: Number(result[0].createdat),
  }
}

export async function getAllSubdomains() {
  const result = await sql`
    SELECT subdomain, emoji, EXTRACT(EPOCH FROM created_at) * 1000 as createdAt
    FROM subdomains 
    ORDER BY created_at DESC
  `

  return result.map((row) => ({
    subdomain: row.subdomain,
    emoji: row.emoji || "❓",
    createdAt: Number(row.createdat) || Date.now(),
  }))
}
