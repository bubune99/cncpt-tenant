'use client'

import dynamic from 'next/dynamic'

/**
 * Client-only wrapper around SpotlightHost so we can import it from the
 * root server layout without forcing the layout to be client-side.
 * SSR is disabled because the spotlight reads layout via getBoundingClientRect.
 */
const SpotlightHostInner = dynamic(
  () => import('./SpotlightHost').then((m) => ({ default: m.SpotlightHost })),
  { ssr: false }
)

export function SpotlightHostClient() {
  return <SpotlightHostInner />
}
