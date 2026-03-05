#!/usr/bin/env npx tsx
/**
 * Seed script: Sassy Dame Designs — craft store tenant onboarding.
 *
 * Creates subdomain, tenant settings, 5 showcase pages, 11 product categories,
 * 6 sample products, and grants super admin access.
 *
 * Usage:
 *   npx tsx scripts/seed-sassy-dame.ts
 *   npx tsx scripts/seed-sassy-dame.ts --subdomain sassy-dame-staging
 */
import 'dotenv/config'

// ── Helpers ──────────────────────────────────────────────────────────

let idCounter = 0
function gid(prefix = 'sd'): string {
  return `${prefix}-${Date.now().toString(36)}-${(idCounter++).toString(36)}`
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

function pageContent(blocks: Block[]) {
  return {
    version: '2.0',
    blocks,
    layout: { header: 'global', footer: 'global' },
  }
}

// ── Brand colors ─────────────────────────────────────────────────────

const PINK = '#e91e8c'       // primary / theme
const PURPLE = '#6b21a8'     // accent

// Tailwind equivalents used in classNames:
// pink:   bg-pink-500, text-pink-500, from-pink-500, border-pink-500
// purple: bg-purple-700, text-purple-700, from-purple-700

// ── Page builders ────────────────────────────────────────────────────

function buildHomePage(): Block[] {
  const blocks: Block[] = []

  // ── Hero ──
  blocks.push(
    b('section', 'w-full min-h-[90vh] flex flex-col items-center justify-center px-6 py-28 bg-gradient-to-br from-pink-600 via-fuchsia-600 to-purple-800 text-center relative overflow-hidden', {
      label: 'Hero Section',
      animation: { type: 'fadeIn', trigger: 'onMount', duration: 0.7 },
      children: [
        // Decorative circles
        b('div', 'absolute top-[-120px] right-[-80px] w-[400px] h-[400px] rounded-full bg-white/5 blur-3xl', { label: 'Deco Circle 1' }),
        b('div', 'absolute bottom-[-100px] left-[-60px] w-[350px] h-[350px] rounded-full bg-purple-400/10 blur-3xl', { label: 'Deco Circle 2' }),
        b('div', 'relative z-10 max-w-4xl mx-auto flex flex-col items-center', {
          children: [
            b('span', 'inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-medium text-white mb-8 backdrop-blur-sm', {
              text: 'Same-Day DTF Printing Available',
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.5, delay: 0.1 },
            }),
            b('h1', 'text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight text-balance', {
              text: 'Custom DTF Transfers & Crafts',
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.7, delay: 0.2 },
            }),
            b('p', 'text-lg md:text-xl text-white/70 max-w-2xl mt-6 leading-relaxed', {
              text: 'Premium direct-to-film transfers, UV stickers, custom apparel, and hands-on workshops. From design to finished product — we bring your ideas to life.',
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.7, delay: 0.3 },
            }),
            b('div', 'flex flex-col sm:flex-row items-center gap-4 mt-10', {
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.7, delay: 0.4 },
              children: [
                b('a', 'rounded-full bg-white px-10 py-4 text-base font-bold text-pink-600 hover:bg-pink-50 transition-all shadow-lg shadow-black/20 hover:-translate-y-0.5', {
                  text: 'Shop Now',
                  attrs: { href: '/shop' },
                }),
                b('a', 'rounded-full border-2 border-white/30 bg-white/10 px-10 py-4 text-base font-bold text-white hover:bg-white/20 transition-all backdrop-blur-sm', {
                  text: 'Book a Class',
                  attrs: { href: '/classes' },
                }),
              ],
            }),
          ],
        }),
      ],
    })
  )

  // ── Featured Categories ──
  blocks.push(
    b('section', 'w-full py-24 px-6 bg-white', {
      label: 'Featured Categories',
      children: [
        b('div', 'max-w-6xl mx-auto', {
          children: [
            b('div', 'text-center mb-16', {
              children: [
                b('p', 'text-sm font-bold uppercase tracking-widest text-pink-500 mb-3', {
                  text: 'What We Offer',
                  animation: { type: 'fadeIn', trigger: 'inView', duration: 0.5 },
                }),
                b('h2', 'text-3xl md:text-5xl font-extrabold text-gray-900 mb-4', {
                  text: 'Our Most Popular Collections',
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
                }),
              ],
            }),
            b('div', 'grid grid-cols-1 md:grid-cols-3 gap-8', {
              children: [
                categoryCard('DTF Transfers', 'High-quality direct-to-film prints. Full color, vibrant detail, ready to press. Gang sheets and custom sizes available.', 'from-pink-500 to-fuchsia-600', '/shop?cat=dtf-prints', 0),
                categoryCard('UV Stickers', 'Durable UV-printed stickers that resist water, sun, and scratches. Perfect for tumblers, laptops, and more.', 'from-purple-600 to-indigo-700', '/shop?cat=uv-dtf-stickers', 1),
                categoryCard('Custom Apparel', 'T-shirts, hoodies, hats — designed by you, printed by us. Premium blanks with professional DTF application.', 'from-fuchsia-500 to-pink-600', '/shop?cat=custom-shirts', 2),
              ],
            }),
          ],
        }),
      ],
    })
  )

  // ── Services Highlight ──
  blocks.push(
    b('section', 'w-full py-24 px-6 bg-gray-50', {
      label: 'Services Highlight',
      children: [
        b('div', 'max-w-6xl mx-auto', {
          children: [
            b('div', 'text-center mb-16', {
              children: [
                b('p', 'text-sm font-bold uppercase tracking-widest text-purple-700 mb-3', { text: 'More Than a Shop' }),
                b('h2', 'text-3xl md:text-5xl font-extrabold text-gray-900', {
                  text: 'Studio, Classes & Events',
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
                }),
              ],
            }),
            b('div', 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6', {
              children: [
                serviceCard('Studio Rentals', 'Book our fully equipped crafting studio with heat presses, printers, and tools. $200 for 4 hours.', '01', 0),
                serviceCard('Hands-On Classes', 'Learn Canva, rhinestone application, and DTF printing from experienced instructors.', '02', 1),
                serviceCard('DIY Party Packages', 'Hat bars, tumbler parties, t-shirt design events — perfect for birthdays and team building.', '03', 2),
                serviceCard('Signs & Banners', 'Custom yard signs, event banners, and business signage. Full-color, weather-resistant.', '04', 3),
              ],
            }),
          ],
        }),
      ],
    })
  )

  // ── Testimonial / Trust ──
  blocks.push(
    b('section', 'w-full py-20 px-6 bg-gradient-to-r from-pink-500 to-purple-700', {
      label: 'Trust Section',
      children: [
        b('div', 'max-w-4xl mx-auto text-center', {
          children: [
            b('h2', 'text-3xl md:text-4xl font-extrabold text-white mb-4', {
              text: 'Join 1,000+ Happy Crafters',
              animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
            }),
            b('p', 'text-lg text-white/80 max-w-2xl mx-auto mb-8', {
              text: 'From custom transfers to creative workshops, our community keeps coming back for the quality and the vibe. Raleigh\'s favorite craft studio.',
            }),
            b('div', 'flex flex-wrap justify-center gap-12', {
              animation: { type: 'fadeIn', trigger: 'inView', duration: 0.8, delay: 0.2 },
              children: [
                statBadge('1,000+', 'Happy Customers'),
                statBadge('500+', 'Custom Orders/Month'),
                statBadge('4.9', 'Google Rating'),
              ],
            }),
          ],
        }),
      ],
    })
  )

  // ── CTA Footer ──
  blocks.push(
    b('section', 'w-full py-24 px-6 bg-white', {
      label: 'Bottom CTA',
      children: [
        b('div', 'max-w-3xl mx-auto text-center', {
          children: [
            b('h2', 'text-3xl md:text-5xl font-extrabold text-gray-900 mb-6', {
              text: 'Ready to Create Something Amazing?',
              animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
            }),
            b('p', 'text-lg text-gray-500 mb-10', {
              text: 'Browse our shop, sign up for a workshop, or rent the studio. Let\'s make something beautiful together.',
            }),
            b('div', 'flex flex-col sm:flex-row items-center justify-center gap-4', {
              children: [
                b('a', 'rounded-full bg-pink-500 px-10 py-4 text-base font-bold text-white hover:bg-pink-600 transition-all shadow-lg shadow-pink-500/25 hover:-translate-y-0.5', {
                  text: 'Shop Collections',
                  attrs: { href: '/shop' },
                }),
                b('a', 'rounded-full border-2 border-gray-300 px-10 py-4 text-base font-bold text-gray-700 hover:bg-gray-50 transition-all', {
                  text: 'View Classes',
                  attrs: { href: '/classes' },
                }),
              ],
            }),
          ],
        }),
      ],
    })
  )

  return blocks
}

