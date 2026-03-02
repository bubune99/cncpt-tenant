#!/usr/bin/env npx tsx
/**
 * Seed a demo page showcasing animated marketplace templates.
 *
 * Usage:
 *   npx tsx scripts/seed-demo-page.ts
 *   npx tsx scripts/seed-demo-page.ts --subdomain demo
 */
import 'dotenv/config'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// ── Helpers ──────────────────────────────────────────────────────────

let idCounter = 0
function gid(): string {
  return `demo-${Date.now().toString(36)}-${(idCounter++).toString(36)}`
}

interface Block {
  id: string
  tag: string
  className: string
  textContent?: string
  attrs?: Record<string, string>
  children?: Block[]
  parentId?: string | null
  label?: string
  animation?: { type: string; trigger: string; duration: number; delay?: number }
}

function b(
  tag: string,
  className: string,
  opts?: {
    text?: string
    attrs?: Record<string, string>
    children?: Block[]
    label?: string
    animation?: Block['animation']
  }
): Block {
  return {
    id: gid(),
    tag,
    className,
    textContent: opts?.text,
    attrs: opts?.attrs,
    children: opts?.children,
    label: opts?.label,
    animation: opts?.animation,
  }
}

// ── Load scraped template blocks ─────────────────────────────────────

const SCRAPED_DIR = join(__dirname, '..', 'scraped-templates')

function loadTemplate(slug: string): { blocks: Block[]; name: string; jsx?: string } | null {
  const filepath = join(SCRAPED_DIR, `${slug}.json`)
  if (!existsSync(filepath)) {
    console.warn(`  WARN: Template "${slug}" not found at ${filepath}`)
    return null
  }
  const data = JSON.parse(readFileSync(filepath, 'utf-8'))
  return { blocks: data.blocks || [], name: data.name, jsx: data.jsx }
}

// ── Build demo page blocks ───────────────────────────────────────────

