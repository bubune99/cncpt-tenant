# CMS Customization Guide

This guide explains how to customize the CMS for your needs while keeping the ability to receive upstream updates.

## Quick Start

1. **Edit `client.config.ts`** - Main configuration file
2. **Add components in `src/client/components/`** - Custom Puck components
3. **Add pages in `src/app/(client)/`** - Custom routes
4. **Customize theme in `src/client/theme/`** - Colors, fonts, spacing

---

## Directory Structure

### Safe to Modify (Won't Conflict with Updates)

```
├── client.config.ts          # Main configuration
├── .env.local                 # Environment variables
├── src/
│   ├── client/               # All client customizations
│   │   ├── components/       # Custom Puck components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── theme/            # Theme overrides
│   │   └── api/              # Custom API utilities
│   └── app/
│       └── (client)/         # Custom pages/routes
└── public/
    └── client/               # Client-specific assets
```

### Do NOT Modify (Core CMS)

```
├── src/
│   ├── puck/                 # Puck editor components
│   ├── lib/                  # Core utilities (except extensions/)
│   ├── components/           # Core UI components
│   └── app/
│       ├── (cms)/            # Core CMS routes
│       ├── admin/            # Admin dashboard
│       ├── editor/           # Page editor
│       └── api/admin/        # Admin API routes
```

---

## Configuration (client.config.ts)

### Branding

```typescript
export const branding = {
  siteName: 'My Client Site',
  logo: {
    light: '/client/logo.svg',
    dark: '/client/logo-dark.svg',
  },
  favicon: '/client/favicon.ico',
};
```

### Features

Enable or disable CMS modules:

```typescript
export const features = {
  blog: true,           // Enable blog
  shop: false,          // Disable e-commerce
  forms: true,          // Enable forms

  ai: {
    enabled: true,
    contentGeneration: true,
    chatbot: false,     // Disable AI chatbot
  },
};
```

### Custom Puck Components

```typescript
import { MyCustomBlock } from '@/client/components';

export const puckConfig = {
  customComponents: {
    MyCustomBlock: MyCustomBlockConfig,
  },
  hiddenComponents: ['DataTable'],  // Hide unwanted components
};
```

---

## Adding Custom Components

### 1. Create the Component

```typescript
// src/client/components/TestimonialBlock.tsx
import { ComponentConfig } from '@puckeditor/core';

export function TestimonialBlock({ quote, author, company }) {
  return (
    <blockquote className="border-l-4 border-primary pl-4">
      <p className="text-lg italic">"{quote}"</p>
      <footer className="mt-2 text-sm text-muted-foreground">
        — {author}, {company}
      </footer>
    </blockquote>
  );
}

export const TestimonialBlockConfig: ComponentConfig = {
  label: 'Testimonial',
  fields: {
    quote: { type: 'textarea', label: 'Quote' },
    author: { type: 'text', label: 'Author Name' },
    company: { type: 'text', label: 'Company' },
  },
  defaultProps: {
    quote: 'This product changed my life!',
    author: 'Jane Doe',
    company: 'Acme Inc',
  },
  render: TestimonialBlock,
};
```

### 2. Export It

```typescript
// src/client/components/index.ts
export { TestimonialBlock, TestimonialBlockConfig } from './TestimonialBlock';
```

### 3. Register in Config

```typescript
// client.config.ts
import { TestimonialBlockConfig } from '@/client/components';

export const puckConfig = {
  customComponents: {
    TestimonialBlock: TestimonialBlockConfig,
  },
};
```

---

## Adding Custom Pages

Create pages in `src/app/(client)/`:

```typescript
// src/app/(client)/pricing/page.tsx
export default function PricingPage() {
  return (
    <div className="container py-12">
      <h1>Custom Pricing Page</h1>
      {/* Your custom content */}
    </div>
  );
}
```

This creates a route at `/pricing`.

---

## Theme Customization

### Override Theme Values

```typescript
// src/client/theme/index.ts
export const clientTheme = {
  colors: {
    primary: '#e11d48',      // Rose red
    secondary: '#0ea5e9',    // Sky blue
  },
  fonts: {
    heading: '"Playfair Display", serif',
    body: '"Inter", sans-serif',
  },
  radius: {
    md: '0.75rem',
  },
};
```

### Use in Components

```tsx
import { useClientTheme } from '@/lib/extensions';

function MyComponent() {
  const { colors } = useClientTheme();
  return <div style={{ color: colors.primary }}>Themed content</div>;
}
```

---

## Feature Flags

Check if features are enabled:

```tsx
import { features, isFeatureEnabled } from '@/lib/extensions';

function Navigation() {
  return (
    <nav>
      <Link href="/">Home</Link>
      {features.blog() && <Link href="/blog">Blog</Link>}
      {features.shop() && <Link href="/shop">Shop</Link>}
    </nav>
  );
}
```

---

## Receiving Updates

### Setup (First Time)

```bash
# Add upstream remote
git remote add upstream https://github.com/your-org/cms-core.git
```

### Getting Updates

```bash
# Fetch latest from upstream
git fetch upstream

# Merge updates (resolve conflicts in src/client/ only)
git merge upstream/main

# Or merge a specific version
git merge upstream/v2.1.0
```

### Conflict Resolution

If conflicts occur, they should only be in your `src/client/` directory. The core CMS files won't conflict if you followed this guide.

---

## Best Practices

1. **Never edit core files** - Always use extension points
2. **Use client.config.ts** - Don't hardcode values in components
3. **Keep customizations isolated** - All custom code in `src/client/`
4. **Test before merging updates** - Run tests after pulling upstream
5. **Document your customizations** - Future you will thank you

---

## Need Help?

- Check the [API documentation](/docs/api)
- Review example customizations in `src/client/`
- Contact support for assistance
