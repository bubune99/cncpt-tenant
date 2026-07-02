'use client'

/**
 * FormBlock Smart Block
 *
 * Renders an admin-built form (newsletter signup, feedback, contact…) on the
 * storefront via <DynamicForm>. The form is selected by slug in the block's
 * properties; the definition is resolved server-side by the `fetchForm`
 * fetcher and delivered through smart-block data.
 */

import { DynamicForm } from '@/components/cms/forms/DynamicForm'
import type { SmartBlockProps } from '@/lib/cms/block-editor/smart-blocks/registry'
import type { FormDefinition } from '@/lib/cms/forms/types'

export default function FormBlock({ block, data, className }: SmartBlockProps) {
  const form = data.form as FormDefinition | null | undefined
  const showTitle = block.attrs?.['data-show-title'] !== 'false'

  if (!form) {
    const slug = block.attrs?.['data-form-slug']
    return (
      <div className={`rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center text-sm text-muted-foreground ${className ?? ''}`}>
        {slug
          ? `Form “${slug}” was not found or is not active.`
          : 'No form selected — set a form slug in the block properties.'}
      </div>
    )
  }

  return (
    <div className={className}>
      {showTitle && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold">{form.name}</h3>
          {form.description && <p className="text-sm text-muted-foreground mt-1">{form.description}</p>}
        </div>
      )}
      <DynamicForm form={form} />
    </div>
  )
}
