// Mock data for CMS demo mode
// This provides realistic sample data to showcase all CMS features

export const DEMO_USER = {
  id: 'demo-user-001',
  email: 'demo@cncptweb.com',
  name: 'Demo User',
  role: 'admin',
  permissions: ['*'], // Full access for demo
}

export const DEMO_STATS = {
  totalUsers: 156,
  totalProducts: 48,
  totalOrders: 1247,
  totalBlogPosts: 23,
  totalPages: 12,
  totalRevenue: 84750.00,
  monthlyRevenue: 12450.00,
  conversionRate: 3.2,
}

export const DEMO_PRODUCTS = [
  {
    id: 'prod-001',
    name: 'Premium Wireless Headphones',
    slug: 'premium-wireless-headphones',
    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
    price: 199.99,
    compareAtPrice: 249.99,
    sku: 'WH-PRO-001',
    status: 'active',
    inventory: 45,
    category: 'Electronics',
    images: [
      { id: 'img-1', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', alt: 'Headphones' }
    ],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
  },
  {
    id: 'prod-002',
    name: 'Organic Cotton T-Shirt',
    slug: 'organic-cotton-tshirt',
    description: 'Comfortable and sustainable organic cotton t-shirt available in multiple colors.',
    price: 34.99,
    compareAtPrice: null,
    sku: 'TS-ORG-002',
    status: 'active',
    inventory: 230,
    category: 'Apparel',
    images: [
      { id: 'img-2', url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', alt: 'T-Shirt' }
    ],
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-18T11:00:00Z',
  },
  {
    id: 'prod-003',
    name: 'Smart Fitness Watch',
    slug: 'smart-fitness-watch',
    description: 'Track your health and fitness with GPS, heart rate monitoring, and sleep tracking.',
    price: 299.99,
    compareAtPrice: 349.99,
    sku: 'FW-SMT-003',
    status: 'active',
    inventory: 78,
    category: 'Electronics',
    images: [
      { id: 'img-3', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', alt: 'Smart Watch' }
    ],
    createdAt: '2024-01-08T09:00:00Z',
    updatedAt: '2024-01-22T16:00:00Z',
  },
  {
    id: 'prod-004',
    name: 'Minimalist Leather Wallet',
    slug: 'minimalist-leather-wallet',
    description: 'Slim, RFID-blocking leather wallet with space for 8 cards and cash.',
    price: 59.99,
    compareAtPrice: null,
    sku: 'WL-LTH-004',
    status: 'active',
    inventory: 156,
    category: 'Accessories',
    images: [
      { id: 'img-4', url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400', alt: 'Wallet' }
    ],
    createdAt: '2024-01-05T12:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'prod-005',
    name: 'Ceramic Pour-Over Coffee Set',
    slug: 'ceramic-pour-over-coffee-set',
    description: 'Handcrafted ceramic dripper with carafe for the perfect pour-over coffee experience.',
    price: 74.99,
    compareAtPrice: 89.99,
    sku: 'CF-CRM-005',
    status: 'active',
    inventory: 42,
    category: 'Home & Kitchen',
    images: [
      { id: 'img-5', url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', alt: 'Coffee Set' }
    ],
    createdAt: '2024-01-03T14:00:00Z',
    updatedAt: '2024-01-12T09:00:00Z',
  },
  {
    id: 'prod-006',
    name: 'Yoga Mat Pro',
    slug: 'yoga-mat-pro',
    description: 'Extra thick, non-slip yoga mat with alignment markers. Eco-friendly materials.',
    price: 68.00,
    compareAtPrice: null,
    sku: 'YM-PRO-006',
    status: 'draft',
    inventory: 89,
    category: 'Sports & Fitness',
    images: [
      { id: 'img-6', url: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400', alt: 'Yoga Mat' }
    ],
    createdAt: '2024-01-02T10:00:00Z',
    updatedAt: '2024-01-10T08:00:00Z',
  },
]

export const DEMO_ORDERS = [
  {
    id: 'ord-001',
    orderNumber: 'ORD-2024-1247',
    customer: { name: 'Sarah Johnson', email: 'sarah.j@email.com' },
    status: 'delivered',
    total: 234.98,
    items: 2,
    createdAt: '2024-01-22T15:30:00Z',
    shippingAddress: '123 Main St, New York, NY 10001',
  },
  {
    id: 'ord-002',
    orderNumber: 'ORD-2024-1246',
    customer: { name: 'Michael Chen', email: 'm.chen@email.com' },
    status: 'shipped',
    total: 299.99,
    items: 1,
    createdAt: '2024-01-22T12:00:00Z',
    shippingAddress: '456 Oak Ave, Los Angeles, CA 90001',
  },
  {
    id: 'ord-003',
    orderNumber: 'ORD-2024-1245',
    customer: { name: 'Emily Davis', email: 'emily.d@email.com' },
    status: 'processing',
    total: 169.97,
    items: 3,
    createdAt: '2024-01-22T09:15:00Z',
    shippingAddress: '789 Pine Rd, Chicago, IL 60601',
  },
  {
    id: 'ord-004',
    orderNumber: 'ORD-2024-1244',
    customer: { name: 'James Wilson', email: 'j.wilson@email.com' },
    status: 'pending',
    total: 74.99,
    items: 1,
    createdAt: '2024-01-22T08:00:00Z',
    shippingAddress: '321 Elm St, Houston, TX 77001',
  },
  {
    id: 'ord-005',
    orderNumber: 'ORD-2024-1243',
    customer: { name: 'Lisa Martinez', email: 'lisa.m@email.com' },
    status: 'delivered',
    total: 534.97,
    items: 4,
    createdAt: '2024-01-21T16:45:00Z',
    shippingAddress: '654 Maple Dr, Phoenix, AZ 85001',
  },
]

export const DEMO_CUSTOMERS = [
  {
    id: 'cust-001',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '+1 (555) 123-4567',
    orders: 12,
    totalSpent: 1847.50,
    lastOrder: '2024-01-22T15:30:00Z',
    status: 'active',
    createdAt: '2023-06-15T10:00:00Z',
  },
  {
    id: 'cust-002',
    name: 'Michael Chen',
    email: 'm.chen@email.com',
    phone: '+1 (555) 234-5678',
    orders: 8,
    totalSpent: 2156.00,
    lastOrder: '2024-01-22T12:00:00Z',
    status: 'active',
    createdAt: '2023-07-20T14:00:00Z',
  },
  {
    id: 'cust-003',
    name: 'Emily Davis',
    email: 'emily.d@email.com',
    phone: '+1 (555) 345-6789',
    orders: 5,
    totalSpent: 645.00,
    lastOrder: '2024-01-22T09:15:00Z',
    status: 'active',
    createdAt: '2023-09-10T08:00:00Z',
  },
  {
    id: 'cust-004',
    name: 'James Wilson',
    email: 'j.wilson@email.com',
    phone: '+1 (555) 456-7890',
    orders: 3,
    totalSpent: 289.97,
    lastOrder: '2024-01-22T08:00:00Z',
    status: 'active',
    createdAt: '2023-11-05T12:00:00Z',
  },
  {
    id: 'cust-005',
    name: 'Lisa Martinez',
    email: 'lisa.m@email.com',
    phone: '+1 (555) 567-8901',
    orders: 15,
    totalSpent: 3421.25,
    lastOrder: '2024-01-21T16:45:00Z',
    status: 'vip',
    createdAt: '2023-03-01T09:00:00Z',
  },
]

export const DEMO_BLOG_POSTS = [
  {
    id: 'post-001',
    title: '10 Tips for Building a Successful Online Store',
    slug: '10-tips-successful-online-store',
    excerpt: 'Learn the essential strategies that successful e-commerce businesses use to grow their revenue and customer base.',
    content: '<p>Starting an online store is just the beginning...</p>',
    status: 'published',
    author: { name: 'Alex Thompson', avatar: null },
    category: 'E-Commerce',
    tags: ['tips', 'e-commerce', 'growth'],
    featuredImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
    views: 1247,
    publishedAt: '2024-01-20T10:00:00Z',
    createdAt: '2024-01-18T14:00:00Z',
  },
  {
    id: 'post-002',
    title: 'The Future of AI in Content Management',
    slug: 'future-ai-content-management',
    excerpt: 'Discover how artificial intelligence is transforming the way we create, manage, and optimize digital content.',
    content: '<p>Artificial intelligence has rapidly evolved...</p>',
    status: 'published',
    author: { name: 'Jordan Lee', avatar: null },
    category: 'Technology',
    tags: ['AI', 'CMS', 'future'],
    featuredImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    views: 892,
    publishedAt: '2024-01-18T09:00:00Z',
    createdAt: '2024-01-15T11:00:00Z',
  },
  {
    id: 'post-003',
    title: 'Maximizing Your Website Performance',
    slug: 'maximizing-website-performance',
    excerpt: 'A comprehensive guide to optimizing your website speed, SEO, and user experience for better conversions.',
    content: '<p>Website performance directly impacts...</p>',
    status: 'published',
    author: { name: 'Sam Rivera', avatar: null },
    category: 'Web Development',
    tags: ['performance', 'SEO', 'optimization'],
    featuredImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
    views: 2103,
    publishedAt: '2024-01-15T08:00:00Z',
    createdAt: '2024-01-12T16:00:00Z',
  },
  {
    id: 'post-004',
    title: 'Building Customer Loyalty in 2024',
    slug: 'building-customer-loyalty-2024',
    excerpt: 'Explore proven strategies for creating lasting relationships with your customers and increasing retention rates.',
    content: '<p>Customer loyalty has never been more important...</p>',
    status: 'draft',
    author: { name: 'Alex Thompson', avatar: null },
    category: 'Marketing',
    tags: ['loyalty', 'retention', 'customers'],
    featuredImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
    views: 0,
    publishedAt: null,
    createdAt: '2024-01-22T10:00:00Z',
  },
  {
    id: 'post-005',
    title: 'Essential Security Practices for E-Commerce',
    slug: 'essential-security-practices-ecommerce',
    excerpt: 'Protect your online store and customer data with these critical security measures every business should implement.',
    content: '<p>Security is paramount in e-commerce...</p>',
    status: 'published',
    author: { name: 'Jordan Lee', avatar: null },
    category: 'Security',
    tags: ['security', 'e-commerce', 'best-practices'],
    featuredImage: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800',
    views: 756,
    publishedAt: '2024-01-10T12:00:00Z',
    createdAt: '2024-01-08T09:00:00Z',
  },
]

export const DEMO_PAGES = [
  {
    id: 'page-001',
    title: 'Home',
    slug: '/',
    status: 'published',
    template: 'home',
    showHeader: true,
    showFooter: true,
    metaTitle: 'Welcome to Our Store | Quality Products & Great Service',
    metaDescription: 'Discover our curated collection of premium products. Free shipping on orders over $50.',
    updatedAt: '2024-01-22T14:00:00Z',
    createdAt: '2023-12-01T10:00:00Z',
  },
  {
    id: 'page-002',
    title: 'About Us',
    slug: 'about',
    status: 'published',
    template: 'content',
    showHeader: true,
    showFooter: true,
    metaTitle: 'About Us | Our Story & Mission',
    metaDescription: 'Learn about our journey, values, and commitment to quality.',
    updatedAt: '2024-01-20T11:00:00Z',
    createdAt: '2023-12-01T10:00:00Z',
  },
  {
    id: 'page-003',
    title: 'Contact',
    slug: 'contact',
    status: 'published',
    template: 'contact',
    showHeader: true,
    showFooter: true,
    metaTitle: 'Contact Us | Get in Touch',
    metaDescription: 'Have questions? We\'d love to hear from you. Reach out via email, phone, or our contact form.',
    updatedAt: '2024-01-18T09:00:00Z',
    createdAt: '2023-12-01T10:00:00Z',
  },
  {
    id: 'page-004',
    title: 'FAQ',
    slug: 'faq',
    status: 'published',
    template: 'content',
    showHeader: true,
    showFooter: true,
    metaTitle: 'Frequently Asked Questions',
    metaDescription: 'Find answers to common questions about orders, shipping, returns, and more.',
    updatedAt: '2024-01-15T16:00:00Z',
    createdAt: '2023-12-05T14:00:00Z',
  },
  {
    id: 'page-005',
    title: 'Privacy Policy',
    slug: 'privacy',
    status: 'published',
    template: 'legal',
    showHeader: true,
    showFooter: true,
    metaTitle: 'Privacy Policy',
    metaDescription: 'Our commitment to protecting your privacy and personal information.',
    updatedAt: '2024-01-10T10:00:00Z',
    createdAt: '2023-12-01T10:00:00Z',
  },
  {
    id: 'page-006',
    title: 'Summer Sale Landing',
    slug: 'summer-sale',
    status: 'draft',
    template: 'landing',
    showHeader: false,
    showFooter: true,
    metaTitle: 'Summer Sale - Up to 50% Off',
    metaDescription: 'Don\'t miss our biggest sale of the year! Limited time offers on top products.',
    updatedAt: '2024-01-22T08:00:00Z',
    createdAt: '2024-01-20T12:00:00Z',
  },
]

export const DEMO_MEDIA = [
  {
    id: 'media-001',
    name: 'hero-banner.jpg',
    url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
    type: 'image/jpeg',
    size: 245000,
    width: 1920,
    height: 1080,
    alt: 'Hero banner image',
    folder: 'banners',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'media-002',
    name: 'product-lifestyle.jpg',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
    type: 'image/jpeg',
    size: 156000,
    width: 1200,
    height: 800,
    alt: 'Product lifestyle shot',
    folder: 'products',
    createdAt: '2024-01-14T14:00:00Z',
  },
  {
    id: 'media-003',
    name: 'team-photo.jpg',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
    type: 'image/jpeg',
    size: 198000,
    width: 1200,
    height: 800,
    alt: 'Our team',
    folder: 'about',
    createdAt: '2024-01-10T09:00:00Z',
  },
  {
    id: 'media-004',
    name: 'logo.svg',
    url: '/logo.svg',
    type: 'image/svg+xml',
    size: 4500,
    width: 200,
    height: 50,
    alt: 'Company logo',
    folder: 'brand',
    createdAt: '2023-12-01T10:00:00Z',
  },
  {
    id: 'media-005',
    name: 'blog-cover.jpg',
    url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800',
    type: 'image/jpeg',
    size: 178000,
    width: 1200,
    height: 630,
    alt: 'Blog cover image',
    folder: 'blog',
    createdAt: '2024-01-08T11:00:00Z',
  },
]

export const DEMO_ANALYTICS = {
  visitors: {
    today: 342,
    yesterday: 298,
    thisWeek: 2156,
    thisMonth: 8934,
    trend: 14.7,
  },
  pageViews: {
    today: 1247,
    yesterday: 1089,
    thisWeek: 7823,
    thisMonth: 31456,
    trend: 8.2,
  },
  orders: {
    today: 18,
    yesterday: 14,
    thisWeek: 89,
    thisMonth: 342,
    trend: 22.5,
  },
  revenue: {
    today: 2847.50,
    yesterday: 2156.00,
    thisWeek: 12450.00,
    thisMonth: 48750.00,
    trend: 18.3,
  },
  topProducts: [
    { name: 'Smart Fitness Watch', sales: 45, revenue: 13499.55 },
    { name: 'Premium Wireless Headphones', sales: 38, revenue: 7599.62 },
    { name: 'Ceramic Pour-Over Coffee Set', sales: 32, revenue: 2399.68 },
    { name: 'Minimalist Leather Wallet', sales: 28, revenue: 1679.72 },
    { name: 'Organic Cotton T-Shirt', sales: 24, revenue: 839.76 },
  ],
  topPages: [
    { path: '/', views: 4521, avgTime: '2:34' },
    { path: '/products', views: 3847, avgTime: '3:12' },
    { path: '/products/smart-fitness-watch', views: 1256, avgTime: '4:45' },
    { path: '/blog', views: 987, avgTime: '2:56' },
    { path: '/about', views: 654, avgTime: '1:48' },
  ],
  trafficSources: [
    { source: 'Organic Search', visitors: 4521, percentage: 45 },
    { source: 'Direct', visitors: 2847, percentage: 28 },
    { source: 'Social Media', visitors: 1523, percentage: 15 },
    { source: 'Referral', visitors: 856, percentage: 9 },
    { source: 'Email', visitors: 312, percentage: 3 },
  ],
}

export const DEMO_RECENT_ACTIVITY = [
  { type: 'order', message: 'New order #ORD-2024-1247 from Sarah Johnson', time: '5 minutes ago' },
  { type: 'product', message: 'Product "Yoga Mat Pro" inventory updated', time: '15 minutes ago' },
  { type: 'customer', message: 'New customer registration: James Wilson', time: '32 minutes ago' },
  { type: 'blog', message: 'Blog post "10 Tips for Success" published', time: '1 hour ago' },
  { type: 'page', message: 'Page "Summer Sale Landing" saved as draft', time: '2 hours ago' },
  { type: 'order', message: 'Order #ORD-2024-1246 marked as shipped', time: '3 hours ago' },
  { type: 'media', message: '3 new images uploaded to Media Library', time: '4 hours ago' },
]

// Helper to format currency
export function formatDemoCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

// Helper to format date
export function formatDemoDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Helper to format relative time
export function formatDemoRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins} minutes ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays < 7) return `${diffDays} days ago`
  return formatDemoDate(dateStr)
}