function buildAboutPage(): Block[] {
  const blocks: Block[] = []

  // ── Hero ──
  blocks.push(
    b('section', 'w-full py-28 px-6 bg-gradient-to-br from-fuchsia-600 to-purple-800 text-center relative overflow-hidden', {
      label: 'About Hero',
      animation: { type: 'fadeIn', trigger: 'onMount', duration: 0.7 },
      children: [
        b('div', 'absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,#ffffff10_0%,transparent_60%)]', {}),
        b('div', 'relative z-10 max-w-3xl mx-auto', {
          children: [
            b('h1', 'text-5xl md:text-6xl font-extrabold text-white mb-6', {
              text: 'Where Sass Meets Craft',
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.6, delay: 0.1 },
            }),
            b('p', 'text-xl text-white/70 leading-relaxed', {
              text: 'From a heat press in the garage to a full-service crafting studio in Raleigh, NC. This is our story.',
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.6, delay: 0.2 },
            }),
          ],
        }),
      ],
    })
  )

  // ── Our Story ──
  blocks.push(
    b('section', 'w-full py-24 px-6 bg-white', {
      label: 'Our Story',
      children: [
        b('div', 'max-w-4xl mx-auto', {
          children: [
            b('div', 'text-center mb-12', {
              children: [
                b('p', 'text-sm font-bold uppercase tracking-widest text-pink-500 mb-3', { text: 'Our Story' }),
                b('h2', 'text-3xl md:text-4xl font-extrabold text-gray-900', {
                  text: 'Built on Passion, Powered by Creativity',
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
                }),
              ],
            }),
            b('div', 'prose prose-lg max-w-none text-gray-600 space-y-6', {
              children: [
                b('p', 'text-lg leading-relaxed', {
                  text: 'Sassy Dame Designs started with a simple idea: make custom printing accessible, affordable, and fun. What began as a side hustle creating DTF transfers for friends and family quickly grew into a full-service craft business.',
                }),
                b('p', 'text-lg leading-relaxed', {
                  text: 'We specialize in direct-to-film (DTF) printing — a versatile technology that produces vibrant, full-color transfers for t-shirts, hoodies, tote bags, and more. Our same-day printing means you don\'t have to wait weeks for your custom order.',
                }),
                b('p', 'text-lg leading-relaxed', {
                  text: 'But we\'re more than just a print shop. Our Raleigh studio is a creative space where anyone can learn, create, and connect. From beginner Canva courses to advanced rhinestone techniques, our classes are designed for every skill level.',
                }),
              ],
            }),
          ],
        }),
      ],
    })
  )

  // ── What We Offer ──
  blocks.push(
    b('section', 'w-full py-24 px-6 bg-gray-50', {
      label: 'What We Offer',
      children: [
        b('div', 'max-w-6xl mx-auto', {
          children: [
            b('div', 'text-center mb-16', {
              children: [
                b('p', 'text-sm font-bold uppercase tracking-widest text-purple-700 mb-3', { text: 'What We Do' }),
                b('h2', 'text-3xl md:text-4xl font-extrabold text-gray-900', {
                  text: 'Everything Under One Roof',
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
                }),
              ],
            }),
            b('div', 'grid grid-cols-1 md:grid-cols-2 gap-8', {
              children: [
                offerCard('DTF Transfers', 'Gang sheets, custom sizes, full-color vibrant prints ready to heat press onto any fabric.', 0),
                offerCard('UV DTF Stickers', 'Waterproof, scratch-resistant stickers for tumblers, phone cases, laptops, and more.', 1),
                offerCard('Studio Space', 'Fully equipped crafting studio with heat presses, vinyl cutters, and sublimation printers.', 2),
                offerCard('Classes & Workshops', 'Canva design, rhinestone application, DTF printing fundamentals, and more.', 3),
              ],
            }),
          ],
        }),
      ],
    })
  )

  // ── Studio Info ──
  blocks.push(
    b('section', 'w-full py-24 px-6 bg-white', {
      label: 'Studio Info',
      children: [
        b('div', 'max-w-4xl mx-auto text-center', {
          children: [
            b('p', 'text-sm font-bold uppercase tracking-widest text-pink-500 mb-3', { text: 'Visit Us' }),
            b('h2', 'text-3xl md:text-4xl font-extrabold text-gray-900 mb-8', {
              text: 'Our Raleigh Studio',
              animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
            }),
            b('div', 'grid grid-cols-1 sm:grid-cols-3 gap-8 text-center', {
              children: [
                infoCard('Hours', 'Tuesday - Saturday\n10 AM - 6 PM'),
                infoCard('Location', 'Raleigh, NC\nSame-Day Pickup Available'),
                infoCard('Contact', 'sassydame23@yahoo.com\n@sassydamedesigns'),
              ],
            }),
          ],
        }),
      ],
    })
  )

  // ── Instagram CTA ──
  blocks.push(
    b('section', 'w-full py-20 px-6 bg-gradient-to-r from-pink-500 to-purple-700 text-center', {
      label: 'Instagram CTA',
      children: [
        b('div', 'max-w-2xl mx-auto', {
          children: [
            b('h2', 'text-3xl font-extrabold text-white mb-4', {
              text: 'Follow the Sass',
              animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
            }),
            b('p', 'text-lg text-white/80 mb-8', {
              text: 'See our latest creations, class schedules, and behind-the-scenes studio life on Instagram.',
            }),
            b('a', 'inline-block rounded-full bg-white px-10 py-4 text-base font-bold text-pink-600 hover:bg-pink-50 transition-all shadow-lg', {
              text: '@sassydamedesigns',
              attrs: { href: 'https://instagram.com/sassydamedesigns', target: '_blank', rel: 'noopener noreferrer' },
            }),
          ],
        }),
      ],
    })
  )

  return blocks
}

