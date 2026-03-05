#!/usr/bin/env npx tsx
/**
 * Seed script for Project Dzidzor — a humanitarian/social impact organization
 * working on healthcare, education, and community development in Ghana.
 *
 * Usage:
 *   npx tsx scripts/seed-dzidzor.ts
 */
import 'dotenv/config'

// ── Helpers ──────────────────────────────────────────────────────────

let idCounter = 0
function gid(): string {
  return `dz-${Date.now().toString(36)}-${(idCounter++).toString(36)}`
}

interface Block {
  id: string
  tag: string
  className: string
  textContent?: string
  attrs?: Record<string, string>
  children?: Block[]
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
// Sky blue: #0ea5e9 (hope, trust)   → Tailwind: sky-500
// Emerald:  #059669 (growth, health) → Tailwind: emerald-600

// ── Reusable block builders ──────────────────────────────────────────

function statBlock(value: string, label: string, delay: number): Block {
  return b('div', 'flex flex-col items-center p-6 rounded-2xl bg-white/10 backdrop-blur-sm', {
    animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay },
    children: [
      b('span', 'text-4xl font-bold text-sky-400', { text: value }),
      b('span', 'text-sm text-white/70 mt-2 font-medium', { text: label }),
    ],
  })
}

function initiativeCard(
  title: string,
  description: string,
  metric: string,
  gradient: string,
  index: number
): Block {
  return b('div', 'group rounded-2xl border border-white/10 bg-white/[0.03] p-8 hover:bg-white/[0.06] transition-all hover:-translate-y-1', {
    animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: index * 0.15 },
    children: [
      b('div', `w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5`, {
        children: [
          b('span', 'text-2xl', { text: metric.split(' ')[0] }),
        ],
      }),
      b('h3', 'text-xl font-semibold text-white mb-3', { text: title }),
      b('p', 'text-sm text-white/60 leading-relaxed', { text: description }),
      b('div', 'mt-4 pt-4 border-t border-white/10', {
        children: [
          b('span', 'text-xs font-medium text-sky-400', { text: metric }),
        ],
      }),
    ],
  })
}

function valueCard(title: string, description: string, index: number): Block {
  return b('div', 'p-6 rounded-xl bg-white/[0.03] border border-white/10 text-center', {
    animation: { type: 'fadeIn', trigger: 'inView', duration: 0.5, delay: index * 0.1 },
    children: [
      b('h4', 'text-lg font-semibold text-white mb-2', { text: title }),
      b('p', 'text-sm text-white/60 leading-relaxed', { text: description }),
    ],
  })
}

function donationTier(amount: string, label: string, description: string, index: number): Block {
  return b('div', 'rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center hover:border-sky-500/30 hover:bg-sky-500/5 transition-all', {
    animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: index * 0.1 },
    children: [
      b('span', 'text-3xl font-bold text-sky-400', { text: amount }),
      b('h4', 'text-lg font-semibold text-white mt-3 mb-2', { text: label }),
      b('p', 'text-sm text-white/60 leading-relaxed', { text: description }),
      b('button', 'mt-6 w-full rounded-lg bg-sky-600 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-500 transition-all', {
        text: `Donate ${amount}`,
      }),
    ],
  })
}

// ══════════════════════════════════════════════════════════════════════
// Page 1 — Home
// ══════════════════════════════════════════════════════════════════════

