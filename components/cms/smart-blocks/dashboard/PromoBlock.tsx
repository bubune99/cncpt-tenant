'use client'

import type { SmartBlockProps } from '@/lib/cms/block-editor/smart-blocks/registry'

export default function PromoBlock({ block, data: _data, className }: SmartBlockProps) {
  const outer =
    className ||
    block.className ||
    'rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-6'

  const text =
    block.textContent ||
    'Check out our latest deals and promotions!'

  const linkUrl = block.attrs?.href
  const linkText = block.attrs?.['data-link-text'] || 'Learn more'

  return (
    <div className={outer}>
      <p className="text-gray-800">{text}</p>
      {linkUrl && (
        <a
          href={linkUrl}
          className="mt-3 inline-block text-sm font-medium text-amber-700 hover:text-amber-800 underline underline-offset-2"
        >
          {linkText} &rarr;
        </a>
      )}
    </div>
  )
}