function buildDemoPage(): Block[] {
  const blocks: Block[] = []

  // ── Hero Section ───────────────────────────────────────────────────
  blocks.push(
    b('section', 'w-full min-h-[85vh] flex flex-col items-center justify-center px-6 py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-center relative overflow-hidden', {
      label: 'Hero Section',
      animation: { type: 'fadeIn', trigger: 'onMount', duration: 0.6 },
      children: [
        // Decorative grid overlay
        b('div', 'absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px]', {
          label: 'Grid Overlay',
        }),
        // Radial gradient glow
        b('div', 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px]', {
          label: 'Glow Effect',
        }),
        b('div', 'relative z-10 flex flex-col items-center', {
          children: [
            b('span', 'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-blue-400 mb-8 backdrop-blur-sm', {
              text: 'Animated Component Showcase',
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.5, delay: 0.1 },
            }),
            b('h1', 'text-5xl md:text-7xl font-bold tracking-tight text-white max-w-4xl text-balance leading-tight', {
              text: 'Beautiful Animations Built Into Every Template',
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.7, delay: 0.2 },
            }),
            b('p', 'text-lg md:text-xl text-white/50 max-w-2xl mt-6 leading-relaxed', {
              text: 'Browse 420+ production-ready components from Aceternity UI, Magic UI, and HyperUI — all preprocessed and ready to drop into your pages.',
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.7, delay: 0.3 },
            }),
            b('div', 'flex items-center gap-4 mt-10', {
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.7, delay: 0.4 },
              children: [
                b('button', 'rounded-lg bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5', {
                  text: 'Open Design Browser',
                }),
                b('button', 'rounded-lg border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-all backdrop-blur-sm', {
                  text: 'View All Templates',
                }),
              ],
            }),
            // Stats row
            b('div', 'flex items-center gap-8 mt-16 text-center', {
              animation: { type: 'fadeIn', trigger: 'onMount', duration: 0.8, delay: 0.6 },
              children: [
                statBlock('420+', 'Templates'),
                b('div', 'w-px h-10 bg-white/10', {}),
                statBlock('3', 'Libraries'),
                b('div', 'w-px h-10 bg-white/10', {}),
                statBlock('MIT', 'Licensed'),
              ],
            }),
          ],
        }),
      ],
    })
  )

  // ── Template Showcase Section ──────────────────────────────────────
  blocks.push(
    b('section', 'w-full py-24 px-6 bg-slate-950', {
      label: 'Template Showcase',
      children: [
        b('div', 'max-w-6xl mx-auto', {
          children: [
            // Section header
            b('div', 'text-center mb-16', {
              children: [
                b('p', 'text-sm font-semibold uppercase tracking-widest text-blue-400 mb-3', {
                  text: 'Component Library',
                  animation: { type: 'fadeIn', trigger: 'inView', duration: 0.5 },
                }),
                b('h2', 'text-3xl md:text-5xl font-bold text-white mb-4', {
                  text: 'Animated Components',
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
                }),
                b('p', 'text-lg text-white/50 max-w-2xl mx-auto', {
                  text: 'Each component is pre-processed through our import pipeline — shadcn components resolved to Tailwind, animations preserved, and blocks normalized for the visual editor.',
                }),
              ],
            }),
            // Cards grid showing template categories
            b('div', 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', {
              children: [
                templateCard('Hero Sections', '12 variants', 'Animated hero layouts with gradients, particles, beams, and text effects.', 'from-blue-600/20 to-cyan-600/20', 0),
                templateCard('Cards & Hovers', '18 variants', '3D cards, hover effects, wobble cards, card stacks, and bento grids.', 'from-purple-600/20 to-pink-600/20', 1),
                templateCard('Backgrounds', '15 variants', 'Aurora, beams, gradient animations, grid patterns, and vortex effects.', 'from-emerald-600/20 to-teal-600/20', 2),
                templateCard('Text Effects', '8 variants', 'Gradient text, typewriter, text reveal, flip words, and generate effects.', 'from-orange-600/20 to-amber-600/20', 3),
                templateCard('Navigation', '6 variants', 'Floating navbars, docks, animated tabs, and menu transitions.', 'from-rose-600/20 to-red-600/20', 4),
                templateCard('Interactive', '22 variants', 'Tooltips, modals, scroll animations, marquees, and beam effects.', 'from-indigo-600/20 to-violet-600/20', 5),
              ],
            }),
          ],
        }),
      ],
    })
  )

  // ── Library Sources Section ────────────────────────────────────────
  blocks.push(
    b('section', 'w-full py-24 px-6 bg-slate-900', {
      label: 'Library Sources',
      children: [
        b('div', 'max-w-6xl mx-auto', {
          children: [
            b('div', 'text-center mb-16', {
              children: [
                b('p', 'text-sm font-semibold uppercase tracking-widest text-emerald-400 mb-3', {
                  text: 'Open Source',
                }),
                b('h2', 'text-3xl md:text-5xl font-bold text-white mb-4', {
                  text: 'Three World-Class Libraries',
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
                }),
              ],
            }),
            b('div', 'grid grid-cols-1 md:grid-cols-3 gap-8', {
              children: [
                sourceCard(
                  'HyperUI',
                  '271',
                  'Static Tailwind components — navbars, footers, CTAs, forms, cards, and marketing sections.',
                  'bg-blue-500/10', 'text-blue-500', 'border-blue-500/20',
                  0
                ),
                sourceCard(
                  'Aceternity UI',
                  '98',
                  'Animated React components with framer-motion — 3D cards, parallax, hero effects, and text animations.',
                  'bg-violet-500/10', 'text-violet-500', 'border-violet-500/20',
                  1
                ),
                sourceCard(
                  'Magic UI',
                  '66',
                  'Animated building blocks — gradient text, orbit circles, shimmer buttons, beam effects, and more.',
                  'bg-pink-500/10', 'text-pink-500', 'border-pink-500/20',
                  2
                ),
              ],
            }),
          ],
        }),
      ],
    })
  )

  // ── Animation Examples Section ─────────────────────────────────────
  blocks.push(
    b('section', 'w-full py-24 px-6 bg-slate-950', {
      label: 'Animation Examples',
      children: [
        b('div', 'max-w-6xl mx-auto', {
          children: [
            b('div', 'text-center mb-16', {
              children: [
                b('p', 'text-sm font-semibold uppercase tracking-widest text-purple-400 mb-3', {
                  text: 'Live Preview',
                }),
                b('h2', 'text-3xl md:text-5xl font-bold text-white mb-4', {
                  text: 'See the Animations in Action',
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
                }),
                b('p', 'text-lg text-white/50 max-w-2xl mx-auto', {
                  text: 'Every component below uses real Tailwind CSS animations — no JavaScript required for these effects.',
                }),
              ],
            }),
            // Animated demo cards
            b('div', 'grid grid-cols-1 md:grid-cols-2 gap-8', {
              children: [
                animationDemo(
                  'Fade In + Slide Up',
                  'Elements gracefully appear as they enter the viewport.',
                  'slideUp',
                  'inView',
                  0
                ),
                animationDemo(
                  'Scale on Mount',
                  'Components scale into view when the page loads.',
                  'scale',
                  'onMount',
                  1
                ),
                animationDemo(
                  'Slide From Left',
                  'Content slides in from the left on scroll.',
                  'slideLeft',
                  'inView',
                  2
                ),
                animationDemo(
                  'Hover Transform',
                  'Interactive hover states with smooth transitions.',
                  'fadeIn',
                  'hover',
                  3
                ),
              ],
            }),
          ],
        }),
      ],
    })
  )

  // ── Infinite scroll showcase (Tailwind-animated marquee) ───────────
  blocks.push(
    b('section', 'w-full py-20 bg-slate-900 overflow-hidden', {
      label: 'Marquee Showcase',
      children: [
        b('div', 'text-center mb-12', {
          children: [
            b('h2', 'text-2xl font-bold text-white', {
              text: 'Component Categories',
              animation: { type: 'fadeIn', trigger: 'inView', duration: 0.5 },
            }),
          ],
        }),
        // First row of tags
        b('div', 'flex gap-4 mb-4 animate-[scroll_30s_linear_infinite]', {
          label: 'Tag Row 1',
          children: tagRow([
            'Navbars', 'Heroes', 'Footers', 'CTAs', 'Pricing', 'Testimonials',
            'Blog Cards', 'Feature Grids', 'Alerts', 'Banners', 'Accordions',
            'Buttons', 'Inputs', 'Forms', 'Modals', 'Tabs',
          ]),
        }),
        // Second row (offset)
        b('div', 'flex gap-4 animate-[scroll_25s_linear_infinite_reverse]', {
          label: 'Tag Row 2',
          children: tagRow([
            '3D Cards', 'Aurora', 'Beams', 'Gradient Text', 'Meteors',
            'Moving Borders', 'Orbit Circles', 'Parallax', 'Sparkles',
            'Text Reveal', 'Tracing Beam', 'Wavy Background', 'Wobble Cards',
          ]),
        }),
      ],
    })
  )

  // ── CTA Section ────────────────────────────────────────────────────
  blocks.push(
    b('section', 'w-full py-24 px-6 bg-gradient-to-b from-slate-950 to-blue-950 relative overflow-hidden', {
      label: 'CTA Section',
      children: [
        b('div', 'absolute inset-0 bg-[radial-gradient(circle_at_center,#3b82f620_0%,transparent_70%)]', {
          label: 'Radial Glow',
        }),
        b('div', 'relative z-10 max-w-3xl mx-auto text-center', {
          children: [
            b('h2', 'text-3xl md:text-5xl font-bold text-white mb-6', {
              text: 'Start Building Beautiful Pages',
              animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
            }),
            b('p', 'text-lg text-white/50 mb-10', {
              text: 'Open the Design Browser from the block editor to preview and insert any template directly into your page.',
            }),
            b('div', 'flex items-center justify-center gap-4', {
              children: [
                b('button', 'rounded-lg bg-blue-600 px-10 py-4 text-base font-semibold text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5', {
                  text: 'Go to Editor',
                }),
                b('button', 'rounded-lg border border-white/20 bg-white/5 px-10 py-4 text-base font-semibold text-white hover:bg-white/10 transition-all backdrop-blur-sm', {
                  text: 'Browse Marketplace',
                }),
              ],
            }),
          ],
        }),
      ],
    })
  )

  // ── Footer ─────────────────────────────────────────────────────────
  blocks.push(
    b('footer', 'w-full py-12 px-6 bg-slate-950 border-t border-white/10', {
      label: 'Footer',
      children: [
        b('div', 'max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4', {
          children: [
            b('p', 'text-sm text-white/40', {
              text: '2026 CNCPT Web. All rights reserved.',
            }),
            b('div', 'flex items-center gap-6', {
              children: [
                b('span', 'text-xs text-white/30', { text: 'Templates from HyperUI, Aceternity UI, and Magic UI (MIT License)' }),
              ],
            }),
          ],
        }),
      ],
    })
  )

  return blocks
}

