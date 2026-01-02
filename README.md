# CNCPT-TENANT Platform

## 🚀 Enterprise Multi-Tenant Business Platform

A comprehensive multi-tenant platform combining e-commerce, content management, workflow automation, and AI-powered business intelligence into a single integrated system.

## 📁 Project Structure

\`\`\`
cncpt-tenant/
├── 01_planning-docs/        # Documentation & specifications
├── 02_development-branches/ # Feature development
├── 03_main-platform/        # Production codebase
└── 99_code-dumping-ground/  # Templates & references
\`\`\`

## 🎯 Key Features

- **Multi-Tenant Architecture** - Manage multiple business sites from one platform
- **Visual Workflow Automation** - ReactFlow-based business process automation
- **AI-Powered Components** - v0 integration with meta-tag system
- **Comprehensive E-Commerce** - Full product, order, and payment management
- **Content Management** - Blog, video courses, events, and more
- **Multi-Agent AI** - Specialized AI agents for different business domains

## 🛠 Technology Stack

- **Frontend**: Next.js 14+, React, TypeScript
- **UI**: shadcn/ui, Tailwind CSS
- **Database**: Neon PostgreSQL, Drizzle ORM
- **Workflows**: ReactFlow
- **Design**: Fabric.js
- **AI**: v0, Claude, GPT-4, Recraft

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+
- Git

### Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/bubune99/cncpt-tenant.git
cd cncpt-tenant

# Navigate to main platform
cd 03_main-platform

# Install dependencies (when package.json is ready)
pnpm install

# Set up environment variables
cp .env.example .env.local

# Start development server
pnpm dev
\`\`\`

## 📚 Documentation

- [Platform Vision](/01_planning-docs/business-strategy/unified_platform_vision.md)
- [v0 Integration Guide](/01_planning-docs/v0-integration-guide.md)
- [Meta-Tag System](/03_main-platform/packages/meta-tag-system/README.md)
- [AI Agents](/03_main-platform/packages/ai-agents/README.md)

## 🔄 Development Workflow

1. **Generate Components** - Use v0.dev for UI generation
2. **Add Meta-Tags** - Enable visual editing capabilities
3. **Test in Dev Branch** - Verify in `02_development-branches/`
4. **Integrate** - Move to `03_main-platform/`
5. **Deploy** - Production deployment

## 🤝 Contributing

See [Contributing Guidelines](/CONTRIBUTING.md) for details.

## 📄 License

Proprietary - All Rights Reserved

## 🔗 Links

- [GitHub Repository](https://github.com/bubune99/cncpt-tenant)
- [Documentation](./01_planning-docs/)
- [v0.dev](https://v0.dev) - Component generation

---

Built with ❤️ for next-generation business operations