function buildShopPage(): Block[] {
  const blocks: Block[] = []

  // ── Hero ──
  blocks.push(
    b('section', 'w-full py-24 px-6 bg-gradient-to-br from-pink-600 to-purple-800 text-center', {
      label: 'Shop Hero',
      animation: { type: 'fadeIn', trigger: 'onMount', duration: 0.6 },
      children: [
        b('div', 'max-w-3xl mx-auto', {
          children: [
            b('h1', 'text-5xl md:text-6xl font-extrabold text-white mb-4', {
              text: 'Browse Our Collections',
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.6, delay: 0.1 },
            }),
            b('p', 'text-xl text-white/70', {
              text: 'From custom DTF transfers to party packages — find everything you need to create.',
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.6, delay: 0.2 },
            }),
          ],
        }),
      ],
    })
  )

  // ── Category Grid ──
  const categories = [
    { name: 'DTF Transfers', slug: 'dtf-prints', desc: 'Full-color gang sheets and custom prints' },
    { name: 'UV DTF Stickers', slug: 'uv-dtf-stickers', desc: 'Waterproof stickers for any surface' },
    { name: 'DTF + UV Bundles', slug: 'dtf-uv-bundle-pack', desc: 'Best value combo packs' },
    { name: 'Crafting Blanks', slug: 'crafting-blanks', desc: 'Tumblers, totes, hats, and more' },
    { name: 'Custom Shirts & Hoodies', slug: 'custom-shirts', desc: 'Premium blanks, your design' },
    { name: 'Signs & Banners', slug: 'signs-banners', desc: 'Event and business signage' },
    { name: 'Classes', slug: 'classes', desc: 'Learn design and printing skills' },
    { name: 'Studio Rentals', slug: 'crafting-studio-rentals', desc: 'Book equipment by the hour' },
    { name: 'Events & Space', slug: 'events-space-rentals', desc: 'Party packages and venue rental' },
    { name: 'Gift Ideas', slug: 'gift-ideas', desc: 'Curated gift bundles and cards' },
    { name: 'Seasonal Collection', slug: 'seasonal-collection', desc: 'Limited edition holiday drops' },
  ]

  blocks.push(
    b('section', 'w-full py-24 px-6 bg-white', {
      label: 'Category Grid',
      children: [
        b('div', 'max-w-6xl mx-auto', {
          children: [
            b('div', 'text-center mb-16', {
              children: [
                b('p', 'text-sm font-bold uppercase tracking-widest text-pink-500 mb-3', { text: 'Categories' }),
                b('h2', 'text-3xl md:text-4xl font-extrabold text-gray-900', {
                  text: 'Shop by Category',
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
                }),
              ],
            }),
            b('div', 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6', {
              children: categories.map((cat, i) =>
                b('a', 'group block rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-all', {
                  attrs: { href: `/shop?cat=${cat.slug}` },
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.4, delay: i * 0.05 },
                  children: [
                    b('h3', 'text-lg font-bold text-gray-900 group-hover:text-pink-500 transition-colors mb-2', { text: cat.name }),
                    b('p', 'text-sm text-gray-500', { text: cat.desc }),
                  ],
                })
              ),
            }),
          ],
        }),
      ],
    })
  )

  // ── Featured Products ──
  blocks.push(
    b('section', 'w-full py-24 px-6 bg-gray-50', {
      label: 'Featured Products',
      children: [
        b('div', 'max-w-6xl mx-auto', {
          children: [
            b('div', 'text-center mb-16', {
              children: [
                b('p', 'text-sm font-bold uppercase tracking-widest text-purple-700 mb-3', { text: 'Popular' }),
                b('h2', 'text-3xl md:text-4xl font-extrabold text-gray-900', {
                  text: 'Best Sellers',
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
                }),
              ],
            }),
            b('div', 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8', {
              children: [
                productCard('Custom DTF Gang Sheet', '$35.00', 'Full-color 22"x28" gang sheet. Upload your designs, we print same day.', 0),
                productCard('UV Sticker Pack (5pc)', '$25.00', 'Five custom UV DTF stickers. Waterproof, scratch-resistant, and vibrant.', 1),
                productCard('Custom T-Shirt', '$30.00', 'Premium Bella+Canvas blank with your DTF design. Sizes S-2XL.', 2),
              ],
            }),
          ],
        }),
      ],
    })
  )

  // ── Custom Orders CTA ──
  blocks.push(
    b('section', 'w-full py-20 px-6 bg-gradient-to-r from-pink-500 to-purple-700 text-center', {
      label: 'Custom Orders CTA',
      children: [
        b('div', 'max-w-2xl mx-auto', {
          children: [
            b('h2', 'text-3xl font-extrabold text-white mb-4', {
              text: 'Need Something Custom?',
              animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
            }),
            b('p', 'text-lg text-white/80 mb-8', {
              text: 'We love custom orders. Send us your design or idea and we\'ll bring it to life. Bulk discounts available.',
            }),
            b('a', 'inline-block rounded-full bg-white px-10 py-4 text-base font-bold text-pink-600 hover:bg-pink-50 transition-all shadow-lg', {
              text: 'Request a Quote',
              attrs: { href: 'mailto:sassydame23@yahoo.com?subject=Custom%20Order%20Request' },
            }),
          ],
        }),
      ],
    })
  )

  return blocks
}