// ── Card builders ────────────────────────────────────────────────────

function statBlock(value: string, label: string): Block {
  return b('div', 'flex flex-col items-center', {
    children: [
      b('span', 'text-3xl font-bold text-white', { text: value }),
      b('span', 'text-xs text-white/40 mt-1', { text: label }),
    ],
  })
}

function templateCard(title: string, count: string, desc: string, gradient: string, index: number): Block {
  return b('div', 'group rounded-xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.06] transition-all hover:-translate-y-1 hover:shadow-xl', {
    animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: index * 0.1 },
    children: [
      b('div', `w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`, {
        children: [
          b('span', 'text-lg font-bold text-white', { text: count.split(' ')[0] }),
        ],
      }),
      b('h3', 'text-lg font-semibold text-white mb-1', { text: title }),
      b('p', 'text-xs text-blue-400 font-medium mb-3', { text: count }),
      b('p', 'text-sm text-white/50 leading-relaxed', { text: desc }),
    ],
  })
}

function sourceCard(name: string, count: string, desc: string, bgClass: string, textClass: string, borderClass: string, index: number): Block {
  return b('div', 'rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center hover:bg-white/[0.06] transition-all', {
    animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: index * 0.15 },
    children: [
      b('div', `w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center ${bgClass} border ${borderClass}`, {
        children: [
          b('span', `text-2xl font-bold ${textClass}`, {
            text: count,
          }),
        ],
      }),
      b('h3', 'text-xl font-semibold text-white mb-2', { text: name }),
      b('p', 'text-sm text-white/50 leading-relaxed', { text: desc }),
    ],
  })
}

