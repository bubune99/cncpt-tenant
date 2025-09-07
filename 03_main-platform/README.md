# CNCPT-TENANT Main Platform

## Overview
This is the main production codebase for the CNCPT-TENANT multi-tenant business platform. It's organized as a monorepo containing all applications, packages, and services.

## Project Structure

### Apps
- **platform-dashboard**: Multi-tenant platform management dashboard
- **site-dashboard**: Individual site administration interface
- **marketing-site**: Public-facing marketing website

### Packages
- **shared-ui**: Reusable UI components using shadcn/ui
- **database**: Database schemas, migrations, and ORM configurations
- **auth**: Authentication and authorization logic
- **payment-processing**: Payment provider integrations (Stripe, PayPal, Square)
- **workflow-engine**: ReactFlow-based workflow automation
- **meta-tag-system**: Meta-tag hybrid page builder system
- **ai-agents**: Multi-agent AI architecture

## Technology Stack

### Core Technologies
- **Framework**: Next.js 14+ with App Router
- **UI**: shadcn/ui with Tailwind CSS
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Visual Workflows**: ReactFlow
- **Design Tools**: Fabric.js
- **AI**: Multiple specialized agents (v0, Recraft, Claude, GPT-4)

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+
- PostgreSQL (or Neon account)

### Installation
```bash
# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

## v0 Integration

This platform is designed to work seamlessly with v0 by Vercel for AI-powered component generation.

### Using v0 for Component Generation

1. **Describe your component** in natural language
2. **Copy the generated code** from v0
3. **Add meta-tags** for visual editing capabilities
4. **Import into the platform** using our Meta-Tag system

### Meta-Tag Example
```tsx
{/* @builder:section id="pricing" type="pricing" source="v0" editable="true" */}
<PricingSection>
  {/* v0-generated content with meta-tag annotations */}
</PricingSection>
{/* @builder:end */}
```

## Development Workflow

### Feature Development
1. Create feature branch in `02_development-branches/`
2. Develop and test locally
3. Generate components with v0 as needed
4. Add meta-tags for visual editing
5. Submit for review

### AI-Assisted Development
- Use v0 for UI component generation
- Use Cursor/Windsurf for code development
- Use Recraft for visual assets
- Platform AI agents handle business logic

## Documentation

See the `Planning-Documents/` folder for:
- Platform architecture
- Feature specifications
- API documentation
- Integration guides

## License

Proprietary - All rights reserved