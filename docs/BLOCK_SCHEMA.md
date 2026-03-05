# Block Schema Reference

This document describes the Block format used by the page builder. Terminal agents (Cursor, Claude, etc.) should reference this when generating Block JSON for seeding.

## Quick Start

```typescript
// Basic Block structure
interface Block {
  id: string;           // Unique ID (use random string)
  tag: BlockTag;        // HTML element tag
  className: string;    // Tailwind CSS classes
  textContent?: string; // Text content (for leaf elements)
  attrs?: Record<string, string>; // HTML attributes
  children?: Block[];   // Nested blocks (for containers)
  label?: string;       // Human-readable name for editor
}

// Page Document wrapper
interface PageDocument {
  version: "2.0";
  blocks: Block[];
}
```

## Valid Tags

### Container Tags (can have children)

```
div, section, header, footer, main, nav, aside, article, ul, ol, li, figure, form, blockquote
```

Use these for layout and grouping. They can have `children` array.

### Leaf Tags (use textContent, NO children)

```
h1, h2, h3, h4, h5, h6, p, span, a, button, img, hr, input, textarea, label, video, svg, figcaption
```

Use these for content. They should have `textContent` (except `img`, `hr`, `video`).

## Helper Function

Use this helper in your seed scripts:

```typescript
import type { Block } from "@/lib/cms/block-editor/types"

function block(
  tag: Block["tag"],
  className: string,
  opts?: {
    text?: string;
    attrs?: Record<string, string>;
    children?: Block[];
    label?: string;
    animation?: Block["animation"];
    background?: Block["background"];
  }
): Block {
  const id = Math.random().toString(36).slice(2, 11);
  return {
    id,
    tag,
    className,
    ...(opts?.text && { textContent: opts.text }),
    ...(opts?.attrs && { attrs: opts.attrs }),
    ...(opts?.children && { children: opts.children }),
    ...(opts?.label && { label: opts.label }),
    ...(opts?.animation && { animation: opts.animation }),
    ...(opts?.background && { background: opts.background }),
  };
}
```

## Common Patterns

### Hero Section

```typescript
block("section", "min-h-screen flex flex-col items-center justify-center px-6 py-24 bg-slate-950", {
  label: "Hero",
  children: [
    block("h1", "text-5xl md:text-7xl font-bold text-white text-center", {
      text: "Build stunning websites"
    }),
    block("p", "text-xl text-white/60 max-w-2xl mt-6 text-center", {
      text: "A visual page builder powered by AI and modern web technologies."
    }),
    block("div", "flex flex-wrap items-center justify-center gap-4 mt-10", {
      children: [
        block("a", "rounded-lg bg-blue-600 px-8 py-3 text-white font-semibold hover:bg-blue-500 transition-colors", {
          text: "Get Started",
          attrs: { href: "/signup" }
        }),
        block("a", "rounded-lg border border-white/20 px-8 py-3 text-white hover:bg-white/10 transition-colors", {
          text: "Learn More",
          attrs: { href: "#features" }
        }),
      ]
    }),
  ]
})
```

### Feature Grid

```typescript
block("section", "px-6 py-24 bg-white", {
  label: "Features",
  children: [
    block("h2", "text-4xl font-bold text-slate-900 text-center", {
      text: "Features"
    }),
    block("div", "grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-6xl mx-auto", {
      children: [
        // Feature card
        block("div", "p-8 rounded-2xl bg-slate-50", {
          children: [
            block("div", "w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center", {
              children: [
                block("span", "text-2xl", { text: "1" })
              ]
            }),
            block("h3", "text-xl font-semibold text-slate-900 mt-6", {
              text: "Feature One"
            }),
            block("p", "text-slate-600 mt-2", {
              text: "Description of the feature and its benefits."
            }),
          ]
        }),
        // ... more cards
      ]
    }),
  ]
})
```

### Image with Caption

```typescript
block("figure", "max-w-4xl mx-auto", {
  children: [
    block("img", "w-full rounded-2xl", {
      attrs: {
        src: "/images/hero.jpg",
        alt: "Product screenshot showing the dashboard"
      }
    }),
    block("figcaption", "text-sm text-slate-500 mt-4 text-center", {
      text: "The new dashboard interface"
    }),
  ]
})
```

### Navigation

```typescript
block("nav", "fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-white/80 backdrop-blur-lg border-b border-slate-200", {
  label: "Navigation",
  children: [
    block("div", "max-w-6xl mx-auto flex items-center justify-between", {
      children: [
        block("a", "text-xl font-bold text-slate-900", {
          text: "Brand",
          attrs: { href: "/" }
        }),
        block("div", "flex items-center gap-8", {
          children: [
            block("a", "text-slate-600 hover:text-slate-900 transition-colors", {
              text: "Features",
              attrs: { href: "#features" }
            }),
            block("a", "text-slate-600 hover:text-slate-900 transition-colors", {
              text: "Pricing",
              attrs: { href: "#pricing" }
            }),
            block("a", "rounded-lg bg-slate-900 px-4 py-2 text-white text-sm font-medium", {
              text: "Sign Up",
              attrs: { href: "/signup" }
            }),
          ]
        }),
      ]
    }),
  ]
})
```