function buildClassesPage(): Block[] {
  const blocks: Block[] = []

  // ── Hero ──
  blocks.push(
    b('section', 'w-full py-28 px-6 bg-gradient-to-br from-purple-700 via-fuchsia-600 to-pink-500 text-center relative overflow-hidden', {
      label: 'Classes Hero',
      animation: { type: 'fadeIn', trigger: 'onMount', duration: 0.7 },
      children: [
        b('div', 'absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,#ffffff10_0%,transparent_50%)]', {}),
        b('div', 'relative z-10 max-w-3xl mx-auto', {
          children: [
            b('h1', 'text-5xl md:text-6xl font-extrabold text-white mb-6', {
              text: 'Learn. Create. Inspire.',
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.6, delay: 0.1 },
            }),
            b('p', 'text-xl text-white/70', {
              text: 'Hands-on workshops and classes for crafters of all levels. Small groups, big creativity.',
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.6, delay: 0.2 },
            }),
          ],
        }),
      ],
    })
  )

  // ── Instructor-Led Classes ──
  blocks.push(
    b('section', 'w-full py-24 px-6 bg-white', {
      label: 'Instructor-Led Classes',
      children: [
        b('div', 'max-w-6xl mx-auto', {
          children: [
            b('div', 'text-center mb-16', {
              children: [
                b('p', 'text-sm font-bold uppercase tracking-widest text-pink-500 mb-3', { text: 'Learn From the Best' }),
                b('h2', 'text-3xl md:text-4xl font-extrabold text-gray-900', {
                  text: 'Featured Classes',
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
                }),
              ],
            }),
            b('div', 'grid grid-cols-1 md:grid-cols-2 gap-8', {
              children: [
                classCard(
                  'Canva Crash Course 101',
                  '$150',
                  'Master Canva for print-ready designs. Learn typography, layout, export settings for DTF and sublimation. 3-hour intensive workshop.',
                  ['Beginner-friendly', 'Laptop required', '3 hours', 'Certificate included'],
                  0
                ),
                classCard(
                  'Rhinestone Master Class',
                  '$135',
                  'Learn professional rhinestone template creation, placement techniques, and heat press application. Take home your own custom piece.',
                  ['All materials included', 'Take home project', '2.5 hours', 'Small group (max 8)'],
                  1
                ),
              ],
            }),
          ],
        }),
      ],
    })
  )

  // ── DIY Party Packages ──
  blocks.push(
    b('section', 'w-full py-24 px-6 bg-gray-50', {
      label: 'DIY Party Packages',
      children: [
        b('div', 'max-w-6xl mx-auto', {
          children: [
            b('div', 'text-center mb-16', {
              children: [
                b('p', 'text-sm font-bold uppercase tracking-widest text-purple-700 mb-3', { text: 'Celebrate & Create' }),
                b('h2', 'text-3xl md:text-4xl font-extrabold text-gray-900', {
                  text: 'DIY Party Packages',
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
                }),
                b('p', 'text-lg text-gray-500 max-w-2xl mx-auto mt-4', {
                  text: 'Perfect for birthdays, bachelorette parties, team building, and girls\' night out. Minimum 6 guests per package.',
                }),
              ],
            }),
            b('div', 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6', {
              children: [
                partyCard('Hat Bar', '$45', 'per person', 'Pick your hat, choose your design, press it on. Walk out with a custom trucker hat.', 0),
                partyCard('Tumbler Decorating', '$85', 'per person', 'Create a custom 40oz tumbler with DTF wraps, rhinestones, and vinyl accents.', 1),
                partyCard('T-Shirt Design', '$65', 'per person', 'Design your own graphic on Canva, print DTF, and press onto a premium tee.', 2),
                partyCard('Crocs Customization', '$65', 'per person', 'Customize Crocs with DTF prints, jibbitz, rhinestones, and paint.', 3),
              ],
            }),
          ],
        }),
      ],
    })
  )

  // ── Studio Rental ──
  blocks.push(
    b('section', 'w-full py-24 px-6 bg-white', {
      label: 'Studio Rental',
      children: [
        b('div', 'max-w-6xl mx-auto', {
          children: [
            b('div', 'text-center mb-16', {
              children: [
                b('p', 'text-sm font-bold uppercase tracking-widest text-pink-500 mb-3', { text: 'DIY Your Way' }),
                b('h2', 'text-3xl md:text-4xl font-extrabold text-gray-900', {
                  text: 'Studio & Equipment Rental',
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
                }),
              ],
            }),
            b('div', 'grid grid-cols-1 sm:grid-cols-3 gap-8', {
              children: [
                rentalCard('Heat Press', '$15', '/hr', 'Standard 15x15 heat press. Perfect for t-shirts, tote bags, and pillows.', 0),
                rentalCard('Hat Press', '$20', '/hr', 'Professional hat press for curved and flat brims. Adjustable heat and time.', 1),
                rentalCard('Full Studio', '$200', '/4 hrs', 'Full studio access: heat press, hat press, vinyl cutter, DTF printer, and workspace.', 2),
              ],
            }),
          ],
        }),
      ],
    })
  )

  // ── Booking CTA ──
  blocks.push(
    b('section', 'w-full py-20 px-6 bg-gradient-to-r from-pink-500 to-purple-700 text-center', {
      label: 'Booking CTA',
      children: [
        b('div', 'max-w-2xl mx-auto', {
          children: [
            b('h2', 'text-3xl font-extrabold text-white mb-4', {
              text: 'Ready to Get Creative?',
              animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
            }),
            b('p', 'text-lg text-white/80 mb-8', {
              text: 'Book a class, reserve the studio, or plan your next party. Spots fill up fast!',
            }),
            b('a', 'inline-block rounded-full bg-white px-10 py-4 text-base font-bold text-pink-600 hover:bg-pink-50 transition-all shadow-lg', {
              text: 'Book Now',
              attrs: { href: 'mailto:sassydame23@yahoo.com?subject=Booking%20Inquiry' },
            }),
          ],
        }),
      ],
    })
  )

  return blocks
}

