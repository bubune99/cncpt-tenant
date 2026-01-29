# Client Routes

This directory is for **client-specific pages and routes**.

## Why Use This Directory?

- Routes here won't conflict with core CMS routes during upstream updates
- You can add any custom pages your client needs
- The `(client)` folder is a Next.js route group (parentheses mean it doesn't affect the URL)

## Examples

```
src/app/(client)/
├── custom-landing/
│   └── page.tsx        → /custom-landing
├── special-offer/
│   └── page.tsx        → /special-offer
├── api/
│   └── custom-webhook/
│       └── route.ts    → /api/custom-webhook
└── dashboard/
    └── page.tsx        → /dashboard (client-specific)
```

## Best Practices

1. **Use this for client-specific pages only** - Standard pages should use the CMS page builder
2. **API routes** - Put custom API routes in `src/app/(client)/api/`
3. **Avoid conflicts** - Don't create routes that match core CMS routes

## Core Routes (Don't Duplicate)

These routes are managed by the core CMS:
- `/admin/*` - Admin dashboard
- `/editor/*` - Page editor
- `/preview/*` - Page preview
- `/api/admin/*` - Admin API
- `/shop/*` - E-commerce (if enabled)
- `/blog/*` - Blog (if enabled)
