/**
 * Form Smart Blocks
 *
 * Barrel export that registers the FormBlock with the registry.
 * Side-effect imported by block-page-renderer (and the editor) so admin-built
 * forms can be dropped onto any page.
 */

import { registerSmartBlock } from '@/lib/cms/block-editor/smart-blocks/registry'
import type { Block } from '@/lib/cms/block-editor/types'

import FormBlock from './FormBlock'

registerSmartBlock({
  componentName: 'FormBlock',
  displayName: 'Form',
  category: 'content',
  icon: 'clipboard-list',
  component: FormBlock,
  dataRequirements: (block: Block) => [
    {
      key: 'form',
      fetcher: 'fetchForm',
      args: {
        slug: block.attrs?.['data-form-slug'],
        id: block.attrs?.['data-form-id'],
      },
    },
  ],
  defaultBlock: {
    tag: 'div',
    className: 'w-full max-w-xl mx-auto py-8',
    componentName: 'FormBlock',
    label: 'Form',
    attrs: {},
  },
  editorConfig: {
    fields: [
      {
        key: 'data-form-slug',
        label: 'Form slug',
        type: 'text',
        defaultValue: '',
        target: 'attrs',
      },
      {
        key: 'data-show-title',
        label: 'Show form name',
        type: 'select',
        defaultValue: 'true',
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
        target: 'attrs',
      },
    ],
  },
})

export { FormBlock }
