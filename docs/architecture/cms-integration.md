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
         AdminShell renders sidebar + content
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
│       ├── layout.tsx              # Subdomain context provider
│       └── admin/
│           ├── layout.tsx          # Auth check + AdminShell wrapper
│           ├── page.tsx            # CMS dashboard with stats
│           ├── components/
│           │   └── admin-shell.tsx # Sidebar navigation shell
│           └── [...path]/
│               └── page.tsx        # Catch-all for CMS sections
├── dashboard/                      # Main platform dashboard
└── s/[subdomain]/                  # Storefront routes

packages/
└── cms/                            # CMS package (git subtree)
    └── src/
        ├── app/admin/              # CMS admin components (source)
        ├── components/             # Reusable components
        └── lib/                    # Utilities
```

## AdminShell Component

The `admin-shell.tsx` provides the CMS navigation structure:

### Navigation Groups
- **Main**: Dashboard, Analytics
- **E-Commerce**: Products, Orders, Order Workflows, Shipping, Customers
- **Content**: Pages, Blog, Forms, Media, Email Marketing
- **System**: Users, Roles & Permissions, Plugins, Workflows, Settings

### Features
- Responsive sidebar (collapsible on mobile)
- Collapsible navigation groups
- Active link highlighting
- Search bar (placeholder)
- View Site link (opens subdomain in new tab)
- Sign out functionality
- Site branding (logo + name)

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

## Integration Progress

### Phase 1: Basic Routing ✅
- [x] Middleware rewrites subdomain `/admin` to CMS routes
- [x] Basic CMS dashboard with navigation sidebar
- [x] Placeholder pages for CMS sections
- [x] AdminShell with full navigation structure

### Phase 2: Dashboard Content ✅
- [x] Dashboard with mock stats (Revenue, Orders, Products, Customers)
- [x] Recent orders list
- [x] Top products list
- [x] Quick stats cards

### Phase 3: Component Integration (Next)
- [ ] Import CMS components from `packages/cms/src/components`
- [ ] Connect to subdomain-scoped database queries
- [ ] Integrate Puck editor for page building
- [ ] Products management page
- [ ] Orders management page
- [ ] Pages builder with Puck

### Phase 4: White Labeling
- [ ] Load site branding from subdomain config
- [ ] Custom themes per site
- [ ] Remove all platform branding from CMS

### Phase 5: Store Manager Auth
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

## Integration Strategy

The CMS package (`packages/cms`) is maintained as a git subtree for bidirectional sync with the upstream repository. The main app adapts CMS components rather than importing them directly to:

1. Avoid complex path aliasing issues
2. Allow subdomain-specific customizations
3. Maintain separation of concerns
4. Enable gradual component migration

Components are adapted by:
- Prefixing navigation hrefs with `/cms/[subdomain]`
- Using main app's auth system (Stack Auth)
- Loading site-specific branding
- Scoping database queries to subdomain

## Future Enhancements

- [ ] Real-time collaboration in Puck editor
- [ ] Version history for pages
- [ ] Scheduled publishing
- [ ] Multi-language support
- [ ] AI content generation integration
- [ ] Activity logging per site