function animationDemo(title: string, desc: string, animType: string, trigger: string, index: number): Block {
  return b('div', 'rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden', {
    animation: { type: 'fadeIn', trigger: 'inView', duration: 0.5, delay: index * 0.1 },
    children: [
      b('div', 'h-40 bg-gradient-to-br from-white/[0.05] to-white/[0.02] flex items-center justify-center', {
        children: [
          b('div', 'w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg', {
            animation: { type: animType as any, trigger: trigger as any, duration: 0.6, delay: 0.2 },
          }),
        ],
      }),
      b('div', 'p-5', {
        children: [
          b('h3', 'text-base font-semibold text-white mb-1', { text: title }),
          b('p', 'text-sm text-white/50', { text: desc }),
          b('div', 'mt-3 flex gap-2', {
            children: [
              b('span', 'text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium', { text: animType }),
              b('span', 'text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-medium', { text: trigger }),
            ],
          }),
        ],
      }),
    ],
  })
}

function tagRow(tags: string[]): Block[] {
  // Double the tags for seamless loop
  return [...tags, ...tags].map((tag) =>
    b('span', 'shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/60 whitespace-nowrap', {
      text: tag,
    })
  )
}

// ── Database insertion ───────────────────────────────────────────────

async function main() {
  const subdomainArg = process.argv.includes('--subdomain')
    ? process.argv[process.argv.indexOf('--subdomain') + 1]
    : null

  console.log('\n  Building demo page blocks...\n')
  const blocks = buildDemoPage()
  console.log(`  Generated ${blocks.length} top-level blocks`)

  // Count total blocks recursively
  function countBlocks(b: Block[]): number {
    let n = b.length
    for (const block of b) {
      if (block.children) n += countBlocks(block.children)
    }
    return n
  }
  console.log(`  Total blocks (including children): ${countBlocks(blocks)}`)

  const pageContent = {
    version: '2.0',
    blocks,
    layout: { header: 'none', footer: 'none' },
  }

  // Import the project's prisma client (uses Neon adapter)
  const { prisma } = await import('../lib/cms/db/index')

  try {
    // Resolve tenant — explicit --subdomain flag or auto-detect first available
    let tenantId: number | null = null
    let resolvedSubdomain: string | null = null

    if (subdomainArg) {
      const sub = await prisma.subdomain.findUnique({ where: { subdomain: subdomainArg } })
      if (!sub) {
        console.error(`  ERROR: Subdomain "${subdomainArg}" not found`)
        process.exit(1)
      }
      tenantId = sub.id
      resolvedSubdomain = sub.subdomain
      console.log(`  Target subdomain: ${resolvedSubdomain} (ID: ${tenantId})`)
    } else {
      // Auto-detect first subdomain
      const first = await prisma.subdomain.findFirst({ orderBy: { createdAt: 'asc' } })
      if (first) {
        tenantId = first.id
        resolvedSubdomain = first.subdomain
        console.log(`  Using subdomain: ${resolvedSubdomain} (auto-detected, ID: ${tenantId})`)
      } else {
        console.error('  ERROR: No subdomains found. Create one first or pass --subdomain <name>')
        process.exit(1)
      }
    }

    // Upsert the demo page
    const slug = 'animation-showcase'

    // Delete existing page with same slug for this tenant, then create fresh
    await prisma.page.deleteMany({
      where: { slug, tenantId },
    })

    const page = await prisma.page.create({
      data: {
        title: 'Animation Showcase',
        slug,
        content: pageContent as any,
        status: 'PUBLISHED',
        tenantId: tenantId!,
      },
    })
    console.log(`\n  Page created: "${page.title}" (ID: ${page.id})`)
    console.log(`  Status: ${page.status}`)
    console.log(`  View at: /s/${resolvedSubdomain}/${slug}\n`)
  } catch (err) {
    console.error('  Database error:', (err as Error).message)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Unhandled error:', err)
  process.exit(1)
})
