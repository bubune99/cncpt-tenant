'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  DEMO_STATS,
  DEMO_PRODUCTS,
  DEMO_ORDERS,
  DEMO_BLOG_POSTS,
  DEMO_PAGES,
  DEMO_CUSTOMERS,
  DEMO_ANALYTICS,
  DEMO_RECENT_ACTIVITY,
  formatDemoCurrency,
  formatDemoDate,
} from '@/lib/demo-data'

type Section = 'dashboard' | 'products' | 'orders' | 'customers' | 'blog' | 'pages' | 'media' | 'analytics' | 'settings'

export default function DemoPage() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate initial load
    setTimeout(() => setLoading(false), 800)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading CMS Demo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 text-center text-sm font-medium sticky top-0 z-50">
        <span className="inline-flex items-center gap-2 flex-wrap justify-center">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold">DEMO MODE</span>
          <span className="hidden sm:inline">— Explore all features with sample data. Changes won&apos;t be saved.</span>
          <Link
            href="/pricing"
            className="ml-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-semibold transition-colors"
          >
            Start Free Trial →
          </Link>
        </span>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gray-900 text-white min-h-[calc(100vh-40px)] transition-all duration-300 flex flex-col`}>
          {/* Logo */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            {sidebarOpen && <span className="font-bold text-lg">CNCPT CMS</span>}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded hover:bg-gray-800"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" : "M13 5l7 7-7 7M5 5l7 7-7 7"} />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1">
            <NavItem icon="dashboard" label="Dashboard" active={activeSection === 'dashboard'} onClick={() => setActiveSection('dashboard')} collapsed={!sidebarOpen} />

            {sidebarOpen && <div className="pt-4 pb-2 px-3 text-xs font-semibold text-gray-500 uppercase">E-Commerce</div>}
            <NavItem icon="products" label="Products" active={activeSection === 'products'} onClick={() => setActiveSection('products')} collapsed={!sidebarOpen} />
            <NavItem icon="orders" label="Orders" active={activeSection === 'orders'} onClick={() => setActiveSection('orders')} collapsed={!sidebarOpen} />
            <NavItem icon="customers" label="Customers" active={activeSection === 'customers'} onClick={() => setActiveSection('customers')} collapsed={!sidebarOpen} />

            {sidebarOpen && <div className="pt-4 pb-2 px-3 text-xs font-semibold text-gray-500 uppercase">Content</div>}
            <NavItem icon="pages" label="Pages" active={activeSection === 'pages'} onClick={() => setActiveSection('pages')} collapsed={!sidebarOpen} />
            <NavItem icon="blog" label="Blog" active={activeSection === 'blog'} onClick={() => setActiveSection('blog')} collapsed={!sidebarOpen} />
            <NavItem icon="media" label="Media" active={activeSection === 'media'} onClick={() => setActiveSection('media')} collapsed={!sidebarOpen} />

            {sidebarOpen && <div className="pt-4 pb-2 px-3 text-xs font-semibold text-gray-500 uppercase">System</div>}
            <NavItem icon="analytics" label="Analytics" active={activeSection === 'analytics'} onClick={() => setActiveSection('analytics')} collapsed={!sidebarOpen} />
            <NavItem icon="settings" label="Settings" active={activeSection === 'settings'} onClick={() => setActiveSection('settings')} collapsed={!sidebarOpen} />
          </nav>

          {/* User */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium">
                D
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Demo User</p>
                  <p className="text-xs text-gray-400 truncate">demo@cncptweb.com</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {activeSection === 'dashboard' && <DashboardSection />}
          {activeSection === 'products' && <ProductsSection />}
          {activeSection === 'orders' && <OrdersSection />}
          {activeSection === 'customers' && <CustomersSection />}
          {activeSection === 'blog' && <BlogSection />}
          {activeSection === 'pages' && <PagesSection />}
          {activeSection === 'media' && <MediaSection />}
          {activeSection === 'analytics' && <AnalyticsSection />}
          {activeSection === 'settings' && <SettingsSection />}
        </main>
      </div>
    </div>
  )
}

// Navigation Item Component
function NavItem({ icon, label, active, onClick, collapsed }: {
  icon: string
  label: string
  active: boolean
  onClick: () => void
  collapsed: boolean
}) {
  const icons: Record<string, JSX.Element> = {
    dashboard: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    products: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
    orders: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />,
    customers: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
    pages: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />,
    blog: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />,
    media: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />,
    analytics: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    settings: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />,
  }

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
      title={collapsed ? label : undefined}
    >
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {icons[icon]}
      </svg>
      {!collapsed && <span className="text-sm">{label}</span>}
    </button>
  )
}

// Dashboard Section
function DashboardSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <span className="text-sm text-gray-500">Last updated: Just now</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={formatDemoCurrency(DEMO_STATS.totalRevenue)} change="+12.5%" positive icon="revenue" />
        <StatCard title="Orders" value={DEMO_STATS.totalOrders.toString()} change="+8.2%" positive icon="orders" />
        <StatCard title="Products" value={DEMO_STATS.totalProducts.toString()} change="+3" positive icon="products" />
        <StatCard title="Customers" value={DEMO_STATS.totalUsers.toString()} change="+15.3%" positive icon="customers" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue Overview</h3>
          <div className="h-48 flex items-end justify-between gap-2">
            {[65, 45, 78, 52, 88, 67, 95, 72, 85, 60, 90, 75].map((height, i) => (
              <div key={i} className="flex-1 bg-blue-500 rounded-t opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
            <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {DEMO_RECENT_ACTIVITY.slice(0, 5).map((activity, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'order' ? 'bg-green-500' :
                  activity.type === 'product' ? 'bg-blue-500' :
                  activity.type === 'customer' ? 'bg-purple-500' :
                  activity.type === 'blog' ? 'bg-orange-500' : 'bg-gray-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Recent Orders</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700">View all →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b">
                <th className="pb-3 font-medium">Order</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Total</th>
                <th className="pb-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {DEMO_ORDERS.slice(0, 5).map(order => (
                <tr key={order.id} className="text-sm">
                  <td className="py-3 font-medium text-blue-600">{order.orderNumber}</td>
                  <td className="py-3 text-gray-900">{order.customer.name}</td>
                  <td className="py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="py-3 text-gray-900">{formatDemoCurrency(order.total)}</td>
                  <td className="py-3 text-gray-500">{formatDemoDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ title, value, change, positive, icon }: {
  title: string
  value: string
  change: string
  positive: boolean
  icon: string
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{title}</span>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {change}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  )
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    delivered: 'bg-green-100 text-green-700',
    shipped: 'bg-blue-100 text-blue-700',
    processing: 'bg-yellow-100 text-yellow-700',
    pending: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
    active: 'bg-green-100 text-green-700',
    draft: 'bg-gray-100 text-gray-700',
    published: 'bg-green-100 text-green-700',
    vip: 'bg-purple-100 text-purple-700',
  }

  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${styles[status] || styles.pending}`}>
      {status}
    </span>
  )
}

