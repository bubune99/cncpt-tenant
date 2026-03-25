'use client'

import { useEffect, useRef } from 'react'
import { useUser } from '@stackframe/stack'

/**
 * Invisible component that merges anonymous cart into user cart on login.
 *
 * Place this inside a StackProvider-wrapped layout. When a user signs in,
 * it calls POST /api/cms/cart/merge to move guest cart items into their
 * authenticated cart. Runs once per sign-in session.
 */
export function CartMergeOnLogin() {
  const user = useUser()
  const mergedRef = useRef(false)

  useEffect(() => {
    if (!user || mergedRef.current) return

    mergedRef.current = true

    fetch('/api/cms/cart/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
      .then((res) => {
        if (res.ok) {
          window.dispatchEvent(new CustomEvent('cart:updated'))
        }
      })
      .catch(() => {
        // Cart merge failed silently — non-critical
      })
  }, [user])

  return null
}
