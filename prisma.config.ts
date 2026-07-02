import 'dotenv/config'
import path from 'node:path'
import { defineConfig } from 'prisma/config'

function env(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env var: ${name}`)
  return value
}

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'cms', 'schema.prisma'),
  datasource: {
    url: env('DATABASE_URL_UNPOOLED'),
  },
})
