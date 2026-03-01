/**
 * Partial Reference Smart Block
 *
 * Registers the PartialReference smart block with the registry.
 * Import this file once at app startup to make this block available.
 */

import { registerSmartBlock } from '@/lib/cms/block-editor/smart-blocks/registry'
import type { Block } from '@/lib/cms/block-editor/types'
import PartialReference from './PartialReference'

registerSmartBlock({
  componentName: 'PartialReference',
  displayName: 'Partial Reference',
  category: 'content',
  icon: 'layers',
  component: PartialReference,
  dataRequirements: (block: Block) => {
    if (!block.partialId) return []
    return [
      {
        key: 'blocks',
        fetcher: 'fetchPartialBlocks',
        args: { partialId: block.partialId },
      },
    ]
  },
  defaultBlock: {
    tag: 'div',
    className: '',
    componentName: 'PartialReference',
  },
  editorConfig: {
    fields: [],
  },
})

export { default as PartialReference } from './PartialReference'