// Products Section
function ProductsSection() {
  const [search, setSearch] = useState('')
  const filtered = DEMO_PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + Add Product
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
            <option>All Categories</option>
            <option>Electronics</option>
            <option>Apparel</option>
            <option>Accessories</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
            <option>All Status</option>
            <option>Active</option>
            <option>Draft</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(product => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-video bg-gray-100 relative">
              {product.images[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
              )}
              <div className="absolute top-2 right-2">
                <StatusBadge status={product.status} />
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{product.sku}</p>
              <div className="flex items-center justify-between mt-3">
                <div>
                  <span className="font-semibold text-gray-900">{formatDemoCurrency(product.price)}</span>
                  {product.compareAtPrice && (
                    <span className="text-sm text-gray-400 line-through ml-2">{formatDemoCurrency(product.compareAtPrice)}</span>
                  )}
                </div>
                <span className="text-sm text-gray-500">{product.inventory} in stock</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Orders Section
function OrdersSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + Create Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
          <button
            key={status}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              status === 'All' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs text-gray-500 uppercase">
              <th className="px-6 py-4 font-medium">Order</th>
              <th className="px-6 py-4 font-medium">Customer</th>
              <th className="px-6 py-4 font-medium">Items</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Total</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {DEMO_ORDERS.map(order => (
              <tr key={order.id} className="text-sm hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-blue-600">{order.orderNumber}</td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-gray-900">{order.customer.name}</p>
                    <p className="text-gray-500 text-xs">{order.customer.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-900">{order.items} items</td>
                <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                <td className="px-6 py-4 font-medium text-gray-900">{formatDemoCurrency(order.total)}</td>
                <td className="px-6 py-4 text-gray-500">{formatDemoDate(order.createdAt)}</td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Customers Section
function CustomersSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + Add Customer
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs text-gray-500 uppercase">
              <th className="px-6 py-4 font-medium">Customer</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Orders</th>
              <th className="px-6 py-4 font-medium">Total Spent</th>
              <th className="px-6 py-4 font-medium">Last Order</th>
              <th className="px-6 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {DEMO_CUSTOMERS.map(customer => (
              <tr key={customer.id} className="text-sm hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-medium text-gray-600">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{customer.name}</p>
                      <p className="text-gray-500 text-xs">{customer.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4"><StatusBadge status={customer.status} /></td>
                <td className="px-6 py-4 text-gray-900">{customer.orders}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{formatDemoCurrency(customer.totalSpent)}</td>
                <td className="px-6 py-4 text-gray-500">{formatDemoDate(customer.lastOrder)}</td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Blog Section
function BlogSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + New Post
        </button>
      </div>

      <div className="flex gap-2">
        {['All', 'Published', 'Draft', 'Scheduled'].map(status => (
          <button
            key={status}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              status === 'All' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {DEMO_BLOG_POSTS.map(post => (
          <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex gap-4">
              {post.featuredImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.featuredImage} alt="" className="w-32 h-20 object-cover rounded-lg flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900">{post.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.excerpt}</p>
                  </div>
                  <StatusBadge status={post.status} />
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span>By {post.author.name}</span>
                  <span>{post.category}</span>
                  <span>{post.views.toLocaleString()} views</span>
                  {post.publishedAt && <span>{formatDemoDate(post.publishedAt)}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Pages Section
function PagesSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pages</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + New Page
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs text-gray-500 uppercase">
              <th className="px-6 py-4 font-medium">Page</th>
              <th className="px-6 py-4 font-medium">Slug</th>
              <th className="px-6 py-4 font-medium">Template</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Updated</th>
              <th className="px-6 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {DEMO_PAGES.map(page => (
              <tr key={page.id} className="text-sm hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{page.title}</td>
                <td className="px-6 py-4 text-gray-500 font-mono text-xs">/{page.slug}</td>
                <td className="px-6 py-4 text-gray-500 capitalize">{page.template}</td>
                <td className="px-6 py-4"><StatusBadge status={page.status} /></td>
                <td className="px-6 py-4 text-gray-500">{formatDemoDate(page.updatedAt)}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">Edit</button>
                    <button className="text-gray-400 hover:text-gray-600 text-sm font-medium">Preview</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Media Section
function MediaSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + Upload Files
        </button>
      </div>

      {/* Upload Zone */}
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
        <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="mt-4 text-gray-600">Drag and drop files here, or click to browse</p>
        <p className="text-sm text-gray-400 mt-1">PNG, JPG, GIF, SVG, WebP up to 10MB</p>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="aspect-square bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 cursor-pointer transition-all">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://images.unsplash.com/photo-${1500000000000 + i * 100000}?w=200&h=200&fit=crop`}
              alt={`Media ${i + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=Image'
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// Analytics Section
function AnalyticsSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>Last 90 days</option>
          <option>This year</option>
        </select>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Visitors" value={DEMO_ANALYTICS.visitors.thisMonth.toLocaleString()} change={`+${DEMO_ANALYTICS.visitors.trend}%`} positive icon="visitors" />
        <StatCard title="Page Views" value={DEMO_ANALYTICS.pageViews.thisMonth.toLocaleString()} change={`+${DEMO_ANALYTICS.pageViews.trend}%`} positive icon="pageviews" />
        <StatCard title="Orders" value={DEMO_ANALYTICS.orders.thisMonth.toString()} change={`+${DEMO_ANALYTICS.orders.trend}%`} positive icon="orders" />
        <StatCard title="Revenue" value={formatDemoCurrency(DEMO_ANALYTICS.revenue.thisMonth)} change={`+${DEMO_ANALYTICS.revenue.trend}%`} positive icon="revenue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Top Products</h3>
          <div className="space-y-3">
            {DEMO_ANALYTICS.topProducts.map((product, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-gray-100 rounded text-xs flex items-center justify-center font-medium text-gray-600">{i + 1}</span>
                  <span className="text-sm text-gray-900">{product.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatDemoCurrency(product.revenue)}</p>
                  <p className="text-xs text-gray-500">{product.sales} sales</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Traffic Sources</h3>
          <div className="space-y-3">
            {DEMO_ANALYTICS.trafficSources.map((source, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-900">{source.source}</span>
                  <span className="text-sm text-gray-500">{source.percentage}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${source.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Settings Section
function SettingsSection() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y">
        {/* General */}
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">General Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
              <input type="text" defaultValue="Demo Store" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site URL</label>
              <input type="text" defaultValue="https://demo.cncptweb.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option>America/New_York</option>
                <option>America/Los_Angeles</option>
                <option>Europe/London</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option>USD ($)</option>
                <option>EUR (€)</option>
                <option>GBP (£)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Email Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
              <input type="text" defaultValue="Demo Store" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Email</label>
              <input type="email" defaultValue="noreply@demo.cncptweb.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="p-6 bg-gray-50">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            Save Settings
          </button>
          <span className="ml-4 text-sm text-gray-500">(Demo mode - changes won&apos;t be saved)</span>
        </div>
      </div>
    </div>
  )
}
