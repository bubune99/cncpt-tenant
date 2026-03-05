/**
 * Commerce Smart Blocks
 *
 * Barrel export that registers all commerce smart blocks with the registry.
 * Import this file once at app startup to make these blocks available.
 */

import { registerSmartBlock } from '@/lib/cms/block-editor/smart-blocks/registry'
import type { Block } from '@/lib/cms/block-editor/types'

import ProductGrid from './ProductGrid'
import ProductCard from './ProductCard'
import ProductDetail from './ProductDetail'
import CategoryNav from './CategoryNav'
import ProductSearch from './ProductSearch'
import AddToCartButton from './AddToCartButton'
import CartSummary from './CartSummary'
import FeaturedProducts from './FeaturedProducts'
import ShopSection from './ShopSection'

// ---------------------------------------------------------------------------
// ProductGrid
// ---------------------------------------------------------------------------
registerSmartBlock({
  componentName: 'ProductGrid',
  displayName: 'Product Grid',
  category: 'commerce',
  icon: 'grid-3x3',
  component: ProductGrid,
  dataRequirements: (block: Block) => [
    {
      key: 'products',
      fetcher: 'fetchProducts',
      args: {
        limit: block.commerce?.limit ?? 12,
        sort: block.commerce?.sortKey ?? 'CREATED_AT',
        reverse: block.commerce?.reverse ?? true,
        categorySlug: block.commerce?.handle,
      },
    },
  ],
  defaultBlock: {
    tag: 'div',
    className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6',
    componentName: 'ProductGrid',
    commerce: {
      type: 'collection',
      limit: 12,
      sortKey: 'CREATED_AT',
      reverse: true,
    },
  },
  editorConfig: {
    fields: [
      {
        key: 'limit',
        label: 'Products to show',
        type: 'number',
        defaultValue: 12,
        min: 1,
        max: 50,
        target: 'commerce',
      },
      {
        key: 'data-columns',
        label: 'Columns',
        type: 'select',
        defaultValue: '4',
        options: [
          { label: '2', value: '2' },
          { label: '3', value: '3' },
          { label: '4', value: '4' },
          { label: '5', value: '5' },
          { label: '6', value: '6' },
        ],
        target: 'attrs',
      },
      {
        key: 'sortKey',
        label: 'Sort by',
        type: 'select',
        defaultValue: 'CREATED_AT',
        options: [
          { label: 'Newest', value: 'CREATED_AT' },
          { label: 'Price', value: 'PRICE' },
          { label: 'Title', value: 'TITLE' },
          { label: 'Best Selling', value: 'BEST_SELLING' },
        ],
        target: 'commerce',
      },
      {
        key: 'reverse',
        label: 'Reverse order',
        type: 'toggle',
        defaultValue: true,
        target: 'commerce',
      },
    ],
  },
})

// ---------------------------------------------------------------------------
// ProductCard
// ---------------------------------------------------------------------------
registerSmartBlock({
  componentName: 'ProductCard',
  displayName: 'Product Card',
  category: 'commerce',
  icon: 'square',
  component: ProductCard,
  dataRequirements: (block: Block) => [
    {
      key: 'product',
      fetcher: 'fetchProduct',
      args: {
        slug: block.commerce?.handle ?? '',
      },
    },
  ],
  defaultBlock: {
    tag: 'div',
    className: 'group block rounded-lg overflow-hidden border border-gray-200 bg-white hover:shadow-md transition-shadow',
    componentName: 'ProductCard',
    commerce: {
      type: 'product',
      handle: '',
    },
  },
  editorConfig: {
    fields: [
      {
        key: 'handle',
        label: 'Product slug',
        type: 'text',
        defaultValue: '',
        target: 'commerce',
      },
    ],
  },
})

