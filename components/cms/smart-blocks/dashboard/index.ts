/**
 * Dashboard Smart Blocks
 *
 * Barrel export that registers all dashboard smart blocks with the registry.
 * Import this file once to make these blocks available.
 */

import { registerSmartBlock } from '@/lib/cms/block-editor/smart-blocks/registry'

import DashboardWelcome from './DashboardWelcome'
import RecentOrders from './RecentOrders'
import QuickActions from './QuickActions'
import AccountInfo from './AccountInfo'
import PromoBlock from './PromoBlock'

// ---------------------------------------------------------------------------
// DashboardWelcome
// ---------------------------------------------------------------------------
registerSmartBlock({
  componentName: 'DashboardWelcome',
  displayName: 'Welcome Banner',
  category: 'dashboard',
  icon: 'hand-wave',
  component: DashboardWelcome,
  dataRequirements: () => [
    {
      key: 'stats',
      fetcher: 'fetchDashboardStats',
      args: {},
    },
  ],
  defaultBlock: {
    tag: 'div',
    className: 'rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white',
    componentName: 'DashboardWelcome',
  },
  editorConfig: { fields: [] },
})

// ---------------------------------------------------------------------------
// RecentOrders
// ---------------------------------------------------------------------------
registerSmartBlock({
  componentName: 'RecentOrders',
  displayName: 'Recent Orders',
  category: 'dashboard',
  icon: 'package',
  component: RecentOrders,
  dataRequirements: () => [
    {
      key: 'recentOrders',
      fetcher: 'fetchRecentOrders',
      args: { limit: 5 },
    },
  ],
  defaultBlock: {
    tag: 'div',
    className: 'rounded-lg border border-gray-200 bg-white p-6',
    componentName: 'RecentOrders',
  },
  editorConfig: {
    fields: [
      {
        key: 'limit',
        label: 'Orders to show',
        type: 'number',
        defaultValue: 5,
        min: 1,
        max: 20,
        target: 'attrs',
      },
    ],
  },
})

// ---------------------------------------------------------------------------
// QuickActions
// ---------------------------------------------------------------------------
registerSmartBlock({
  componentName: 'QuickActions',
  displayName: 'Quick Actions',
  category: 'dashboard',
  icon: 'zap',
  component: QuickActions,
  dataRequirements: () => [],
  defaultBlock: {
    tag: 'div',
    className: 'rounded-lg border border-gray-200 bg-white p-6',
    componentName: 'QuickActions',
  },
  editorConfig: { fields: [] },
})

// ---------------------------------------------------------------------------
// AccountInfo
// ---------------------------------------------------------------------------
registerSmartBlock({
  componentName: 'AccountInfo',
  displayName: 'Account Info',
  category: 'dashboard',
  icon: 'user-circle',
  component: AccountInfo,
  dataRequirements: () => [
    {
      key: 'stats',
      fetcher: 'fetchDashboardStats',
      args: {},
    },
  ],
  defaultBlock: {
    tag: 'div',
    className: 'rounded-lg border border-gray-200 bg-white p-6',
    componentName: 'AccountInfo',
  },
  editorConfig: { fields: [] },
})

// ---------------------------------------------------------------------------
// PromoBlock
// ---------------------------------------------------------------------------
registerSmartBlock({
  componentName: 'PromoBlock',
  displayName: 'Promo / Announcement',
  category: 'dashboard',
  icon: 'megaphone',
  component: PromoBlock,
  dataRequirements: () => [],
  defaultBlock: {
    tag: 'div',
    className: 'rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-6',
    textContent: 'Check out our latest deals and promotions!',
    componentName: 'PromoBlock',
  },
  editorConfig: {
    fields: [
      {
        key: 'href',
        label: 'Link URL',
        type: 'text',
        defaultValue: '',
        target: 'attrs',
      },
      {
        key: 'data-link-text',
        label: 'Link text',
        type: 'text',
        defaultValue: 'Learn more',
        target: 'attrs',
      },
    ],
  },
})

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------
export { default as DashboardWelcome } from './DashboardWelcome'
export { default as RecentOrders } from './RecentOrders'
export { default as QuickActions } from './QuickActions'
export { default as AccountInfo } from './AccountInfo'
export { default as PromoBlock } from './PromoBlock'
