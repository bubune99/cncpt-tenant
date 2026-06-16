'use client'

/**
 * Small SVG helpers that need exact control (dashed + spinning status rings)
 * beyond what lucide gives us. Decorative icons elsewhere use lucide-react.
 */

import type { TaskStatus } from './types'
import { C } from './tokens'

export function StatusCircle({ status, size }: { status: TaskStatus; size: number }) {
  if (status === 'completed') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth={2}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12 2.5 2.5 4.5-5" />
      </svg>
    )
  }
  if (status === 'in-progress') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={C.blue}
        strokeWidth={2}
        strokeDasharray="2.5 3"
        style={{ animation: 'cbxspin 3s linear infinite' }}
      >
        <circle cx="12" cy="12" r="9" />
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={C.textGhost} strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}