// ---------------------------------------------------------------------------
// ProductDetail
// ---------------------------------------------------------------------------
registerSmartBlock({
  componentName: 'ProductDetail',
  displayName: 'Product Detail',
  category: 'commerce',
  icon: 'package',
  component: ProductDetail,
  dataRequirements: (block: Block) => [
    {
      key: 'product',
      fetcher: 'fetchProduct',
      args: {
        slug: block.commerce?.handle ?? '',
      },
    },
  ],
  defaultBlock: {
    tag: 'div',
    className: 'grid grid-cols-1 md:grid-cols-2 gap-8',
    componentName: 'ProductDetail',
    commerce: {
      type: 'product',
      handle: '',
    },
  },
  editorConfig: {
    fields: [
      {
        key: 'handle',
        label: 'Product slug',
        type: 'text',
        defaultValue: '',
        target: 'commerce',
      },
    ],
  },
})

// ---------------------------------------------------------------------------
// CategoryNav
// ---------------------------------------------------------------------------
registerSmartBlock({
  componentName: 'CategoryNav',
  displayName: 'Category Navigation',
  category: 'commerce',
  icon: 'list',
  component: CategoryNav,
  dataRequirements: () => [
    {
      key: 'categories',
      fetcher: 'fetchCategories',
      args: {},
    },
  ],
  defaultBlock: {
    tag: 'nav',
    className: 'flex flex-wrap items-center gap-2',
    componentName: 'CategoryNav',
    commerce: {
      type: 'collection',
    },
  },
  editorConfig: {
    fields: [
      {
        key: 'data-layout',
        label: 'Layout',
        type: 'select',
        defaultValue: 'horizontal',
        options: [
          { label: 'Horizontal', value: 'horizontal' },
          { label: 'Vertical', value: 'vertical' },
          { label: 'Dropdown', value: 'dropdown' },
        ],
        target: 'attrs',
      },
      {
        key: 'data-show-count',
        label: 'Show product count',
        type: 'toggle',
        defaultValue: true,
        target: 'attrs',
      },
    ],
  },
})

// ---------------------------------------------------------------------------
// ProductSearch
// ---------------------------------------------------------------------------
registerSmartBlock({
  componentName: 'ProductSearch',
  displayName: 'Product Search',
  category: 'commerce',
  icon: 'search',
  component: ProductSearch,
  dataRequirements: () => [
    {
      key: 'products',
      fetcher: 'fetchProducts',
      args: {
        limit: 100,
      },
    },
  ],
  defaultBlock: {
    tag: 'div',
    className: 'relative w-full max-w-md',
    componentName: 'ProductSearch',
    commerce: {
      type: 'collection',
    },
  },
  editorConfig: {
    fields: [
      {
        key: 'placeholder',
        label: 'Placeholder text',
        type: 'text',
        defaultValue: 'Search products...',
        target: 'attrs',
      },
    ],
  },
})

// ---------------------------------------------------------------------------
// AddToCartButton
// ---------------------------------------------------------------------------
registerSmartBlock({
  componentName: 'AddToCartButton',
  displayName: 'Add to Cart Button',
  category: 'commerce',
  icon: 'shopping-cart',
  component: AddToCartButton,
  dataRequirements: () => [],
  defaultBlock: {
    tag: 'div',
    className: 'inline-flex items-center gap-2',
    textContent: 'Add to Cart',
    componentName: 'AddToCartButton',
    commerce: {
      type: 'cart',
      handle: '',
    },
  },
  editorConfig: {
    fields: [
      {
        key: 'handle',
        label: 'Product ID',
        type: 'text',
        defaultValue: '',
        target: 'commerce',
      },
      {
        key: 'data-show-quantity',
        label: 'Show quantity selector',
        type: 'toggle',
        defaultValue: true,
        target: 'attrs',
      },
      {
        key: 'data-max-qty',
        label: 'Max quantity',
        type: 'number',
        defaultValue: 99,
        min: 1,
        max: 999,
        target: 'attrs',
      },
    ],
  },
})

// ---------------------------------------------------------------------------
// CartSummary
// ---------------------------------------------------------------------------
registerSmartBlock({
  componentName: 'CartSummary',
  displayName: 'Cart Summary',
  category: 'commerce',
  icon: 'shopping-bag',
  component: CartSummary,
  dataRequirements: () => [],
  defaultBlock: {
    tag: 'div',
    className: 'relative inline-block',
    componentName: 'CartSummary',
    commerce: {
      type: 'cart',
    },
  },
  editorConfig: {
    fields: [],
  },
})

