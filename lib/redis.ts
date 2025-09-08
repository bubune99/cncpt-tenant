import { Redis } from "@upstash/redis"

export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// Cache keys
export const CACHE_KEYS = {
  tenant: (subdomain: string) => `tenant:${subdomain}`,
  tenantSettings: (tenantId: number) => `tenant:${tenantId}:settings`,
  tenantPages: (tenantId: number) => `tenant:${tenantId}:pages`,
  tenantPosts: (tenantId: number) => `tenant:${tenantId}:posts`,
}

// Cache TTL (1 hour)
export const CACHE_TTL = 3600
