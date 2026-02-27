import type { BlockTemplate, BlockCategory } from "./types"

export const BLOCK_TEMPLATES: BlockTemplate[] = [
  // ========== LAYOUT ==========
  {
    label: "Section",
    tag: "section",
    icon: "LayoutGrid",
    category: "layout",
    defaultClassName: "w-full py-16 px-6",
    isContainer: true,
  },
  {
    label: "Flex Row",
    tag: "div",
    icon: "Columns3",
    category: "layout",
    defaultClassName: "flex flex-row items-center gap-4 p-4",
    isContainer: true,
  },
  {
    label: "Flex Column",
    tag: "div",
    icon: "Rows3",
    category: "layout",
    defaultClassName: "flex flex-col gap-4 p-4",
    isContainer: true,
  },

  // ========== SMART COMMERCE (data-driven components) ==========
  {
    label: "Smart Product Grid",
    tag: "div",
    icon: "Grid3X3",
    category: "smart-commerce",
    defaultClassName: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
    isContainer: false,
    componentName: "ProductGrid",
    description: "Dynamic product grid with real data",
    defaultCommerce: { type: "collection", provider: "generic", limit: 12, sortKey: "CREATED_AT" },
  },
  {
    label: "Smart Product Card",
    tag: "div",
    icon: "Package",
    category: "smart-commerce",
    defaultClassName: "group flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4 hover:border-white/20 transition-colors",
    isContainer: false,
    componentName: "ProductCard",
    description: "Single product card with image, title, price",
    defaultCommerce: { type: "product", provider: "generic" },
  },
  {
    label: "Featured Products",
    tag: "div",
    icon: "Star",
    category: "smart-commerce",
    defaultClassName: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6",
    isContainer: false,
    componentName: "FeaturedProducts",
    description: "Curated featured products section",
    defaultCommerce: { type: "collection", provider: "generic", limit: 4, sortKey: "BEST_SELLING" },
  },
  {
    label: "Category Nav",
    tag: "nav",
    icon: "FolderTree",
    category: "smart-commerce",
    defaultClassName: "flex flex-wrap gap-2",
    isContainer: false,
    componentName: "CategoryNav",
    description: "Product category navigation links",
  },
  {
    label: "Product Search",
    tag: "div",
    icon: "Search",
    category: "smart-commerce",
    defaultClassName: "w-full max-w-md",
    isContainer: false,
    componentName: "ProductSearch",
    description: "Search bar with product suggestions",
  },
  {
    label: "Smart Add to Cart",
    tag: "button",
    icon: "ShoppingCart",
    category: "smart-commerce",
    defaultClassName: "w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500 transition-colors",
    defaultTextContent: "Add to Cart",
    isContainer: false,
    componentName: "AddToCartButton",
    description: "Add to cart with quantity and variant selection",
    defaultCommerce: { type: "cart", provider: "generic" },
  },
  {
    label: "Cart Summary",
    tag: "div",
    icon: "ShoppingBag",
    category: "smart-commerce",
    defaultClassName: "rounded-xl border border-white/10 bg-white/5 p-6",
    isContainer: false,
    componentName: "CartSummary",
    description: "Mini cart with item count and total",
    defaultCommerce: { type: "cart", provider: "generic" },
  },

  // ========== SMART DASHBOARD (customer account widgets) ==========
  {
    label: "Dashboard Welcome",
    tag: "div",
    icon: "Hand",
    category: "smart-dashboard",
    defaultClassName: "rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white",
    isContainer: false,
    componentName: "DashboardWelcome",
    description: "Personalized welcome banner with user name",
  },
  {
    label: "Recent Orders",
    tag: "div",
    icon: "ClipboardList",
    category: "smart-dashboard",
    defaultClassName: "rounded-xl border border-white/10 bg-white/5 p-6",
    isContainer: false,
    componentName: "RecentOrders",
    description: "Latest orders with status and tracking",
    defaultCommerce: { type: "customer", provider: "generic" },
  },
  {
    label: "Quick Actions",
    tag: "div",
    icon: "Zap",
    category: "smart-dashboard",
    defaultClassName: "grid grid-cols-2 gap-4",
    isContainer: false,
    componentName: "QuickActions",
    description: "Quick action buttons (orders, settings, support)",
  },
  {
    label: "Account Info",
    tag: "div",
    icon: "User",
    category: "smart-dashboard",
    defaultClassName: "rounded-xl border border-white/10 bg-white/5 p-6",
    isContainer: false,
    componentName: "AccountInfo",
    description: "Customer profile card with avatar and details",
    defaultCommerce: { type: "customer", provider: "generic" },
  },
  {
    label: "Promo Block",
    tag: "div",
    icon: "Gift",
    category: "smart-dashboard",
    defaultClassName: "rounded-xl border border-amber-500/20 bg-amber-500/5 p-6",
    isContainer: false,
    componentName: "PromoBlock",
    description: "Promotional banner or discount code display",
  },
]

export function getTemplateByLabel(label: string): BlockTemplate | undefined {
  return BLOCK_TEMPLATES.find((t) => t.label === label)
}

export function getTemplatesByCategory(category: string): BlockTemplate[] {
  return BLOCK_TEMPLATES.filter((t) => t.category === category)
}

export const BLOCK_CATEGORIES = [
  { id: "layout", label: "Layout", icon: "LayoutGrid" },
  { id: "typography", label: "Typography", icon: "Type" },
  { id: "media", label: "Media", icon: "Image" },
  { id: "interactive", label: "Interactive", icon: "MousePointerClick" },
  { id: "form", label: "Form", icon: "FormInput" },
  { id: "commerce", label: "Commerce", icon: "ShoppingCart" },
  { id: "smart-commerce", label: "Smart Commerce", icon: "Store" },
  { id: "smart-dashboard", label: "Dashboard Widgets", icon: "LayoutDashboard" },
] as const

/** Commerce provider metadata for UI display */
export const COMMERCE_PROVIDERS = {
  generic: { label: "Generic", color: "gray", icon: "Package" },
  shopify: { label: "Shopify", color: "green", icon: "ShoppingBag" },
  stripe: { label: "Stripe", color: "purple", icon: "CreditCard" },
  paypal: { label: "PayPal", color: "blue", icon: "Wallet" },
  snipcart: { label: "Snipcart", color: "emerald", icon: "ShoppingCart" },
  medusa: { label: "Medusa", color: "violet", icon: "Package" },
  saleor: { label: "Saleor", color: "indigo", icon: "Store" },
} as const