function buildHomePage(): Block[] {
  return [
    // ── Hero ───────────────────────────────────────────────────────────
    b('section', 'w-full min-h-[90vh] flex flex-col items-center justify-center px-6 py-24 bg-gradient-to-b from-sky-950 via-sky-900 to-emerald-950 text-center relative overflow-hidden', {
      label: 'Hero',
      animation: { type: 'fadeIn', trigger: 'onMount', duration: 0.6 },
      children: [
        b('div', 'absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0ea5e920_0%,transparent_70%)]', {
          label: 'Glow',
        }),
        b('div', 'relative z-10 flex flex-col items-center max-w-4xl mx-auto', {
          children: [
            b('span', 'inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-1.5 text-xs font-medium text-sky-300 mb-8', {
              text: 'GuideStar Certified Nonprofit',
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.5, delay: 0.1 },
            }),
            b('h1', 'text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight text-balance', {
              text: 'Empowering Communities, Transforming Lives',
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.7, delay: 0.2 },
            }),
            b('p', 'text-lg md:text-xl text-white/60 max-w-2xl mt-6 leading-relaxed', {
              text: 'Bridging the gap in healthcare, education, and community development for underserved communities in Ghana.',
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.7, delay: 0.3 },
            }),
            b('div', 'flex flex-col sm:flex-row items-center gap-4 mt-10', {
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.7, delay: 0.4 },
              children: [
                b('a', 'rounded-lg bg-sky-500 px-10 py-4 text-base font-semibold text-white hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:-translate-y-0.5', {
                  text: 'Donate Now',
                  attrs: { href: '/s/dzidzor/get-involved' },
                }),
                b('a', 'rounded-lg border border-white/20 bg-white/5 px-10 py-4 text-base font-semibold text-white hover:bg-white/10 transition-all backdrop-blur-sm', {
                  text: 'Learn More',
                  attrs: { href: '/s/dzidzor/about' },
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    // ── Impact Stats ────────────────────────────────────────────────────
    b('section', 'w-full py-20 px-6 bg-sky-950', {
      label: 'Impact Stats',
      children: [
        b('div', 'max-w-5xl mx-auto', {
          children: [
            b('div', 'text-center mb-12', {
              children: [
                b('p', 'text-sm font-semibold uppercase tracking-widest text-emerald-400 mb-3', { text: 'Our Impact' }),
                b('h2', 'text-3xl md:text-4xl font-bold text-white', {
                  text: 'Making a Real Difference',
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
                }),
              ],
            }),
            b('div', 'grid grid-cols-2 md:grid-cols-4 gap-4', {
              children: [
                statBlock('500+', 'Patients Served', 0),
                statBlock('3', 'Active Initiatives', 0.1),
                statBlock('50+', 'Volunteers', 0.2),
                statBlock('2', 'Partner Hospitals', 0.3),
              ],
            }),
          ],
        }),
      ],
    }),

    // ── Mission Preview ──────────────────────────────────────────────────
    b('section', 'w-full py-24 px-6 bg-gradient-to-b from-sky-950 to-slate-950', {
      label: 'Mission Preview',
      children: [
        b('div', 'max-w-4xl mx-auto text-center', {
          children: [
            b('p', 'text-sm font-semibold uppercase tracking-widest text-sky-400 mb-4', {
              text: 'Our Mission',
              animation: { type: 'fadeIn', trigger: 'inView', duration: 0.5 },
            }),
            b('h2', 'text-3xl md:text-5xl font-bold text-white mb-6 leading-tight', {
              text: 'Bridging the Gap in Healthcare and Education',
              animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
            }),
            b('p', 'text-lg text-white/60 leading-relaxed max-w-3xl mx-auto', {
              text: 'Our mission is to provide comprehensive healthcare, quality education, and sustainable community development programs that empower underserved communities in Ghana to thrive. Every dollar donated goes directly to the people who need it most.',
              animation: { type: 'fadeIn', trigger: 'inView', duration: 0.6, delay: 0.2 },
            }),
          ],
        }),
      ],
    }),

    // ── Current Initiatives ──────────────────────────────────────────────
    b('section', 'w-full py-24 px-6 bg-slate-950', {
      label: 'Initiatives',
      children: [
        b('div', 'max-w-6xl mx-auto', {
          children: [
            b('div', 'text-center mb-16', {
              children: [
                b('p', 'text-sm font-semibold uppercase tracking-widest text-emerald-400 mb-3', { text: 'What We Do' }),
                b('h2', 'text-3xl md:text-5xl font-bold text-white mb-4', {
                  text: 'Current Initiatives',
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
                }),
              ],
            }),
            b('div', 'grid grid-cols-1 md:grid-cols-3 gap-8', {
              children: [
                initiativeCard(
                  'Healthcare',
                  'Providing medical supplies, health screenings, and vaccine programs at Akuse Government Hospital and surrounding communities.',
                  '500+ patients served annually',
                  'from-sky-500/20 to-blue-500/20',
                  0
                ),
                initiativeCard(
                  'Education',
                  'Scholarships, school supplies, and mentorship programs helping students access quality education and build brighter futures.',
                  '50+ students supported',
                  'from-emerald-500/20 to-teal-500/20',
                  1
                ),
                initiativeCard(
                  'Community Development',
                  'Infrastructure improvements, clean water access, and skills training programs to build self-sustaining communities.',
                  '3 communities reached',
                  'from-amber-500/20 to-orange-500/20',
                  2
                ),
              ],
            }),
          ],
        }),
      ],
    }),

    // ── Get Involved CTA ─────────────────────────────────────────────────
    b('section', 'w-full py-24 px-6 bg-gradient-to-b from-slate-950 to-sky-950 relative overflow-hidden', {
      label: 'Get Involved CTA',
      children: [
        b('div', 'absolute inset-0 bg-[radial-gradient(circle_at_center,#0ea5e915_0%,transparent_70%)]', {
          label: 'Radial Glow',
        }),
        b('div', 'relative z-10 max-w-4xl mx-auto text-center', {
          children: [
            b('h2', 'text-3xl md:text-5xl font-bold text-white mb-6', {
              text: 'Join the Movement',
              animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
            }),
            b('p', 'text-lg text-white/60 mb-12 max-w-2xl mx-auto', {
              text: 'Whether you volunteer, donate, or shop our merchandise, every action helps transform lives in Ghana.',
            }),
            b('div', 'grid grid-cols-1 sm:grid-cols-3 gap-6', {
              children: [
                b('a', 'rounded-xl bg-sky-500/10 border border-sky-500/20 p-6 text-center hover:bg-sky-500/20 transition-all group', {
                  attrs: { href: '/s/dzidzor/get-involved' },
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: 0 },
                  children: [
                    b('h3', 'text-lg font-semibold text-sky-400 mb-2 group-hover:text-sky-300', { text: 'Volunteer' }),
                    b('p', 'text-sm text-white/50', { text: 'Join a mission trip or help locally' }),
                  ],
                }),
                b('a', 'rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-6 text-center hover:bg-emerald-500/20 transition-all group', {
                  attrs: { href: '/s/dzidzor/get-involved' },
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: 0.1 },
                  children: [
                    b('h3', 'text-lg font-semibold text-emerald-400 mb-2 group-hover:text-emerald-300', { text: 'Donate' }),
                    b('p', 'text-sm text-white/50', { text: 'Fund healthcare and education' }),
                  ],
                }),
                b('a', 'rounded-xl bg-amber-500/10 border border-amber-500/20 p-6 text-center hover:bg-amber-500/20 transition-all group', {
                  attrs: { href: '/s/dzidzor/shop' },
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: 0.2 },
                  children: [
                    b('h3', 'text-lg font-semibold text-amber-400 mb-2 group-hover:text-amber-300', { text: 'Shop' }),
                    b('p', 'text-sm text-white/50', { text: 'Branded merchandise for a cause' }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ]
}

// ══════════════════════════════════════════════════════════════════════
// Page 2 — About
// ══════════════════════════════════════════════════════════════════════

function buildAboutPage(): Block[] {
  return [
    // ── Hero ──
    b('section', 'w-full py-32 px-6 bg-gradient-to-b from-sky-950 to-slate-950 text-center relative overflow-hidden', {
      label: 'Hero',
      animation: { type: 'fadeIn', trigger: 'onMount', duration: 0.6 },
      children: [
        b('div', 'absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0ea5e915_0%,transparent_60%)]', {}),
        b('div', 'relative z-10 max-w-3xl mx-auto', {
          children: [
            b('h1', 'text-5xl md:text-7xl font-bold tracking-tight text-white mb-6', {
              text: 'Our Story',
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.7, delay: 0.1 },
            }),
            b('p', 'text-lg text-white/60 leading-relaxed', {
              text: 'Born from a deep commitment to serve, Project Dzidzor was founded to address the critical gaps in healthcare and education for underserved communities in Ghana.',
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.7, delay: 0.2 },
            }),
          ],
        }),
      ],
    }),

    // ── Origin Story ──
    b('section', 'w-full py-24 px-6 bg-slate-950', {
      label: 'Origin Story',
      children: [
        b('div', 'max-w-4xl mx-auto', {
          children: [
            b('div', 'space-y-8', {
              children: [
                b('div', '', {
                  animation: { type: 'fadeIn', trigger: 'inView', duration: 0.6 },
                  children: [
                    b('h2', 'text-3xl font-bold text-white mb-6', { text: 'Why Dzidzor?' }),
                    b('p', 'text-lg text-white/60 leading-relaxed mb-4', {
                      text: '"Dzidzor" means "joy" in Ewe, a language spoken across southeastern Ghana. It represents the joy we seek to bring to every community we serve — the joy of health, the joy of learning, and the joy of possibility.',
                    }),
                    b('p', 'text-lg text-white/60 leading-relaxed', {
                      text: 'What started as a small initiative to provide medical supplies to Akuse Government Hospital has grown into a multi-faceted organization addressing healthcare, education, and community development needs across the region.',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    // ── Mission & Vision ──
    b('section', 'w-full py-24 px-6 bg-sky-950/50', {
      label: 'Mission & Vision',
      children: [
        b('div', 'max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12', {
          children: [
            b('div', 'p-8 rounded-2xl bg-white/[0.03] border border-sky-500/20', {
              animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: 0 },
              children: [
                b('p', 'text-sm font-semibold uppercase tracking-widest text-sky-400 mb-4', { text: 'Our Mission' }),
                b('p', 'text-lg text-white/70 leading-relaxed', {
                  text: 'To provide comprehensive healthcare, quality education, and sustainable community development programs that empower underserved communities in Ghana to build brighter futures for generations to come.',
                }),
              ],
            }),
            b('div', 'p-8 rounded-2xl bg-white/[0.03] border border-emerald-500/20', {
              animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: 0.15 },
              children: [
                b('p', 'text-sm font-semibold uppercase tracking-widest text-emerald-400 mb-4', { text: 'Our Vision' }),
                b('p', 'text-lg text-white/70 leading-relaxed', {
                  text: 'A Ghana where every community has access to quality healthcare, every child has the opportunity to learn, and every person can live with dignity and hope.',
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    // ── Values ──
    b('section', 'w-full py-24 px-6 bg-slate-950', {
      label: 'Values',
      children: [
        b('div', 'max-w-5xl mx-auto', {
          children: [
            b('div', 'text-center mb-16', {
              children: [
                b('h2', 'text-3xl md:text-4xl font-bold text-white mb-4', {
                  text: 'Our Values',
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
                }),
              ],
            }),
            b('div', 'grid grid-cols-2 md:grid-cols-4 gap-6', {
              children: [
                valueCard('Compassion', 'We lead with empathy, treating every individual with dignity and respect.', 0),
                valueCard('Community', 'We believe in the power of collective action and local ownership.', 1),
                valueCard('Transparency', 'We are accountable stewards of every donation and resource entrusted to us.', 2),
                valueCard('Sustainability', 'We build programs that communities can own and maintain long after we leave.', 3),
              ],
            }),
          ],
        }),
      ],
    }),

    // ── Team ──
    b('section', 'w-full py-24 px-6 bg-gradient-to-b from-slate-950 to-sky-950', {
      label: 'Team',
      children: [
        b('div', 'max-w-5xl mx-auto', {
          children: [
            b('div', 'text-center mb-16', {
              children: [
                b('p', 'text-sm font-semibold uppercase tracking-widest text-sky-400 mb-3', { text: 'Leadership' }),
                b('h2', 'text-3xl md:text-4xl font-bold text-white', {
                  text: 'Meet Our Team',
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
                }),
              ],
            }),
            b('div', 'grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto', {
              children: [
                b('div', 'rounded-2xl bg-white/[0.03] border border-white/10 p-8 text-center', {
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: 0 },
                  children: [
                    b('div', 'w-24 h-24 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 mx-auto mb-4 flex items-center justify-center', {
                      children: [
                        b('span', 'text-3xl font-bold text-white', { text: 'AA' }),
                      ],
                    }),
                    b('h3', 'text-xl font-semibold text-white mb-1', { text: 'Awurabena Amoakwa' }),
                    b('p', 'text-sm text-sky-400 mb-3', { text: 'Founder & Executive Director' }),
                    b('p', 'text-sm text-white/50 leading-relaxed', {
                      text: 'Driven by a passion for community service and a vision for equitable healthcare access across Ghana.',
                    }),
                  ],
                }),
                b('div', 'rounded-2xl bg-white/[0.03] border border-white/10 p-8 text-center', {
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: 0.15 },
                  children: [
                    b('div', 'w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 mx-auto mb-4 flex items-center justify-center', {
                      children: [
                        b('span', 'text-3xl font-bold text-white', { text: 'TA' }),
                      ],
                    }),
                    b('h3', 'text-xl font-semibold text-white mb-1', { text: 'Tinuke Akintayo' }),
                    b('p', 'text-sm text-emerald-400 mb-3', { text: 'Director of Operations' }),
                    b('p', 'text-sm text-white/50 leading-relaxed', {
                      text: 'Bringing operational expertise and a heart for sustainable development to every initiative we undertake.',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    // ── GuideStar Badge ──
    b('section', 'w-full py-16 px-6 bg-sky-950', {
      label: 'GuideStar',
      children: [
        b('div', 'max-w-3xl mx-auto text-center', {
          animation: { type: 'fadeIn', trigger: 'inView', duration: 0.6 },
          children: [
            b('div', 'inline-flex items-center gap-3 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-6 py-3', {
              children: [
                b('span', 'text-emerald-400 font-semibold text-sm', { text: 'GuideStar / Candid Verified Nonprofit' }),
              ],
            }),
            b('p', 'text-sm text-white/40 mt-4', {
              text: 'Project Dzidzor is a verified 501(c)(3) organization. All donations are tax-deductible.',
            }),
          ],
        }),
      ],
    }),
  ]
}

// ══════════════════════════════════════════════════════════════════════
// Page 3 — Initiatives
// ══════════════════════════════════════════════════════════════════════

function buildInitiativesPage(): Block[] {
  return [
    // ── Hero ──
    b('section', 'w-full py-32 px-6 bg-gradient-to-b from-emerald-950 to-slate-950 text-center relative overflow-hidden', {
      label: 'Hero',
      animation: { type: 'fadeIn', trigger: 'onMount', duration: 0.6 },
      children: [
        b('div', 'absolute inset-0 bg-[radial-gradient(ellipse_at_top,#05966920_0%,transparent_60%)]', {}),
        b('div', 'relative z-10 max-w-3xl mx-auto', {
          children: [
            b('h1', 'text-5xl md:text-7xl font-bold tracking-tight text-white mb-6', {
              text: 'Making a Difference',
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.7, delay: 0.1 },
            }),
            b('p', 'text-lg text-white/60 leading-relaxed', {
              text: 'Every initiative is designed to create lasting, sustainable change in the communities we serve.',
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.7, delay: 0.2 },
            }),
          ],
        }),
      ],
    }),

    // ── Healthcare Initiative ──
    b('section', 'w-full py-24 px-6 bg-slate-950', {
      label: 'Healthcare',
      children: [
        b('div', 'max-w-5xl mx-auto', {
          children: [
            b('div', 'grid grid-cols-1 md:grid-cols-2 gap-12 items-center', {
              children: [
                b('div', '', {
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
                  children: [
                    b('span', 'inline-block rounded-full bg-sky-500/10 border border-sky-500/20 px-4 py-1 text-xs font-medium text-sky-400 mb-4', { text: 'Initiative 01' }),
                    b('h2', 'text-3xl md:text-4xl font-bold text-white mb-4', { text: 'Healthcare Access' }),
                    b('p', 'text-lg text-white/60 leading-relaxed mb-6', {
                      text: 'We partner with Akuse Government Hospital and community clinics to deliver essential medical supplies, organize health screening events, and support vaccine distribution programs across the Eastern Region.',
                    }),
                    b('div', 'space-y-3', {
                      children: [
                        b('div', 'flex items-center gap-3', {
                          children: [
                            b('div', 'w-2 h-2 rounded-full bg-sky-400', {}),
                            b('span', 'text-sm text-white/70', { text: 'Medical supply distribution to Akuse Hospital' }),
                          ],
                        }),
                        b('div', 'flex items-center gap-3', {
                          children: [
                            b('div', 'w-2 h-2 rounded-full bg-sky-400', {}),
                            b('span', 'text-sm text-white/70', { text: 'Community health screening events' }),
                          ],
                        }),
                        b('div', 'flex items-center gap-3', {
                          children: [
                            b('div', 'w-2 h-2 rounded-full bg-sky-400', {}),
                            b('span', 'text-sm text-white/70', { text: 'Vaccine support and immunization drives' }),
                          ],
                        }),
                        b('div', 'flex items-center gap-3', {
                          children: [
                            b('div', 'w-2 h-2 rounded-full bg-sky-400', {}),
                            b('span', 'text-sm text-white/70', { text: 'Maternal and child health programs' }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                b('div', 'rounded-2xl bg-gradient-to-br from-sky-500/10 to-blue-500/10 border border-sky-500/20 p-10 text-center', {
                  animation: { type: 'fadeIn', trigger: 'inView', duration: 0.6, delay: 0.2 },
                  children: [
                    b('span', 'text-5xl font-bold text-sky-400', { text: '500+' }),
                    b('p', 'text-white/70 mt-2 font-medium', { text: 'Patients Served' }),
                    b('div', 'w-full bg-white/10 rounded-full h-2 mt-6', {
                      children: [
                        b('div', 'bg-sky-500 h-2 rounded-full w-3/4', {}),
                      ],
                    }),
                    b('p', 'text-xs text-white/40 mt-2', { text: '75% of annual target reached' }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    // ── Education Initiative ──
    b('section', 'w-full py-24 px-6 bg-emerald-950/30', {
      label: 'Education',
      children: [
        b('div', 'max-w-5xl mx-auto', {
          children: [
            b('div', 'grid grid-cols-1 md:grid-cols-2 gap-12 items-center', {
              children: [
                b('div', 'rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-10 text-center order-2 md:order-1', {
                  animation: { type: 'fadeIn', trigger: 'inView', duration: 0.6 },
                  children: [
                    b('span', 'text-5xl font-bold text-emerald-400', { text: '50+' }),
                    b('p', 'text-white/70 mt-2 font-medium', { text: 'Students Supported' }),
                    b('div', 'w-full bg-white/10 rounded-full h-2 mt-6', {
                      children: [
                        b('div', 'bg-emerald-500 h-2 rounded-full w-1/2', {}),
                      ],
                    }),
                    b('p', 'text-xs text-white/40 mt-2', { text: '50% of scholarship goal reached' }),
                  ],
                }),
                b('div', 'order-1 md:order-2', {
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
                  children: [
                    b('span', 'inline-block rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1 text-xs font-medium text-emerald-400 mb-4', { text: 'Initiative 02' }),
                    b('h2', 'text-3xl md:text-4xl font-bold text-white mb-4', { text: 'Education & Scholarships' }),
                    b('p', 'text-lg text-white/60 leading-relaxed mb-6', {
                      text: 'We believe education is the most powerful tool for breaking the cycle of poverty. Our scholarship program provides tuition, school supplies, and mentorship to students who otherwise could not afford to continue their education.',
                    }),
                    b('div', 'space-y-3', {
                      children: [
                        b('div', 'flex items-center gap-3', {
                          children: [
                            b('div', 'w-2 h-2 rounded-full bg-emerald-400', {}),
                            b('span', 'text-sm text-white/70', { text: 'Full and partial scholarship program' }),
                          ],
                        }),
                        b('div', 'flex items-center gap-3', {
                          children: [
                            b('div', 'w-2 h-2 rounded-full bg-emerald-400', {}),
                            b('span', 'text-sm text-white/70', { text: 'School supplies and uniforms distribution' }),
                          ],
                        }),
                        b('div', 'flex items-center gap-3', {
                          children: [
                            b('div', 'w-2 h-2 rounded-full bg-emerald-400', {}),
                            b('span', 'text-sm text-white/70', { text: 'Mentorship and career guidance' }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    // ── Community Development ──
    b('section', 'w-full py-24 px-6 bg-slate-950', {
      label: 'Community Development',
      children: [
        b('div', 'max-w-5xl mx-auto', {
          children: [
            b('div', 'grid grid-cols-1 md:grid-cols-2 gap-12 items-center', {
              children: [
                b('div', '', {
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
                  children: [
                    b('span', 'inline-block rounded-full bg-amber-500/10 border border-amber-500/20 px-4 py-1 text-xs font-medium text-amber-400 mb-4', { text: 'Initiative 03' }),
                    b('h2', 'text-3xl md:text-4xl font-bold text-white mb-4', { text: 'Community Development' }),
                    b('p', 'text-lg text-white/60 leading-relaxed mb-6', {
                      text: 'Sustainable development means building communities that can thrive independently. We invest in infrastructure, clean water initiatives, and vocational skills training to create lasting economic opportunity.',
                    }),
                    b('div', 'space-y-3', {
                      children: [
                        b('div', 'flex items-center gap-3', {
                          children: [
                            b('div', 'w-2 h-2 rounded-full bg-amber-400', {}),
                            b('span', 'text-sm text-white/70', { text: 'Community infrastructure projects' }),
                          ],
                        }),
                        b('div', 'flex items-center gap-3', {
                          children: [
                            b('div', 'w-2 h-2 rounded-full bg-amber-400', {}),
                            b('span', 'text-sm text-white/70', { text: 'Clean water access programs' }),
                          ],
                        }),
                        b('div', 'flex items-center gap-3', {
                          children: [
                            b('div', 'w-2 h-2 rounded-full bg-amber-400', {}),
                            b('span', 'text-sm text-white/70', { text: 'Vocational and skills training' }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                b('div', 'rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-10 text-center', {
                  animation: { type: 'fadeIn', trigger: 'inView', duration: 0.6, delay: 0.2 },
                  children: [
                    b('span', 'text-5xl font-bold text-amber-400', { text: '3' }),
                    b('p', 'text-white/70 mt-2 font-medium', { text: 'Communities Reached' }),
                    b('div', 'w-full bg-white/10 rounded-full h-2 mt-6', {
                      children: [
                        b('div', 'bg-amber-500 h-2 rounded-full w-1/3', {}),
                      ],
                    }),
                    b('p', 'text-xs text-white/40 mt-2', { text: 'Growing to 10 communities by 2027' }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    // ── Support CTA ──
    b('section', 'w-full py-24 px-6 bg-gradient-to-b from-slate-950 to-emerald-950 text-center', {
      label: 'Support CTA',
      children: [
        b('div', 'max-w-3xl mx-auto', {
          children: [
            b('h2', 'text-3xl md:text-5xl font-bold text-white mb-6', {
              text: 'Support an Initiative',
              animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
            }),
            b('p', 'text-lg text-white/60 mb-10', {
              text: 'Choose the initiative closest to your heart and make a direct impact today.',
            }),
            b('a', 'inline-block rounded-lg bg-emerald-600 px-10 py-4 text-base font-semibold text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/25 hover:-translate-y-0.5', {
              text: 'Donate Now',
              attrs: { href: '/s/dzidzor/get-involved' },
            }),
          ],
        }),
      ],
    }),
  ]
}

// ══════════════════════════════════════════════════════════════════════
// Page 4 — Get Involved
// ══════════════════════════════════════════════════════════════════════

function buildGetInvolvedPage(): Block[] {
  return [
    // ── Hero ──
    b('section', 'w-full py-32 px-6 bg-gradient-to-b from-sky-950 via-sky-900 to-slate-950 text-center relative overflow-hidden', {
      label: 'Hero',
      animation: { type: 'fadeIn', trigger: 'onMount', duration: 0.6 },
      children: [
        b('div', 'absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0ea5e920_0%,transparent_70%)]', {}),
        b('div', 'relative z-10 max-w-3xl mx-auto', {
          children: [
            b('h1', 'text-5xl md:text-7xl font-bold tracking-tight text-white mb-6', {
              text: 'Join the Movement',
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.7, delay: 0.1 },
            }),
            b('p', 'text-lg text-white/60 leading-relaxed', {
              text: 'Every action, no matter how small, creates ripples of change that transform entire communities.',
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.7, delay: 0.2 },
            }),
          ],
        }),
      ],
    }),

    // ── Donation Tiers ──
    b('section', 'w-full py-24 px-6 bg-slate-950', {
      label: 'Donation Tiers',
      children: [
        b('div', 'max-w-5xl mx-auto', {
          children: [
            b('div', 'text-center mb-16', {
              children: [
                b('p', 'text-sm font-semibold uppercase tracking-widest text-sky-400 mb-3', { text: 'Make a Gift' }),
                b('h2', 'text-3xl md:text-5xl font-bold text-white mb-4', {
                  text: 'Every Dollar Counts',
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
                }),
                b('p', 'text-lg text-white/50 max-w-2xl mx-auto', {
                  text: 'Donate via PayPal, CashApp ($ProjectDzidzor), or Stripe. All donations are tax-deductible.',
                }),
              ],
            }),
            b('div', 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6', {
              children: [
                donationTier('$25', 'Medical Supplies', 'Provides essential medical supplies for one patient at Akuse Hospital.', 0),
                donationTier('$50', 'Health Screening', 'Funds a complete health screening for a community member.', 1),
                donationTier('$100', 'Scholarship', 'Covers one term of school fees and supplies for a student.', 2),
                donationTier('$250', 'Community Project', 'Seeds a local infrastructure or clean water project.', 3),
              ],
            }),
          ],
        }),
      ],
    }),

    // ── Volunteer ──
    b('section', 'w-full py-24 px-6 bg-emerald-950/30', {
      label: 'Volunteer',
      children: [
        b('div', 'max-w-5xl mx-auto', {
          children: [
            b('div', 'text-center mb-16', {
              children: [
                b('p', 'text-sm font-semibold uppercase tracking-widest text-emerald-400 mb-3', { text: 'Volunteer' }),
                b('h2', 'text-3xl md:text-5xl font-bold text-white mb-4', {
                  text: 'Give Your Time',
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
                }),
              ],
            }),
            b('div', 'grid grid-cols-1 md:grid-cols-3 gap-8', {
              children: [
                b('div', 'rounded-2xl bg-white/[0.03] border border-white/10 p-8', {
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: 0 },
                  children: [
                    b('h3', 'text-xl font-semibold text-white mb-3', { text: 'Mission Trips' }),
                    b('p', 'text-sm text-white/60 leading-relaxed', {
                      text: 'Join us in Ghana for hands-on service. Trip durations range from one to four weeks and include healthcare outreach, school builds, and community engagement.',
                    }),
                  ],
                }),
                b('div', 'rounded-2xl bg-white/[0.03] border border-white/10 p-8', {
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: 0.1 },
                  children: [
                    b('h3', 'text-xl font-semibold text-white mb-3', { text: 'Local Fundraising' }),
                    b('p', 'text-sm text-white/60 leading-relaxed', {
                      text: 'Organize events in your community — bake sales, run-a-thons, benefit dinners. We provide materials, guidance, and support to make your event a success.',
                    }),
                  ],
                }),
                b('div', 'rounded-2xl bg-white/[0.03] border border-white/10 p-8', {
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: 0.2 },
                  children: [
                    b('h3', 'text-xl font-semibold text-white mb-3', { text: 'Social Media Advocacy' }),
                    b('p', 'text-sm text-white/60 leading-relaxed', {
                      text: 'Share our story online. Follow us, repost our content, and help spread awareness about the communities we serve.',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    // ── Travel Info ──
    b('section', 'w-full py-24 px-6 bg-slate-950', {
      label: 'Travel Requirements',
      children: [
        b('div', 'max-w-4xl mx-auto', {
          children: [
            b('div', 'text-center mb-12', {
              children: [
                b('h2', 'text-3xl font-bold text-white mb-4', {
                  text: 'Mission Trip Requirements',
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
                }),
                b('p', 'text-white/50', { text: 'Planning to visit Ghana with us? Here is what you need.' }),
              ],
            }),
            b('div', 'grid grid-cols-1 md:grid-cols-3 gap-6', {
              children: [
                b('div', 'rounded-xl bg-white/[0.03] border border-white/10 p-6', {
                  animation: { type: 'fadeIn', trigger: 'inView', duration: 0.5, delay: 0 },
                  children: [
                    b('h4', 'text-lg font-semibold text-sky-400 mb-2', { text: 'Passport & Visa' }),
                    b('p', 'text-sm text-white/60', { text: 'Valid passport (6+ months remaining) and Ghana tourist visa required. We assist with visa application letters.' }),
                  ],
                }),
                b('div', 'rounded-xl bg-white/[0.03] border border-white/10 p-6', {
                  animation: { type: 'fadeIn', trigger: 'inView', duration: 0.5, delay: 0.1 },
                  children: [
                    b('h4', 'text-lg font-semibold text-sky-400 mb-2', { text: 'Vaccinations' }),
                    b('p', 'text-sm text-white/60', { text: 'Yellow Fever vaccination required. Hepatitis A/B, Typhoid, and malaria prophylaxis strongly recommended.' }),
                  ],
                }),
                b('div', 'rounded-xl bg-white/[0.03] border border-white/10 p-6', {
                  animation: { type: 'fadeIn', trigger: 'inView', duration: 0.5, delay: 0.2 },
                  children: [
                    b('h4', 'text-lg font-semibold text-sky-400 mb-2', { text: 'Travel Insurance' }),
                    b('p', 'text-sm text-white/60', { text: 'Comprehensive travel and health insurance is required for all mission trip participants.' }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    // ── Partner With Us ──
    b('section', 'w-full py-24 px-6 bg-gradient-to-b from-slate-950 to-sky-950', {
      label: 'Partnerships',
      children: [
        b('div', 'max-w-4xl mx-auto text-center', {
          children: [
            b('p', 'text-sm font-semibold uppercase tracking-widest text-emerald-400 mb-3', { text: 'Partnerships' }),
            b('h2', 'text-3xl md:text-5xl font-bold text-white mb-6', {
              text: 'Partner With Us',
              animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
            }),
            b('p', 'text-lg text-white/60 leading-relaxed max-w-2xl mx-auto mb-10', {
              text: 'We welcome corporate partnerships, matching gift programs, and co-branded fundraising events. Together, we can multiply our impact.',
            }),
            b('a', 'inline-block rounded-lg bg-sky-500 px-10 py-4 text-base font-semibold text-white hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/25 hover:-translate-y-0.5', {
              text: 'Contact Us',
              attrs: { href: 'mailto:Bubuneo99@gmail.com' },
            }),
          ],
        }),
      ],
    }),
  ]
}

// ══════════════════════════════════════════════════════════════════════
// Page 5 — Shop
// ══════════════════════════════════════════════════════════════════════

function buildShopPage(): Block[] {
  return [
    // ── Hero ──
    b('section', 'w-full py-32 px-6 bg-gradient-to-b from-sky-950 to-slate-950 text-center relative overflow-hidden', {
      label: 'Hero',
      animation: { type: 'fadeIn', trigger: 'onMount', duration: 0.6 },
      children: [
        b('div', 'absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0ea5e915_0%,transparent_70%)]', {}),
        b('div', 'relative z-10 max-w-3xl mx-auto', {
          children: [
            b('h1', 'text-5xl md:text-7xl font-bold tracking-tight text-white mb-6', {
              text: 'Shop for a Cause',
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.7, delay: 0.1 },
            }),
            b('p', 'text-lg text-white/60 leading-relaxed', {
              text: 'Every purchase directly funds our healthcare, education, and community development initiatives in Ghana.',
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.7, delay: 0.2 },
            }),
          ],
        }),
      ],
    }),

    // ── Trust Message ──
    b('section', 'w-full py-12 px-6 bg-emerald-950/30', {
      label: 'Trust Message',
      children: [
        b('div', 'max-w-4xl mx-auto text-center', {
          animation: { type: 'fadeIn', trigger: 'inView', duration: 0.5 },
          children: [
            b('div', 'inline-flex items-center gap-3 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-6 py-3', {
              children: [
                b('span', 'text-emerald-400 font-semibold text-sm', { text: '100% of profits fund our initiatives' }),
              ],
            }),
          ],
        }),
      ],
    }),

    // ── Featured Products ──
    b('section', 'w-full py-24 px-6 bg-slate-950', {
      label: 'Featured Products',
      children: [
        b('div', 'max-w-6xl mx-auto', {
          children: [
            b('div', 'text-center mb-16', {
              children: [
                b('p', 'text-sm font-semibold uppercase tracking-widest text-sky-400 mb-3', { text: 'Shop' }),
                b('h2', 'text-3xl md:text-5xl font-bold text-white mb-4', {
                  text: 'Featured Merchandise',
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
                }),
              ],
            }),
            b('div', 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8', {
              children: [
                // Product 1 — Classic Tee
                b('div', 'group rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-sky-500/30 transition-all', {
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: 0 },
                  children: [
                    b('div', 'h-64 bg-gradient-to-br from-sky-900/40 to-sky-800/20 flex items-center justify-center', {
                      children: [
                        b('span', 'text-6xl font-bold text-sky-500/30', { text: 'PD' }),
                      ],
                    }),
                    b('div', 'p-6', {
                      children: [
                        b('h3', 'text-lg font-semibold text-white mb-1', { text: 'Classic T-Shirt' }),
                        b('p', 'text-sm text-white/50 mb-3', { text: 'Premium cotton tee with the Project Dzidzor logo' }),
                        b('div', 'flex items-center justify-between', {
                          children: [
                            b('span', 'text-xl font-bold text-sky-400', { text: '$30' }),
                            b('span', 'text-xs text-white/40', { text: 'S / M / L / XL / 2XL' }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                // Product 2 — Thrive Collection
                b('div', 'group rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-emerald-500/30 transition-all', {
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: 0.1 },
                  children: [
                    b('div', 'h-64 bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 flex items-center justify-center', {
                      children: [
                        b('span', 'text-5xl font-bold text-emerald-500/30', { text: 'Thrive' }),
                      ],
                    }),
                    b('div', 'p-6', {
                      children: [
                        b('h3', 'text-lg font-semibold text-white mb-1', { text: 'Thrive Collection Tee' }),
                        b('p', 'text-sm text-white/50 mb-3', { text: 'Limited edition design celebrating community resilience' }),
                        b('div', 'flex items-center justify-between', {
                          children: [
                            b('span', 'text-xl font-bold text-emerald-400', { text: '$35' }),
                            b('span', 'text-xs text-white/40', { text: 'S / M / L / XL' }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                // Product 3 — Water Bottle
                b('div', 'group rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-amber-500/30 transition-all', {
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: 0.2 },
                  children: [
                    b('div', 'h-64 bg-gradient-to-br from-amber-900/40 to-amber-800/20 flex items-center justify-center', {
                      children: [
                        b('span', 'text-6xl font-bold text-amber-500/30', { text: 'H2O' }),
                      ],
                    }),
                    b('div', 'p-6', {
                      children: [
                        b('h3', 'text-lg font-semibold text-white mb-1', { text: 'Water Bottle' }),
                        b('p', 'text-sm text-white/50 mb-3', { text: 'Insulated stainless steel bottle with Project Dzidzor branding' }),
                        b('div', 'flex items-center justify-between', {
                          children: [
                            b('span', 'text-xl font-bold text-amber-400', { text: '$20' }),
                            b('span', 'text-xs text-white/40', { text: 'One size' }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    // ── Categories ──
    b('section', 'w-full py-16 px-6 bg-sky-950/30', {
      label: 'Categories',
      children: [
        b('div', 'max-w-4xl mx-auto', {
          children: [
            b('div', 'grid grid-cols-2 md:grid-cols-4 gap-4', {
              children: [
                b('div', 'rounded-xl bg-white/[0.03] border border-white/10 p-6 text-center hover:bg-white/[0.06] transition-all cursor-pointer', {
                  animation: { type: 'fadeIn', trigger: 'inView', duration: 0.4, delay: 0 },
                  children: [
                    b('h4', 'text-sm font-semibold text-white', { text: 'T-Shirts & Apparel' }),
                  ],
                }),
                b('div', 'rounded-xl bg-white/[0.03] border border-white/10 p-6 text-center hover:bg-white/[0.06] transition-all cursor-pointer', {
                  animation: { type: 'fadeIn', trigger: 'inView', duration: 0.4, delay: 0.05 },
                  children: [
                    b('h4', 'text-sm font-semibold text-white', { text: 'Accessories' }),
                  ],
                }),
                b('div', 'rounded-xl bg-white/[0.03] border border-white/10 p-6 text-center hover:bg-white/[0.06] transition-all cursor-pointer', {
                  animation: { type: 'fadeIn', trigger: 'inView', duration: 0.4, delay: 0.1 },
                  children: [
                    b('h4', 'text-sm font-semibold text-white', { text: 'Bundles & Gift Sets' }),
                  ],
                }),
                b('div', 'rounded-xl bg-white/[0.03] border border-white/10 p-6 text-center hover:bg-white/[0.06] transition-all cursor-pointer', {
                  animation: { type: 'fadeIn', trigger: 'inView', duration: 0.4, delay: 0.15 },
                  children: [
                    b('h4', 'text-sm font-semibold text-white', { text: 'Donation Tiers' }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    // ── Impact Bundle ──
    b('section', 'w-full py-24 px-6 bg-slate-950', {
      label: 'Impact Bundle',
      children: [
        b('div', 'max-w-4xl mx-auto', {
          children: [
            b('div', 'rounded-2xl bg-gradient-to-r from-sky-500/10 to-emerald-500/10 border border-sky-500/20 p-12 flex flex-col md:flex-row items-center gap-8', {
              animation: { type: 'fadeIn', trigger: 'inView', duration: 0.6 },
              children: [
                b('div', 'flex-1', {
                  children: [
                    b('span', 'inline-block text-xs font-medium text-sky-400 bg-sky-400/10 px-3 py-1 rounded-full mb-4', { text: 'Best Value' }),
                    b('h3', 'text-2xl font-bold text-white mb-2', { text: 'Impact Bundle' }),
                    b('p', 'text-white/60 mb-4', { text: 'Classic T-Shirt + Water Bottle. Save $5 and maximize your impact.' }),
                    b('span', 'text-3xl font-bold text-sky-400', { text: '$45' }),
                    b('span', 'text-sm text-white/40 ml-2 line-through', { text: '$50' }),
                  ],
                }),
                b('button', 'rounded-lg bg-sky-500 px-8 py-4 text-base font-semibold text-white hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/25 hover:-translate-y-0.5 whitespace-nowrap', {
                  text: 'Add to Cart',
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    // ── Gift Cards ──
    b('section', 'w-full py-16 px-6 bg-gradient-to-b from-slate-950 to-sky-950 text-center', {
      label: 'Gift Cards',
      children: [
        b('div', 'max-w-3xl mx-auto', {
          children: [
            b('h2', 'text-2xl font-bold text-white mb-4', {
              text: 'Gift Cards Available',
              animation: { type: 'slideUp', trigger: 'inView', duration: 0.5 },
            }),
            b('p', 'text-white/60 mb-6', {
              text: 'Share the joy of giving. Purchase a Project Dzidzor gift card for someone who cares about making a difference.',
            }),
            b('p', 'text-sm text-white/40', { text: 'Coming soon — email Bubuneo99@gmail.com for custom gift amounts.' }),
          ],
        }),
      ],
    }),
  ]
}

// ══════════════════════════════════════════════════════════════════════
// Page 6 — Updates
// ══════════════════════════════════════════════════════════════════════

function buildUpdatesPage(): Block[] {
  return [
    // ── Hero ──
    b('section', 'w-full py-32 px-6 bg-gradient-to-b from-sky-950 to-slate-950 text-center relative overflow-hidden', {
      label: 'Hero',
      animation: { type: 'fadeIn', trigger: 'onMount', duration: 0.6 },
      children: [
        b('div', 'absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0ea5e915_0%,transparent_60%)]', {}),
        b('div', 'relative z-10 max-w-3xl mx-auto', {
          children: [
            b('h1', 'text-5xl md:text-7xl font-bold tracking-tight text-white mb-6', {
              text: 'Stay Connected',
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.7, delay: 0.1 },
            }),
            b('p', 'text-lg text-white/60 leading-relaxed', {
              text: 'Stories of impact, community updates, and ways you can help.',
              animation: { type: 'slideUp', trigger: 'onMount', duration: 0.7, delay: 0.2 },
            }),
          ],
        }),
      ],
    }),

    // ── Latest Updates Grid ──
    b('section', 'w-full py-24 px-6 bg-slate-950', {
      label: 'Latest Updates',
      children: [
        b('div', 'max-w-6xl mx-auto', {
          children: [
            b('div', 'text-center mb-16', {
              children: [
                b('p', 'text-sm font-semibold uppercase tracking-widest text-sky-400 mb-3', { text: 'Latest' }),
                b('h2', 'text-3xl md:text-5xl font-bold text-white mb-4', {
                  text: 'News & Updates',
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
                }),
              ],
            }),
            b('div', 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8', {
              children: [
                // Blog post placeholder 1
                b('div', 'group rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-sky-500/30 transition-all', {
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: 0 },
                  children: [
                    b('div', 'h-48 bg-gradient-to-br from-sky-900/40 to-emerald-900/20', {}),
                    b('div', 'p-6', {
                      children: [
                        b('span', 'text-xs text-sky-400 font-medium', { text: 'Healthcare' }),
                        b('h3', 'text-lg font-semibold text-white mt-2 mb-2 group-hover:text-sky-400 transition-colors', {
                          text: 'Medical Supply Delivery to Akuse Hospital',
                        }),
                        b('p', 'text-sm text-white/50 leading-relaxed', {
                          text: 'Our latest shipment of essential medical supplies reached Akuse Government Hospital, providing equipment for over 200 patients.',
                        }),
                        b('span', 'text-xs text-white/30 mt-4 block', { text: 'March 2026' }),
                      ],
                    }),
                  ],
                }),
                // Blog post placeholder 2
                b('div', 'group rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-emerald-500/30 transition-all', {
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: 0.1 },
                  children: [
                    b('div', 'h-48 bg-gradient-to-br from-emerald-900/40 to-teal-900/20', {}),
                    b('div', 'p-6', {
                      children: [
                        b('span', 'text-xs text-emerald-400 font-medium', { text: 'Education' }),
                        b('h3', 'text-lg font-semibold text-white mt-2 mb-2 group-hover:text-emerald-400 transition-colors', {
                          text: '2026 Scholarship Recipients Announced',
                        }),
                        b('p', 'text-sm text-white/50 leading-relaxed', {
                          text: 'We are thrilled to announce 15 new scholarship recipients who will continue their education with our support.',
                        }),
                        b('span', 'text-xs text-white/30 mt-4 block', { text: 'February 2026' }),
                      ],
                    }),
                  ],
                }),
                // Blog post placeholder 3
                b('div', 'group rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-amber-500/30 transition-all', {
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.5, delay: 0.2 },
                  children: [
                    b('div', 'h-48 bg-gradient-to-br from-amber-900/40 to-orange-900/20', {}),
                    b('div', 'p-6', {
                      children: [
                        b('span', 'text-xs text-amber-400 font-medium', { text: 'Community' }),
                        b('h3', 'text-lg font-semibold text-white mt-2 mb-2 group-hover:text-amber-400 transition-colors', {
                          text: 'Clean Water Project Breaks Ground',
                        }),
                        b('p', 'text-sm text-white/50 leading-relaxed', {
                          text: 'Construction has begun on a new community well that will provide clean water access to over 500 residents.',
                        }),
                        b('span', 'text-xs text-white/30 mt-4 block', { text: 'January 2026' }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    // ── Impact Stories ──
    b('section', 'w-full py-24 px-6 bg-sky-950/30', {
      label: 'Impact Stories',
      children: [
        b('div', 'max-w-4xl mx-auto', {
          children: [
            b('div', 'text-center mb-16', {
              children: [
                b('p', 'text-sm font-semibold uppercase tracking-widest text-emerald-400 mb-3', { text: 'Testimonials' }),
                b('h2', 'text-3xl md:text-4xl font-bold text-white mb-4', {
                  text: 'Stories of Impact',
                  animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
                }),
              ],
            }),
            b('div', 'space-y-8', {
              children: [
                b('div', 'rounded-2xl bg-white/[0.03] border border-white/10 p-8', {
                  animation: { type: 'fadeIn', trigger: 'inView', duration: 0.5, delay: 0 },
                  children: [
                    b('p', 'text-lg text-white/70 leading-relaxed italic mb-4', {
                      text: '"Because of Project Dzidzor, I was able to continue my education. Today I am the first person in my family to attend university. This organization changed my life."',
                    }),
                    b('p', 'text-sm text-sky-400 font-medium', { text: '- Scholarship Recipient, Eastern Region' }),
                  ],
                }),
                b('div', 'rounded-2xl bg-white/[0.03] border border-white/10 p-8', {
                  animation: { type: 'fadeIn', trigger: 'inView', duration: 0.5, delay: 0.15 },
                  children: [
                    b('p', 'text-lg text-white/70 leading-relaxed italic mb-4', {
                      text: '"The medical supplies and health screenings provided by Project Dzidzor have made a real difference in our hospital. Patients who previously had no access to basic care are now receiving treatment."',
                    }),
                    b('p', 'text-sm text-emerald-400 font-medium', { text: '- Healthcare Worker, Akuse Government Hospital' }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    // ── Newsletter Signup ──
    b('section', 'w-full py-24 px-6 bg-gradient-to-b from-slate-950 to-sky-950 text-center', {
      label: 'Newsletter',
      children: [
        b('div', 'max-w-2xl mx-auto', {
          children: [
            b('h2', 'text-3xl font-bold text-white mb-4', {
              text: 'Subscribe to Our Newsletter',
              animation: { type: 'slideUp', trigger: 'inView', duration: 0.6 },
            }),
            b('p', 'text-white/60 mb-8', {
              text: 'Get monthly updates on our initiatives, impact stories, and ways to help.',
            }),
            b('div', 'flex flex-col sm:flex-row gap-3 max-w-md mx-auto', {
              children: [
                b('input', 'flex-1 rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-sky-500', {
                  attrs: { type: 'email', placeholder: 'Enter your email' },
                }),
                b('button', 'rounded-lg bg-sky-500 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-400 transition-all whitespace-nowrap', {
                  text: 'Subscribe',
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    // ── Social Links ──
    b('section', 'w-full py-12 px-6 bg-sky-950 text-center', {
      label: 'Social',
      children: [
        b('div', 'max-w-2xl mx-auto', {
          children: [
            b('p', 'text-sm text-white/40 mb-4', { text: 'Follow Us' }),
            b('div', 'flex items-center justify-center gap-6', {
              children: [
                b('a', 'text-white/50 hover:text-sky-400 transition-colors text-sm font-medium', {
                  text: 'Instagram',
                  attrs: { href: 'https://instagram.com/projectdzidzor', target: '_blank' },
                }),
                b('a', 'text-white/50 hover:text-sky-400 transition-colors text-sm font-medium', {
                  text: 'Facebook',
                  attrs: { href: 'https://facebook.com/projectdzidzor', target: '_blank' },
                }),
                b('a', 'text-white/50 hover:text-sky-400 transition-colors text-sm font-medium', {
                  text: 'Twitter / X',
                  attrs: { href: 'https://x.com/projectdzidzor', target: '_blank' },
                }),
                b('a', 'text-white/50 hover:text-sky-400 transition-colors text-sm font-medium', {
                  text: 'Website',
                  attrs: { href: 'https://projectdzidzor.org', target: '_blank' },
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ]
}

// ══════════════════════════════════════════════════════════════════════
// Database Seeding
// ══════════════════════════════════════════════════════════════════════

async function main() {
  console.log('\n  Seeding Project Dzidzor...\n')

  const { prisma } = await import('../lib/cms/db/index')

  try {
    // ── 1. Subdomain ───────────────────────────────────────────────────
    const subdomain = await prisma.subdomain.upsert({
      where: { subdomain: 'dzidzor' },
      update: {
        updatedAt: new Date(),
      },
      create: {
        subdomain: 'dzidzor',
        userId: null,
      },
    })
    const tenantId = subdomain.id
    console.log(`  Subdomain created: dzidzor (ID: ${tenantId})`)

    // ── 2. Tenant Settings ─────────────────────────────────────────────
    await prisma.$executeRawUnsafe(`
      INSERT INTO tenant_settings (tenant_id, site_title, site_description, site_name, theme_color, primary_color, accent_color, title_template, meta_description, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      ON CONFLICT (tenant_id) DO UPDATE SET
        site_title = EXCLUDED.site_title,
        site_description = EXCLUDED.site_description,
        site_name = EXCLUDED.site_name,
        theme_color = EXCLUDED.theme_color,
        primary_color = EXCLUDED.primary_color,
        accent_color = EXCLUDED.accent_color,
        title_template = EXCLUDED.title_template,
        meta_description = EXCLUDED.meta_description,
        updated_at = NOW()
    `,
      tenantId,
      'Project Dzidzor',
      'Empowering Communities Through Healthcare, Education & Development',
      'Project Dzidzor',
      '#0ea5e9',
      '#0ea5e9',
      '#059669',
      '%s | Project Dzidzor',
      'Project Dzidzor is a humanitarian organization empowering underserved communities in Ghana through healthcare, education, and sustainable development.',
    )
    console.log('  Tenant settings configured')

    // ── 3. Pages ───────────────────────────────────────────────────────
    const pages = [
      { slug: '/', title: 'Home', blocks: buildHomePage() },
      { slug: 'about', title: 'About Project Dzidzor', blocks: buildAboutPage() },
      { slug: 'initiatives', title: 'Our Initiatives', blocks: buildInitiativesPage() },
      { slug: 'get-involved', title: 'Get Involved', blocks: buildGetInvolvedPage() },
      { slug: 'shop', title: 'Shop for a Cause', blocks: buildShopPage() },
      { slug: 'updates', title: 'News & Updates', blocks: buildUpdatesPage() },
    ]

    for (const p of pages) {
      // Delete existing, then create fresh
      await prisma.page.deleteMany({ where: { slug: p.slug, tenantId } })
      await prisma.page.create({
        data: {
          title: p.title,
          slug: p.slug,
          content: pageContent(p.blocks) as any,
          status: 'PUBLISHED',
          tenantId,
          metaDescription: `${p.title} - Project Dzidzor`,
        },
      })
    }
    console.log(`  6 pages created (${pages.map((p) => p.title.split(' ')[0]).join(', ')})`)

    // ── 4. Categories ──────────────────────────────────────────────────
    const categoryData = [
      { name: 'T-Shirts & Apparel', slug: 'tshirts-apparel', description: 'Project Dzidzor branded t-shirts and apparel', position: 0 },
      { name: 'Accessories', slug: 'accessories', description: 'Water bottles, bags, and other branded accessories', position: 1 },
      { name: 'Bundles & Gift Sets', slug: 'bundles-gift-sets', description: 'Save with curated product bundles', position: 2 },
      { name: 'Donation Tiers', slug: 'donation-tiers', description: 'Direct impact donations at various levels', position: 3 },
    ]

    const categories: Record<string, string> = {}
    for (const cat of categoryData) {
      // Delete existing for this tenant+slug then create
      await prisma.category.deleteMany({ where: { slug: cat.slug, tenantId } })
      const created = await prisma.category.create({
        data: { ...cat, tenantId },
      })
      categories[cat.slug] = created.id
    }
    console.log('  4 categories created')

    // ── 5. Products ────────────────────────────────────────────────────
    // Clean up existing products for this tenant
    await prisma.product.deleteMany({ where: { tenantId } })

    // Product 1: Classic T-Shirt (VARIABLE)
    const classicTee = await prisma.product.create({
      data: {
        title: 'Project Dzidzor Classic T-Shirt',
        slug: 'classic-tshirt',
        description: 'Premium cotton t-shirt featuring the Project Dzidzor logo. Comfortable, durable, and designed with purpose. Every purchase directly funds our healthcare and education initiatives in Ghana.',
        basePrice: 3000,
        status: 'ACTIVE',
        type: 'VARIABLE',
        featured: true,
        tenantId,
        taxable: true,
        requiresShipping: true,
        trackInventory: true,
        stock: 0,
      },
    })

    // Create Size option for Classic Tee
    const classicTeeOption = await prisma.productOption.create({
      data: { productId: classicTee.id, name: 'Size', position: 0 },
    })
    const classicTeeSizes = ['S', 'M', 'L', 'XL', '2XL']
    const classicTeeOptionValues: string[] = []
    for (let i = 0; i < classicTeeSizes.length; i++) {
      const ov = await prisma.productOptionValue.create({
        data: { optionId: classicTeeOption.id, value: classicTeeSizes[i], position: i },
      })
      classicTeeOptionValues.push(ov.id)
    }
    for (let i = 0; i < classicTeeSizes.length; i++) {
      const variant = await prisma.productVariant.create({
        data: {
          productId: classicTee.id,
          sku: `DZ-CT-${classicTeeSizes[i]}`,
          price: 3000,
          stock: 25,
          enabled: true,
        },
      })
      await prisma.productVariantOptionValue.create({
        data: { variantId: variant.id, optionValueId: classicTeeOptionValues[i] },
      })
    }

    // Link to category
    await prisma.productCategory.create({
      data: { productId: classicTee.id, categoryId: categories['tshirts-apparel'] },
    })

    // Product 2: Thrive Collection T-Shirt (VARIABLE)
    const thriveTee = await prisma.product.create({
      data: {
        title: 'Thrive Collection T-Shirt',
        slug: 'thrive-collection-tshirt',
        description: 'Limited edition design celebrating community resilience. Features the "Thrive" graphic inspired by the spirit of the communities we serve. Premium cotton blend.',
        basePrice: 3500,
        status: 'ACTIVE',
        type: 'VARIABLE',
        featured: true,
        tenantId,
        taxable: true,
        requiresShipping: true,
        trackInventory: true,
        stock: 0,
      },
    })

    const thriveOption = await prisma.productOption.create({
      data: { productId: thriveTee.id, name: 'Size', position: 0 },
    })
    const thriveSizes = ['S', 'M', 'L', 'XL']
    const thriveOptionValues: string[] = []
    for (let i = 0; i < thriveSizes.length; i++) {
      const ov = await prisma.productOptionValue.create({
        data: { optionId: thriveOption.id, value: thriveSizes[i], position: i },
      })
      thriveOptionValues.push(ov.id)
    }
    for (let i = 0; i < thriveSizes.length; i++) {
      const variant = await prisma.productVariant.create({
        data: {
          productId: thriveTee.id,
          sku: `DZ-TH-${thriveSizes[i]}`,
          price: 3500,
          stock: 20,
          enabled: true,
        },
      })
      await prisma.productVariantOptionValue.create({
        data: { variantId: variant.id, optionValueId: thriveOptionValues[i] },
      })
    }

    await prisma.productCategory.create({
      data: { productId: thriveTee.id, categoryId: categories['tshirts-apparel'] },
    })

    // Product 3: Water Bottle (SIMPLE)
    const waterBottle = await prisma.product.create({
      data: {
        title: 'Project Dzidzor Water Bottle',
        slug: 'water-bottle',
        description: 'Insulated stainless steel water bottle with Project Dzidzor branding. Keeps drinks cold for 24 hours and hot for 12 hours. 20oz capacity.',
        basePrice: 2000,
        status: 'ACTIVE',
        type: 'SIMPLE',
        featured: true,
        tenantId,
        sku: 'DZ-WB-001',
        taxable: true,
        requiresShipping: true,
        trackInventory: true,
        stock: 50,
      },
    })

    await prisma.productCategory.create({
      data: { productId: waterBottle.id, categoryId: categories['accessories'] },
    })

    // Product 4: Impact Bundle (BUNDLE)
    const impactBundle = await prisma.product.create({
      data: {
        title: 'Impact Bundle (T-Shirt + Water Bottle)',
        slug: 'impact-bundle',
        description: 'Get the Classic T-Shirt and Water Bottle together and save $5. The perfect starter pack for supporters of Project Dzidzor.',
        basePrice: 4500,
        compareAtPrice: 5000,
        status: 'ACTIVE',
        type: 'BUNDLE',
        featured: true,
        tenantId,
        sku: 'DZ-IB-001',
        taxable: true,
        requiresShipping: true,
        trackInventory: true,
        stock: 30,
      },
    })

    await prisma.productCategory.create({
      data: { productId: impactBundle.id, categoryId: categories['bundles-gift-sets'] },
    })

    // Product 5: Sponsor a Health Screening (SERVICE)
    const healthScreening = await prisma.product.create({
      data: {
        title: 'Sponsor a Health Screening',
        slug: 'sponsor-health-screening',
        description: 'Your $50 donation funds a complete health screening for a community member in Ghana, including blood pressure check, glucose testing, and basic diagnostics. You will receive an impact report.',
        basePrice: 5000,
        status: 'ACTIVE',
        type: 'SERVICE',
        featured: false,
        tenantId,
        sku: 'DZ-HS-001',
        taxable: false,
        requiresShipping: false,
        trackInventory: false,
        stock: 0,
      },
    })

    await prisma.productCategory.create({
      data: { productId: healthScreening.id, categoryId: categories['donation-tiers'] },
    })

    console.log('  5 products created')

    // ── 6. Super Admin ─────────────────────────────────────────────────
    await prisma.$executeRawUnsafe(`
      INSERT INTO super_admins (user_id, email, permissions)
      VALUES ($1, $1, '["*"]'::jsonb)
      ON CONFLICT (user_id) DO NOTHING
    `, 'Bubuneo99@gmail.com')
    console.log('  Super admin granted: Bubuneo99@gmail.com')

    console.log('\n  Done! Visit: /s/dzidzor\n')
  } catch (err) {
    console.error('  Database error:', (err as Error).message)
    console.error((err as Error).stack)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Unhandled error:', err)
  process.exit(1)
})