function buildServicesPage(): Block[] {
  const blocks: Block[] = []

  // ── Hero ──
  blocks.push(
    b('section', 'w-full py-28 px-6 bg-gradient-to-br from-pink-600 via-fuchsia-600 to-purple-800 text-center', {
      label: 'Services Hero',
      animation: { type: 'fadeIn', trigger: 'onMount', duration: 0.7 },
      children: [
        b('div', 'max-w-3xl mx-auto', {
          children: [
            b('h1', 'text-5xl md:text-6xl font-extrabold text-white mb-6', {
              text: 'More Than Just Transfers',
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.6, delay: 0.1 },
            }),
            b('p', 'text-xl text-white/70', {
              text: 'Full-service printing, crafting studio, event space, and custom signage — everything your brand needs.',
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.6, delay: 0.2 },
            }),
          ],
        }),
      ],
    })
  )

  // ── Printing Services ──
  blocks.push(
    b('section', 'w-full py-24 px-6 bg-white', {
      label: 'Printing Services',
      children: [
        b('div', 'max-w-6xl mx-auto', {
          children: [
            b('div', 'text-center mb-16', {
              children: [
                b('p', 'text-sm font-bold uppercase tracking-widest text-pink-500 mb-3', { text: 'Our Core Services' }),
                b('h2', 'text-3xl md:text-4xl font-extrabold text-gray-900', {
                  text: 'Professional Printing',
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
                }),
              ],
            }),
            b('div', 'grid grid-cols-1 md:grid-cols-3 gap-8', {
              children: [
                serviceDetailCard('DTF Transfers', 'Direct-to-film printing for fabric applications. Full color, no minimums, same-day available. Gang sheets from $35.', 'from-pink-500/10 to-fuchsia-500/10', 'text-pink-500', 0),
                serviceDetailCard('UV DTF Stickers', 'UV-cured prints on special adhesive film. Waterproof, scratch-resistant, apply to almost any hard surface.', 'from-purple-500/10 to-indigo-500/10', 'text-purple-600', 1),
                serviceDetailCard('Sublimation', 'Full-wrap sublimation for mugs, tumblers, and polyester garments. Permanent, vibrant, dishwasher-safe.', 'from-fuchsia-500/10 to-pink-500/10', 'text-fuchsia-500', 2),
              ],
            }),
          ],
        }),
      ],
    })
  )

  // ── Signs & Banners ──
  blocks.push(
    b('section', 'w-full py-24 px-6 bg-gray-50', {
      label: 'Signs & Banners',
      children: [
        b('div', 'max-w-4xl mx-auto', {
          children: [
            b('div', 'text-center mb-12', {
              children: [
                b('p', 'text-sm font-bold uppercase tracking-widest text-purple-700 mb-3', { text: 'Business & Events' }),
                b('h2', 'text-3xl md:text-4xl font-extrabold text-gray-900', {
                  text: 'Signs & Banners',
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
                }),
              ],
            }),
            b('div', 'grid grid-cols-1 sm:grid-cols-2 gap-6', {
              children: [
                b('div', 'rounded-2xl bg-white p-8 shadow-sm border border-gray-100', {
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: 0 },
                  children: [
                    b('h3', 'text-xl font-bold text-gray-900 mb-3', { text: 'Yard Signs' }),
                    b('p', 'text-gray-500', { text: 'Corrugated plastic yard signs for real estate, events, elections, and business promotion. Single or double-sided, includes H-stake.' }),
                  ],
                }),
                b('div', 'rounded-2xl bg-white p-8 shadow-sm border border-gray-100', {
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: 0.1 },
                  children: [
                    b('h3', 'text-xl font-bold text-gray-900 mb-3', { text: 'Vinyl Banners' }),
                    b('p', 'text-gray-500', { text: 'Heavy-duty 13oz vinyl banners with grommets. Full-color, weather-resistant. Perfect for storefronts, trade shows, and events.' }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  )

  // ── Equipment Rental ──
  blocks.push(
    b('section', 'w-full py-24 px-6 bg-white', {
      label: 'Equipment Rental',
      children: [
        b('div', 'max-w-6xl mx-auto', {
          children: [
            b('div', 'text-center mb-16', {
              children: [
                b('p', 'text-sm font-bold uppercase tracking-widest text-pink-500 mb-3', { text: 'Rent & Create' }),
                b('h2', 'text-3xl md:text-4xl font-extrabold text-gray-900', {
                  text: 'Equipment Rentals',
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
                }),
                b('p', 'text-lg text-gray-500 mt-4', {
                  text: 'Don\'t want to invest in equipment? Rent ours by the hour. All equipment comes with a quick walkthrough.',
                }),
              ],
            }),
            b('div', 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6', {
              children: [
                equipmentCard('Heat Press (15x15)', '$15/hr', 0),
                equipmentCard('Hat Press', '$20/hr', 1),
                equipmentCard('Vinyl Cutter', '$15/hr', 2),
                equipmentCard('Full Studio (4hr)', '$200', 3),
              ],
            }),
          ],
        }),
      ],
    })
  )

  // ── Event Space ──
  blocks.push(
    b('section', 'w-full py-24 px-6 bg-gray-50', {
      label: 'Event Space',
      children: [
        b('div', 'max-w-4xl mx-auto text-center', {
          children: [
            b('p', 'text-sm font-bold uppercase tracking-widest text-purple-700 mb-3', { text: 'Host Your Event' }),
            b('h2', 'text-3xl md:text-4xl font-extrabold text-gray-900 mb-6', {
              text: 'Event Space Rental',
              animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
            }),
            b('p', 'text-lg text-gray-500 max-w-2xl mx-auto mb-8', {
              text: 'Our studio doubles as an event space for crafting parties, pop-up shops, and small gatherings. Accommodates up to 20 guests with tables, chairs, and A/C.',
            }),
            b('div', 'inline-flex items-center gap-8 bg-white rounded-2xl px-10 py-6 shadow-sm border border-gray-100', {
              children: [
                b('div', 'text-center', {
                  children: [
                    b('p', 'text-2xl font-extrabold text-pink-500', { text: '$75/hr' }),
                    b('p', 'text-sm text-gray-400 mt-1', { text: 'Event space only' }),
                  ],
                }),
                b('div', 'w-px h-12 bg-gray-200', {}),
                b('div', 'text-center', {
                  children: [
                    b('p', 'text-2xl font-extrabold text-purple-700', { text: '$300' }),
                    b('p', 'text-sm text-gray-400 mt-1', { text: 'Full day (8 hours)' }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  )

  // ── Contact Section ──
  blocks.push(
    b('section', 'w-full py-20 px-6 bg-gradient-to-r from-pink-500 to-purple-700 text-center', {
      label: 'Contact',
      children: [
        b('div', 'max-w-2xl mx-auto', {
          children: [
            b('h2', 'text-3xl font-extrabold text-white mb-6', {
              text: 'Get In Touch',
              animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
            }),
            b('div', 'space-y-3 text-lg text-white/80', {
              children: [
                b('p', 'text-white/90', { text: 'sassydame23@yahoo.com' }),
                b('p', 'text-white/90', { text: 'Raleigh, NC' }),
                b('p', 'text-white/90', { text: 'Instagram: @sassydamedesigns' }),
              ],
            }),
            b('a', 'inline-block mt-8 rounded-full bg-white px-10 py-4 text-base font-bold text-pink-600 hover:bg-pink-50 transition-all shadow-lg', {
              text: 'Email Us',
              attrs: { href: 'mailto:sassydame23@yahoo.com' },
            }),
          ],
        }),
      ],
    })
  )

  return blocks
}

// ── Reusable card builder helpers ────────────────────────────────────

function categoryCard(title: string, desc: string, gradient: string, href: string, index: number): Block {
  return b('a', 'group block rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1', {
    attrs: { href },
    animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: index * 0.1 },
    children: [
      b('div', `h-48 bg-gradient-to-br ${gradient} flex items-center justify-center`, {
        children: [
          b('span', 'text-5xl font-extrabold text-white/20 group-hover:text-white/30 transition-colors', {
            text: title.charAt(0),
          }),
        ],
      }),
      b('div', 'p-6 bg-white', {
        children: [
          b('h3', 'text-xl font-bold text-gray-900 group-hover:text-pink-500 transition-colors mb-2', { text: title }),
          b('p', 'text-sm text-gray-500', { text: desc }),
        ],
      }),
    ],
  })
}

function serviceCard(title: string, desc: string, num: string, index: number): Block {
  return b('div', 'rounded-2xl bg-white p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all', {
    animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: index * 0.1 },
    children: [
      b('span', 'text-4xl font-extrabold text-pink-100 mb-4 block', { text: num }),
      b('h3', 'text-lg font-bold text-gray-900 mb-2', { text: title }),
      b('p', 'text-sm text-gray-500 leading-relaxed', { text: desc }),
    ],
  })
}

function statBadge(value: string, label: string): Block {
  return b('div', 'flex flex-col items-center', {
    children: [
      b('span', 'text-3xl font-extrabold text-white', { text: value }),
      b('span', 'text-sm text-white/60 mt-1', { text: label }),
    ],
  })
}

function offerCard(title: string, desc: string, index: number): Block {
  return b('div', 'rounded-2xl bg-white p-8 shadow-sm border border-gray-100', {
    animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: index * 0.1 },
    children: [
      b('div', 'w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 mb-5 flex items-center justify-center', {
        children: [
          b('span', 'text-lg font-bold text-white', { text: title.charAt(0) }),
        ],
      }),
      b('h3', 'text-xl font-bold text-gray-900 mb-3', { text: title }),
      b('p', 'text-gray-500 leading-relaxed', { text: desc }),
    ],
  })
}

function infoCard(title: string, detail: string): Block {
  return b('div', 'rounded-2xl bg-gray-50 p-6', {
    animation: { type: 'fadeIn', trigger: 'inView', duration: 0.5 },
    children: [
      b('h3', 'text-sm font-bold uppercase tracking-widest text-pink-500 mb-3', { text: title }),
      // Split multiline text into separate paragraphs
      ...detail.split('\n').map(line =>
        b('p', 'text-gray-600', { text: line })
      ),
    ],
  })
}

function productCard(title: string, price: string, desc: string, index: number): Block {
  return b('div', 'group rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all', {
    animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: index * 0.1 },
    children: [
      b('div', 'h-48 bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center', {
        children: [
          b('span', 'text-6xl font-extrabold text-pink-200 group-hover:text-pink-300 transition-colors', {
            text: title.charAt(0),
          }),
        ],
      }),
      b('div', 'p-6', {
        children: [
          b('div', 'flex items-center justify-between mb-3', {
            children: [
              b('h3', 'text-lg font-bold text-gray-900', { text: title }),
              b('span', 'text-lg font-extrabold text-pink-500', { text: price }),
            ],
          }),
          b('p', 'text-sm text-gray-500', { text: desc }),
        ],
      }),
    ],
  })
}

function classCard(title: string, price: string, desc: string, features: string[], index: number): Block {
  return b('div', 'rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all', {
    animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: index * 0.15 },
    children: [
      b('div', 'bg-gradient-to-r from-pink-500 to-purple-700 px-8 py-6 flex items-center justify-between', {
        children: [
          b('h3', 'text-xl font-bold text-white', { text: title }),
          b('span', 'text-2xl font-extrabold text-white', { text: price }),
        ],
      }),
      b('div', 'p-8', {
        children: [
          b('p', 'text-gray-500 leading-relaxed mb-6', { text: desc }),
          b('div', 'flex flex-wrap gap-2', {
            children: features.map(f =>
              b('span', 'inline-block rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-600', { text: f })
            ),
          }),
        ],
      }),
    ],
  })
}

function partyCard(title: string, price: string, unit: string, desc: string, index: number): Block {
  return b('div', 'rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all text-center', {
    animation: { type: 'slideUp', trigger: 'inView', duration: 0.4, delay: index * 0.1 },
    children: [
      b('div', 'w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 mx-auto mb-4 flex items-center justify-center', {
        children: [
          b('span', 'text-xl font-bold text-white', { text: title.charAt(0) }),
        ],
      }),
      b('h3', 'text-lg font-bold text-gray-900 mb-1', { text: title }),
      b('p', 'text-2xl font-extrabold text-pink-500', { text: price }),
      b('p', 'text-xs text-gray-400 mb-3', { text: unit }),
      b('p', 'text-sm text-gray-500', { text: desc }),
    ],
  })
}

function rentalCard(title: string, price: string, unit: string, desc: string, index: number): Block {
  return b('div', 'rounded-2xl bg-gray-50 p-8 text-center hover:shadow-lg hover:-translate-y-1 transition-all border border-gray-100', {
    animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: index * 0.1 },
    children: [
      b('h3', 'text-lg font-bold text-gray-900 mb-2', { text: title }),
      b('div', 'flex items-baseline justify-center gap-1 mb-3', {
        children: [
          b('span', 'text-3xl font-extrabold text-pink-500', { text: price }),
          b('span', 'text-sm text-gray-400', { text: unit }),
        ],
      }),
      b('p', 'text-sm text-gray-500', { text: desc }),
    ],
  })
}

function serviceDetailCard(title: string, desc: string, bgGradient: string, textColor: string, index: number): Block {
  return b('div', 'rounded-2xl bg-white p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all', {
    animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: index * 0.1 },
    children: [
      b('div', `w-14 h-14 rounded-xl bg-gradient-to-br ${bgGradient} mb-5 flex items-center justify-center`, {
        children: [
          b('span', `text-xl font-bold ${textColor}`, { text: title.charAt(0) }),
        ],
      }),
      b('h3', 'text-xl font-bold text-gray-900 mb-3', { text: title }),
      b('p', 'text-gray-500 leading-relaxed', { text: desc }),
    ],
  })
}

function equipmentCard(title: string, price: string, index: number): Block {
  return b('div', 'rounded-2xl bg-gray-50 p-6 text-center border border-gray-100 hover:shadow-md transition-all', {
    animation: { type: 'slideUp', trigger: 'inView', duration: 0.4, delay: index * 0.1 },
    children: [
      b('h3', 'text-base font-bold text-gray-900 mb-2', { text: title }),
      b('p', 'text-xl font-extrabold text-pink-500', { text: price }),
    ],
  })
}

// ── Database insertion ───────────────────────────────────────────────

async function main() {
  const subdomainSlug = process.argv.includes('--subdomain')
    ? process.argv[process.argv.indexOf('--subdomain') + 1]
    : 'sassy-dame'

  console.log('\n\ud83c\udfa8 Seeding Sassy Dame Designs...\n')

  // Import prisma client
  const { prisma } = await import('../lib/cms/db/index')

  try {
    // ── 1. Upsert subdomain ──────────────────────────────────────────
    const subdomain = await prisma.subdomain.upsert({
      where: { subdomain: subdomainSlug },
      update: {
        updatedAt: new Date(),
      },
      create: {
        subdomain: subdomainSlug,
      },
    })
    console.log(`  \u2713 Subdomain created: ${subdomain.subdomain} (ID: ${subdomain.id})`)

    // ── 2. Upsert tenant settings ────────────────────────────────────
    await prisma.tenantSetting.upsert({
      where: { tenantId: subdomain.id },
      update: {
        siteName: 'Sassy Dame Designs',
        siteDescription: 'Custom DTF Transfers, Crafts, Workshops & Studio Rentals',
        themeColor: PINK,
        primaryColor: PINK,
        accentColor: PURPLE,
        updatedAt: new Date(),
      },
      create: {
        tenantId: subdomain.id,
        siteName: 'Sassy Dame Designs',
        siteTitle: 'Sassy Dame Designs',
        siteDescription: 'Custom DTF Transfers, Crafts, Workshops & Studio Rentals',
        themeColor: PINK,
        primaryColor: PINK,
        accentColor: PURPLE,
      },
    })
    console.log('  \u2713 Tenant settings configured')

    // ── 3. Create pages ──────────────────────────────────────────────
    const pages: { slug: string; title: string; builder: () => Block[] }[] = [
      { slug: '/', title: 'Home', builder: buildHomePage },
      { slug: 'about', title: 'About Sassy Dame Designs', builder: buildAboutPage },
      { slug: 'shop', title: 'Shop', builder: buildShopPage },
      { slug: 'classes', title: 'Classes & Workshops', builder: buildClassesPage },
      { slug: 'services', title: 'Services', builder: buildServicesPage },
    ]

    for (const p of pages) {
      // Reset ID counter per page for cleaner IDs
      idCounter = 0

      const blocks = p.builder()
      const content = pageContent(blocks)

      await prisma.page.deleteMany({
        where: { slug: p.slug, tenantId: subdomain.id },
      })

      await prisma.page.create({
        data: {
          title: p.title,
          slug: p.slug,
          content: content as any,
          status: 'PUBLISHED',
          tenantId: subdomain.id,
        },
      })
    }
    console.log(`  \u2713 ${pages.length} pages created (${pages.map(p => p.title).join(', ')})`)

    // ── 4. Create categories ─────────────────────────────────────────
    const categoryDefs = [
      { name: 'Direct to Film (DTF)', slug: 'dtf-prints', desc: 'High-quality direct-to-film transfers. Full color, vibrant detail, gang sheets and custom sizes.', position: 1 },
      { name: 'UV DTF Stickers', slug: 'uv-dtf-stickers', desc: 'Durable UV-printed stickers for tumblers, laptops, phone cases, and more.', position: 2 },
      { name: 'DTF + UV Bundle Packs', slug: 'dtf-uv-bundle-pack', desc: 'Best value combo packs with DTF transfers and UV stickers.', position: 3 },
      { name: 'Crafting Blanks', slug: 'crafting-blanks', desc: 'Tumblers, tote bags, hats, and blanks ready for customization.', position: 4 },
      { name: 'Custom Shirts/Hoodies', slug: 'custom-shirts', desc: 'Premium apparel blanks with professional DTF application.', position: 5 },
      { name: 'Signs & Banners', slug: 'signs-banners', desc: 'Custom yard signs, event banners, and business signage.', position: 6 },
      { name: 'Classes', slug: 'classes', desc: 'Hands-on workshops for Canva design, rhinestones, DTF printing, and more.', position: 7 },
      { name: 'Crafting Studio Rentals', slug: 'crafting-studio-rentals', desc: 'Rent heat presses, hat presses, vinyl cutters, and full studio access.', position: 8 },
      { name: 'Events/Space Rentals', slug: 'events-space-rentals', desc: 'DIY party packages and event space rental for up to 20 guests.', position: 9 },
      { name: 'Gift Ideas', slug: 'gift-ideas', desc: 'Curated gift bundles, custom items, and gift cards.', position: 10 },
      { name: 'Seasonal Collection', slug: 'seasonal-collection', desc: 'Limited edition holiday and seasonal designs and products.', position: 11 },
    ]

    // Category slug needs to be unique per tenant — use upsert by finding existing
    const categoryMap: Record<string, string> = {} // slug -> id
    for (const cat of categoryDefs) {
      // Find existing category for this tenant with this slug
      const existing = await prisma.category.findFirst({
        where: { slug: cat.slug, tenantId: subdomain.id },
      })

      if (existing) {
        await prisma.category.update({
          where: { id: existing.id },
          data: {
            name: cat.name,
            description: cat.desc,
            position: cat.position,
          },
        })
        categoryMap[cat.slug] = existing.id
      } else {
        const created = await prisma.category.create({
          data: {
            name: cat.name,
            slug: cat.slug,
            description: cat.desc,
            position: cat.position,
            tenantId: subdomain.id,
          },
        })
        categoryMap[cat.slug] = created.id
      }
    }
    console.log(`  \u2713 ${categoryDefs.length} categories created`)

    // ── 5. Create products ───────────────────────────────────────────

    // Helper to delete existing product by slug+tenant and create new
    async function upsertProduct(data: {
      title: string
      slug: string
      description: string
      basePrice: number
      type: 'SIMPLE' | 'VARIABLE' | 'SERVICE'
      categorySlugs: string[]
      taxable?: boolean
      requiresShipping?: boolean
      stock?: number
      variants?: { name: string; price: number; sku: string }[]
    }) {
      // Remove existing
      const existing = await prisma.product.findFirst({
        where: { slug: data.slug, tenantId: subdomain.id },
      })
      if (existing) {
        await prisma.product.delete({ where: { id: existing.id } })
      }

      const product = await prisma.product.create({
        data: {
          title: data.title,
          slug: data.slug,
          description: data.description,
          basePrice: data.basePrice,
          type: data.type,
          status: 'ACTIVE',
          tenantId: subdomain.id,
          taxable: data.taxable ?? true,
          requiresShipping: data.requiresShipping ?? (data.type !== 'SERVICE'),
          stock: data.stock ?? (data.type === 'SERVICE' ? 0 : 50),
          trackInventory: data.type !== 'SERVICE',
          categories: {
            create: data.categorySlugs
              .filter(slug => categoryMap[slug])
              .map(slug => ({
                categoryId: categoryMap[slug],
              })),
          },
        },
      })

      // Create variants if VARIABLE type
      if (data.type === 'VARIABLE' && data.variants) {
        // Create the Size option
        const option = await prisma.productOption.create({
          data: {
            productId: product.id,
            name: 'Size',
            position: 0,
          },
        })

        for (let i = 0; i < data.variants.length; i++) {
          const v = data.variants[i]
          const optionValue = await prisma.productOptionValue.create({
            data: {
              optionId: option.id,
              value: v.name,
              position: i,
            },
          })

          const variant = await prisma.productVariant.create({
            data: {
              productId: product.id,
              sku: v.sku,
              price: v.price,
              stock: 25,
            },
          })

          await prisma.productVariantOptionValue.create({
            data: {
              variantId: variant.id,
              optionValueId: optionValue.id,
            },
          })
        }
      }

      return product
    }

    await upsertProduct({
      title: 'Custom DTF Gang Sheet (22"x28")',
      slug: 'custom-dtf-gang-sheet-22x28',
      description: 'Full-color direct-to-film gang sheet. Upload your designs and we\'ll arrange them for maximum coverage. 22" x 28" sheet size. Same-day printing available. Ready to heat press onto cotton, polyester, blends, and more.',
      basePrice: 3500, // $35.00 in cents
      type: 'SIMPLE',
      categorySlugs: ['dtf-prints'],
    })

    await upsertProduct({
      title: 'UV DTF Sticker Pack (5 Stickers)',
      slug: 'uv-dtf-sticker-pack-5',
      description: 'Five custom UV DTF stickers printed on premium adhesive film. Waterproof, scratch-resistant, and UV-stable. Perfect for tumblers, laptops, phone cases, and any hard surface. Just peel and apply.',
      basePrice: 2500, // $25.00
      type: 'SIMPLE',
      categorySlugs: ['uv-dtf-stickers'],
    })

    await upsertProduct({
      title: 'Custom T-Shirt (DTF Print)',
      slug: 'custom-tshirt-dtf',
      description: 'Premium Bella+Canvas blank t-shirt with your custom DTF design. Full-color, soft-hand feel, machine washable. Upload your design or work with us to create one.',
      basePrice: 3000, // $30.00
      type: 'VARIABLE',
      categorySlugs: ['custom-shirts'],
      variants: [
        { name: 'S', price: 3000, sku: 'SD-TSHIRT-S' },
        { name: 'M', price: 3000, sku: 'SD-TSHIRT-M' },
        { name: 'L', price: 3000, sku: 'SD-TSHIRT-L' },
        { name: 'XL', price: 3000, sku: 'SD-TSHIRT-XL' },
        { name: '2XL', price: 3500, sku: 'SD-TSHIRT-2XL' },
      ],
    })

    await upsertProduct({
      title: 'Canva Crash Course 101',
      slug: 'canva-crash-course-101',
      description: 'Master Canva for print-ready designs in this 3-hour intensive workshop. Learn typography, layout, color theory, and export settings for DTF and sublimation. Certificate of completion included. Bring your own laptop.',
      basePrice: 15000, // $150.00
      type: 'SERVICE',
      categorySlugs: ['classes'],
      taxable: false,
      requiresShipping: false,
    })

    await upsertProduct({
      title: 'DIY Hat Bar Party Package',
      slug: 'diy-hat-bar-party',
      description: 'The ultimate hat customization party experience. Each guest picks a trucker hat, designs their graphic, and heat presses it on. Price per person, minimum 6 guests. Includes all materials, equipment, and a studio host.',
      basePrice: 4500, // $45.00
      type: 'SERVICE',
      categorySlugs: ['events-space-rentals'],
      taxable: false,
      requiresShipping: false,
    })

    await upsertProduct({
      title: 'Christmas Hoodie (Limited Edition)',
      slug: 'christmas-hoodie-limited-edition',
      description: 'Limited edition holiday hoodie featuring our exclusive Sassy Dame Christmas design. Premium heavyweight fleece with DTF print. Cozy, festive, and uniquely yours. While supplies last.',
      basePrice: 5500, // $55.00
      type: 'SIMPLE',
      categorySlugs: ['seasonal-collection'],
      stock: 30,
    })

    console.log('  \u2713 6 products created')

    // ── 6. Grant super admin ─────────────────────────────────────────
    const adminEmail = 'Bubuneo99@gmail.com'
    await prisma.$executeRawUnsafe(`
      INSERT INTO super_admins (user_id, email, permissions)
      VALUES ($1, $1, '["*"]'::jsonb)
      ON CONFLICT (user_id) DO NOTHING
    `, adminEmail)
    console.log(`  \u2713 Super admin granted: ${adminEmail}`)

    console.log(`\n\ud83c\udf89 Done! Visit: /s/${subdomain.subdomain}\n`)
  } catch (err) {
    console.error('\n  ERROR:', (err as Error).message)
    if ((err as Error).stack) {
      console.error((err as Error).stack)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error('Unhandled error:', err)
  process.exit(1)
})
