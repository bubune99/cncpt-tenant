# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js 16 headless CMS with e-commerce capabilities, visual page builder (Puck), blog system, plugin architecture, and AI chat integration.

## Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npx prisma generate  # Regenerate Prisma client after schema changes
npx prisma db push   # Push schema changes to database
npx tsc --noEmit     # Type check without emitting
```

## Architecture

### Route Groups
- `src/app/(storefront)/` - Public-facing pages (blog posts, categories, tags)
- `src/app/admin/` - Admin dashboard and management
- `src/app/api/` - REST API routes (analytics, auth, blog, checkout, payments, webhooks, etc.)
- `src/app/handler/` - Stack Auth handler routes

### Core Libraries (`src/lib/`)
- `db/index.ts` - Prisma client with PostgreSQL adapter (PrismaPg)
- `stripe/` - Stripe payment integration
- `shippo/` - Shipping API integration
- `analytics/` - Event tracking system
- `puck/` - Puck editor utilities
- `stack/` - Stack Auth server utilities
- `stack-client.ts` - Stack Auth client app
- `settings/` - Runtime configuration from database
- `encryption/` - Sensitive data encryption
- `env/` - Environment variable validation

### Visual Editor (Puck)
- `src/puck/blog/` - Blog post components (12 components: HeroSection, TextBlock, ImageBlock, etc.)
- `src/puck/pages/` - Website page components (reuses blog components)
- `src/puck/email/` - Email template components
- `src/puck/plugin/` - Plugin-related Puck components
- Blog/page content stored as JSON in `content` or `puckContent` fields

### Authentication
Uses Stack Auth (`@stackframe/stack`):
- Server app: `src/lib/stack/index.ts`
- Client app: `src/lib/stack-client.ts`
- Provider: `src/components/stack-provider.tsx`
- User's Stack Auth UUID synced to `User.stackAuthId` in database

### Plugin System
Self-extending architecture with:
- `Primitive` - Atomic tool definitions with JSON Schema input validation
- `Plugin` - Collections of primitives
- `Workflow` - Visual compositions using React Flow
- `WorkflowNode` - Individual nodes in workflows
- Execution logging via `PrimitiveExecution` and `WorkflowExecution`

### Key Models (Prisma)
- `User` - Users with Stack Auth UUID sync
- `Product/ProductVariant` - E-commerce products with options
- `Order/OrderItem/Shipment` - Order management
- `Page` - CMS pages with Puck JSON content
- `BlogPost/BlogCategory/BlogTag` - Blog system with TipTap or Puck content
- `Setting` - Runtime configuration (encrypted for sensitive values)
- `AnalyticsEvent` - Event tracking

### v0 Component Import System
Converts v0.dev components to Puck editor components:
- `src/lib/v0/` - Parser and converter utilities
- `src/lib/v0-agent/` - Claude-powered intelligent conversion agent
- `src/app/api/v0/` - Import and component management APIs
- `src/puck/components/V0ImportDialog.tsx` - UI for importing components
- `CustomComponent` model - Database storage for imported components

**Future**: External agent package planned - see `docs/OPTION_B_EXTERNAL_V0_AGENT.md`

## Integrations
- **Payments**: Stripe (products, checkout, webhooks)
- **Shipping**: Shippo (rates, labels, tracking)
- **Email**: SMTP, SendGrid, Resend, Mailgun, or AWS SES
- **Storage**: S3, Cloudflare R2, or local
- **AI**: OpenAI, Anthropic, Google AI for chat; Puck AI for visual editor
- **v0.dev**: Component import and conversion (see v0 section above)

## Environment
Required: `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `ENCRYPTION_KEY`
See `.env.example` for all available variables.
