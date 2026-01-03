# CMS Integration Architecture

## Overview

The CMS is integrated into the main platform to provide content management for each subdomain. Users access the CMS through their subdomain at `/admin`.

## Routing Flow

```
User visits: subdomain.cncpt-tenant.com/admin
                    │
                    ▼
         Middleware (middleware.ts)
         Extracts subdomain, rewrites URL
                    │
                    ▼
         /cms/[subdomain]/admin/...
         CMS routes handle the request
                    │
                    ▼
         Renders CMS interface
         (white-labeled for subdomain)
```

## URL Structure

| User sees | Internal route |
|-----------|----------------|
| `sitea.domain.com/admin` | `/cms/sitea/admin` |
| `sitea.domain.com/admin/pages` | `/cms/sitea/admin/pages` |
| `sitea.domain.com/admin/products` | `/cms/sitea/admin/products` |

## File Structure

```
app/
├── cms/
│   └── [subdomain]/
│       ├── layout.tsx          # Provides subdomain context
│       └── admin/
│           ├── layout.tsx      # Auth check, CMS shell
│           ├── page.tsx        # CMS dashboard
│           └── [...path]/
│               └── page.tsx    # Catch-all for CMS sections
├── dashboard/                   # Main platform dashboard
└── s/[subdomain]/              # Storefront routes

packages/
└── cms/                         # CMS package (subtree)
    └── src/
        ├── app/admin/          # CMS admin components (to integrate)
        ├── components/         # Reusable components
        └── lib/                # Utilities
```

## Access Control

### Site Owner
- Full access to main dashboard
- Full access to all their sites' CMS
- "Manage Content" button redirects to subdomain CMS

### Store Manager (Invited)
- NO access to main dashboard
- Access ONLY to invited site's CMS
- Logs in directly at `subdomain.domain.com/admin/login`
- Never sees platform branding

## Integration Steps

### Phase 1: Basic Routing (Current)
- [x] Middleware rewrites subdomain `/admin` to CMS routes
- [x] Basic CMS dashboard with navigation
- [x] Placeholder pages for CMS sections

### Phase 2: Component Integration
- [ ] Import CMS components from `packages/cms/src/components`
- [ ] Connect to subdomain-scoped database queries
- [ ] Integrate Puck editor for page building

### Phase 3: White Labeling
- [ ] Load site branding from subdomain config
- [ ] Remove platform branding from CMS
- [ ] Custom themes per site

### Phase 4: Store Manager Auth
- [ ] Separate login flow for store managers
- [ ] Role-based permissions within CMS
- [ ] Invite system for adding managers

## Database Considerations

The CMS queries need to be scoped to the subdomain:

```typescript
// Example: Get pages for a subdomain
async function getPages(subdomain: string) {
  const site = await db.site.findUnique({
    where: { subdomain }
  })

  return db.page.findMany({
    where: { siteId: site.id }
  })
}
```

## Development

To test subdomain routing locally:

1. Add to `/etc/hosts`:
   ```
   127.0.0.1 test.localhost
   ```

2. Access: `http://test.localhost:3000/admin`

3. This triggers the subdomain middleware and routes to CMS

## Future Enhancements

- [ ] Real-time collaboration in Puck editor
- [ ] Version history for pages
- [ ] Scheduled publishing
- [ ] Multi-language support
- [ ] AI content generation integration