### Form

```typescript
block("form", "max-w-md mx-auto space-y-6", {
  label: "Contact Form",
  attrs: { action: "/api/contact", method: "POST" },
  children: [
    block("div", "space-y-2", {
      children: [
        block("label", "text-sm font-medium text-slate-700", {
          text: "Email",
          attrs: { for: "email" }
        }),
        block("input", "w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500", {
          attrs: {
            type: "email",
            id: "email",
            name: "email",
            placeholder: "you@example.com"
          }
        }),
      ]
    }),
    block("button", "w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors", {
      text: "Submit",
      attrs: { type: "submit" }
    }),
  ]
})
```

## Animation

Add animations to blocks:

```typescript
block("div", "p-8 rounded-2xl bg-white shadow-lg", {
  animation: {
    type: "fadeIn",      // "fadeIn" | "slideUp" | "slideDown" | "slideLeft" | "slideRight" | "scale"
    trigger: "inView",   // "onMount" | "inView" | "hover"
    duration: 0.5,       // seconds
    delay: 0.1           // seconds
  },
  children: [...]
})
```

## Background Images

Add background images to containers:

```typescript
block("section", "min-h-screen flex items-center justify-center", {
  background: {
    url: "/images/hero-bg.jpg",
    size: "cover",       // "cover" | "contain" | "auto"
    position: "center",  // "center" | "top" | "bottom" | "left" | "right"
    attachment: "fixed", // "scroll" | "fixed" (parallax effect)
    overlay: "rgba(0,0,0,0.5)"  // Optional dark overlay
  },
  children: [...]
})
```

## Validation

Always validate before seeding:

```bash
# Validate a JSON file
npx tsx prisma/validate-blocks.ts ./my-page.json

# Validate from stdin
cat blocks.json | npx tsx prisma/validate-blocks.ts --stdin

# Get JSON output for scripting
npx tsx prisma/validate-blocks.ts --json ./blocks.json
```

## Full Seed Script Example

```typescript
// prisma/seed-landing-page.ts
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Helper function
function block(tag, className, opts = {}) {
  const id = Math.random().toString(36).slice(2, 11)
  return {
    id,
    tag,
    className,
    ...(opts.text && { textContent: opts.text }),
    ...(opts.attrs && { attrs: opts.attrs }),
    ...(opts.children && { children: opts.children }),
    ...(opts.label && { label: opts.label }),
    ...(opts.animation && { animation: opts.animation }),
    ...(opts.background && { background: opts.background }),
  }
}

const pageContent = {
  version: "2.0",
  blocks: [
    block("section", "min-h-screen flex flex-col items-center justify-center px-6 py-24 bg-slate-950", {
      label: "Hero",
      children: [
        block("h1", "text-5xl md:text-7xl font-bold text-white text-center", {
          text: "Welcome to Our Platform"
        }),
        block("p", "text-xl text-white/60 max-w-2xl mt-6 text-center", {
          text: "Build beautiful, responsive websites with our visual page builder."
        }),
        block("a", "mt-10 rounded-lg bg-blue-600 px-8 py-4 text-white font-semibold hover:bg-blue-500 transition-colors", {
          text: "Get Started",
          attrs: { href: "/signup" }
        }),
      ]
    }),
    // Add more sections...
  ]
}

async function main() {
  // Find or create a site
  const site = await prisma.site.findFirst({ where: { slug: "main" } })
  if (!site) throw new Error("Site not found")

  // Create the page
  await prisma.page.create({
    data: {
      siteId: site.id,
      title: "Landing Page",
      slug: "landing",
      content: pageContent,
      status: "draft",
    }
  })

  console.log("Landing page seeded successfully!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Run with:

```bash
npx tsx prisma/seed-landing-page.ts
```

## Troubleshooting

### "Invalid tag" error

Make sure you're using a valid HTML tag. Check the lists above.

### "Leaf tag cannot have children"

Tags like `h1`, `p`, `button`, `span` cannot have nested blocks. Use `textContent` instead.

### "Container tag has textContent"

Tags like `div`, `section` should use `children` with nested blocks. Wrap text in `<p>` or `<span>`.

### Missing `className`

Every block needs a `className` field, even if empty (`""`).

### Missing `id`

Every block needs a unique `id`. Use the helper function which generates random IDs.