// ---------------------------------------------------------------------------
// FeaturedProducts
// ---------------------------------------------------------------------------
registerSmartBlock({
  componentName: 'FeaturedProducts',
  displayName: 'Featured Products',
  category: 'commerce',
  icon: 'star',
  component: FeaturedProducts,
  dataRequirements: (block: Block) => [
    {
      key: 'products',
      fetcher: 'fetchFeaturedProducts',
      args: {
        limit: block.commerce?.limit ?? 4,
      },
    },
  ],
  defaultBlock: {
    tag: 'div',
    className: 'space-y-6',
    textContent: 'Featured Products',
    componentName: 'FeaturedProducts',
    commerce: {
      type: 'collection',
      limit: 4,
    },
  },
  editorConfig: {
    fields: [
      {
        key: 'limit',
        label: 'Products to show',
        type: 'number',
        defaultValue: 4,
        min: 1,
        max: 12,
        target: 'commerce',
      },
      {
        key: 'data-show-heading',
        label: 'Show heading',
        type: 'toggle',
        defaultValue: true,
        target: 'attrs',
      },
    ],
  },
})

// ---------------------------------------------------------------------------
// ShopSection
// ---------------------------------------------------------------------------
registerSmartBlock({
  componentName: 'ShopSection',
  displayName: 'Shop Section',
  category: 'commerce',
  icon: 'store',
  component: ShopSection,
  dataRequirements: (block: Block) => [
    {
      key: 'products',
      fetcher: 'fetchProducts',
      args: {
        limit: block.commerce?.limit ?? 12,
        categorySlug: block.commerce?.handle || undefined,
        sort: block.commerce?.sortKey ?? 'CREATED_AT',
        reverse: block.commerce?.reverse ?? true,
      },
    },
  ],
  defaultBlock: {
    tag: 'section',
    className: 'py-8 sm:py-12',
    textContent: 'Shop Our Products',
    componentName: 'ShopSection',
    commerce: {
      type: 'collection',
      limit: 12,
      sortKey: 'CREATED_AT',
      reverse: true,
    },
  },
  editorConfig: {
    fields: [
      {
        key: 'handle',
        label: 'Collection slug (empty = all)',
        type: 'text',
        defaultValue: '',
        target: 'commerce',
      },
      {
        key: 'limit',
        label: 'Max products',
        type: 'number',
        defaultValue: 12,
        min: 1,
        max: 50,
        target: 'commerce',
      },
      {
        key: 'data-columns',
        label: 'Columns',
        type: 'select',
        defaultValue: '4',
        options: [
          { label: '2', value: '2' },
          { label: '3', value: '3' },
          { label: '4', value: '4' },
          { label: '5', value: '5' },
          { label: '6', value: '6' },
        ],
        target: 'attrs',
      },
      {
        key: 'data-show-filters',
        label: 'Show sort controls',
        type: 'toggle',
        defaultValue: true,
        target: 'attrs',
      },
      {
        key: 'sortKey',
        label: 'Default sort',
        type: 'select',
        defaultValue: 'CREATED_AT',
        options: [
          { label: 'Newest', value: 'CREATED_AT' },
          { label: 'Price', value: 'PRICE' },
          { label: 'Title', value: 'TITLE' },
          { label: 'Best Selling', value: 'BEST_SELLING' },
        ],
        target: 'commerce',
      },
    ],
  },
})

// ---------------------------------------------------------------------------
// Re-exports for direct imports
// ---------------------------------------------------------------------------
export { default as ProductGrid } from './ProductGrid'
export { default as ProductCard } from './ProductCard'
export { default as ProductDetail } from './ProductDetail'
export { default as CategoryNav } from './CategoryNav'
export { default as ProductSearch } from './ProductSearch'
export { default as AddToCartButton } from './AddToCartButton'
export { default as CartSummary } from './CartSummary'
export { default as FeaturedProducts } from './FeaturedProducts'
export { default as ShopSection } from './ShopSection'
