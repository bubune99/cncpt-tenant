"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Globe, Shield, Zap, Users, Play, ShoppingCart, FileText, BarChart3, Image, Mail, Palette, Settings, Sparkles } from "lucide-react"
import { useUser } from "@stackframe/stack"
import { useState } from "react"

export const dynamic = "force-dynamic"

export default function HomePage() {
  const user = useUser()
  const [activeFeature, setActiveFeature] = useState(0)

  const cmsFeatures = [
    {
      id: 'dashboard',
      title: 'Intuitive Dashboard',
      description: 'Get a complete overview of your business at a glance with real-time metrics, recent activity, and quick actions.',
      icon: BarChart3,
    },
    {
      id: 'products',
      title: 'Product Management',
      description: 'Manage your entire product catalog with variants, inventory tracking, pricing, and bulk operations.',
      icon: ShoppingCart,
    },
    {
      id: 'content',
      title: 'Blog & Content',
      description: 'Create engaging content with a rich editor, categories, tags, scheduling, and SEO optimization built-in.',
      icon: FileText,
    },
    {
      id: 'pages',
      title: 'Visual Page Builder',
      description: 'Build stunning pages with our drag-and-drop editor. No coding required - just point, click, and publish.',
      icon: Palette,
    },
    {
      id: 'media',
      title: 'Media Library',
      description: 'Upload, organize, and manage all your images, videos, and files in one central, searchable location.',
      icon: Image,
    },
    {
      id: 'email',
      title: 'Email Marketing',
      description: 'Create beautiful email campaigns, manage subscribers, and track engagement with built-in analytics.',
      icon: Mail,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Globe className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-foreground">CNCPT Web</span>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#cms" className="text-muted-foreground hover:text-foreground transition-colors">
                CMS
              </Link>
              <Link href="/demo" className="text-muted-foreground hover:text-foreground transition-colors">
                Demo
              </Link>
              <Link href="/book" className="text-muted-foreground hover:text-foreground transition-colors">
                Book Consultation
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    Welcome, {user.displayName || user.primaryEmail?.split('@')[0]}
                  </span>
                  <Button asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild className="hidden sm:inline-flex">
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered CMS Platform</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6">
              Build & Manage Your
              <span className="text-primary"> Online Business</span>
            </h1>
            <p className="text-xl text-muted-foreground text-pretty mb-8 max-w-2xl mx-auto">
              The all-in-one platform for creating websites, managing products, publishing content, and growing your business online.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Button size="lg" asChild>
                  <Link href="/dashboard">
                    Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild>
                    <Link href="/register">
                      Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/demo">
                      <Play className="mr-2 h-4 w-4" /> Try Demo
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Features */}
      <section id="features" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to succeed online</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our platform provides all the tools and features you need to create, manage, and grow your online presence.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Lightning Fast Setup</h3>
                <p className="text-muted-foreground">
                  Get your site up and running in minutes, not hours. Our streamlined process makes it incredibly easy.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Enterprise Security</h3>
                <p className="text-muted-foreground">
                  Bank-level security with SSL certificates, DDoS protection, and 99.9% uptime guarantee.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
                <p className="text-muted-foreground">
                  Invite team members, set permissions, and collaborate seamlessly on your projects.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CMS Features with Visual Previews */}
      <section id="cms" className="py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              Powerful CMS
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              A Complete Content Management System
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage products, content, and customers - all in one beautiful interface.
            </p>
            <div className="mt-6">
              <Button asChild variant="outline">
                <Link href="/demo">
                  <Play className="mr-2 h-4 w-4" /> Explore Full Demo
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Feature List */}
            <div className="space-y-4">
              {cmsFeatures.map((feature, index) => (
                <button
                  key={feature.id}
                  onClick={() => setActiveFeature(index)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    activeFeature === index
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      activeFeature === index ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Visual Preview */}
            <div className="lg:sticky lg:top-24">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-2 shadow-2xl">
                <div className="bg-gray-800 rounded-t-xl px-4 py-2 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-xs text-gray-400">CNCPT CMS - {cmsFeatures[activeFeature].title}</span>
                  </div>
                </div>
                <div className="bg-gray-100 rounded-b-xl overflow-hidden">
                  {activeFeature === 0 && <DashboardPreview />}
                  {activeFeature === 1 && <ProductsPreview />}
                  {activeFeature === 2 && <BlogPreview />}
                  {activeFeature === 3 && <PageBuilderPreview />}
                  {activeFeature === 4 && <MediaPreview />}
                  {activeFeature === 5 && <EmailPreview />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* More Features Grid */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">And So Much More</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Discover all the powerful features that make CNCPT Web the complete solution for your business.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: ShoppingCart, title: 'Order Management', desc: 'Process orders, refunds, and fulfillment' },
              { icon: Users, title: 'Customer CRM', desc: 'Track customer history and preferences' },
              { icon: BarChart3, title: 'Analytics', desc: 'Detailed insights and reports' },
              { icon: Settings, title: 'Workflows', desc: 'Automate repetitive tasks' },
              { icon: Shield, title: 'Role Permissions', desc: 'Granular access control' },
              { icon: Globe, title: 'Custom Domains', desc: 'Use your own domain name' },
              { icon: Sparkles, title: 'AI Assistant', desc: 'AI-powered content generation' },
              { icon: Mail, title: 'Email Automation', desc: 'Triggered email campaigns' },
            ].map((item, i) => (
              <div key={i} className="bg-background rounded-xl p-5 border hover:border-primary/50 hover:shadow-md transition-all">
                <item.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Ready to get started?</h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Try our interactive demo or start your free trial today. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Button size="lg" variant="secondary" asChild>
                <Link href="/dashboard">
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/register">
                    Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                  asChild
                >
                  <Link href="/demo">Try Demo First</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Globe className="h-6 w-6 text-primary" />
                <span className="ml-2 text-lg font-bold">CNCPT Web</span>
              </div>
              <p className="text-muted-foreground">
                The all-in-one platform for creating and managing your online business.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="#features" className="hover:text-foreground transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#cms" className="hover:text-foreground transition-colors">
                    CMS
                  </Link>
                </li>
                <li>
                  <Link href="/demo" className="hover:text-foreground transition-colors">
                    Demo
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-foreground transition-colors">
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="/book" className="hover:text-foreground transition-colors">
                    Book Consultation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Status
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} CNCPT Web. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Mini Preview Components

function DashboardPreview() {
  return (
    <div className="p-4 min-h-[300px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 text-sm">Dashboard</h3>
        <span className="text-xs text-gray-500">Today</span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Revenue', value: '$12,450', change: '+12%', color: 'text-green-600' },
          { label: 'Orders', value: '89', change: '+8%', color: 'text-green-600' },
          { label: 'Visitors', value: '2,847', change: '+15%', color: 'text-green-600' },
          { label: 'Products', value: '48', change: '+3', color: 'text-blue-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-lg p-2 shadow-sm border">
            <p className="text-[10px] text-gray-500">{stat.label}</p>
            <p className="text-sm font-bold text-gray-900">{stat.value}</p>
            <p className={`text-[10px] ${stat.color}`}>{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg p-3 shadow-sm border mb-4">
        <p className="text-xs font-medium text-gray-700 mb-2">Revenue This Week</p>
        <div className="flex items-end justify-between h-16 gap-1">
          {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
            <div key={i} className="flex-1 bg-blue-500 rounded-t opacity-80" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg p-3 shadow-sm border">
        <p className="text-xs font-medium text-gray-700 mb-2">Recent Activity</p>
        <div className="space-y-2">
          {[
            { icon: '🛒', text: 'New order #1247', time: '2m ago' },
            { icon: '👤', text: 'New customer signup', time: '15m ago' },
            { icon: '📦', text: 'Order shipped', time: '1h ago' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px]">
              <span>{item.icon}</span>
              <span className="flex-1 text-gray-700">{item.text}</span>
              <span className="text-gray-400">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ProductsPreview() {
  const products = [
    { name: 'Wireless Headphones', price: '$199.99', stock: 45, status: 'active' },
    { name: 'Smart Watch Pro', price: '$299.99', stock: 23, status: 'active' },
    { name: 'Leather Wallet', price: '$59.99', stock: 89, status: 'active' },
    { name: 'Coffee Set', price: '$74.99', stock: 0, status: 'draft' },
  ]

  return (
    <div className="p-4 min-h-[300px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 text-sm">Products</h3>
        <button className="bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-medium">+ Add</button>
      </div>

      {/* Search */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Search products..."
          className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white"
          readOnly
        />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-[10px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-gray-500 font-medium">Product</th>
              <th className="px-3 py-2 text-left text-gray-500 font-medium">Price</th>
              <th className="px-3 py-2 text-left text-gray-500 font-medium">Stock</th>
              <th className="px-3 py-2 text-left text-gray-500 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((p, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-medium text-gray-900">{p.name}</td>
                <td className="px-3 py-2 text-gray-600">{p.price}</td>
                <td className="px-3 py-2 text-gray-600">{p.stock}</td>
                <td className="px-3 py-2">
                  <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-medium ${
                    p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BlogPreview() {
  const posts = [
    { title: '10 Tips for E-Commerce Success', status: 'published', views: 1247 },
    { title: 'The Future of AI in Content', status: 'published', views: 892 },
    { title: 'Maximizing Website Performance', status: 'draft', views: 0 },
  ]

  return (
    <div className="p-4 min-h-[300px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 text-sm">Blog Posts</h3>
        <button className="bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-medium">+ New Post</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-3">
        {['All', 'Published', 'Draft'].map((tab, i) => (
          <button
            key={tab}
            className={`px-2 py-1 rounded text-[10px] font-medium ${
              i === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-2">
        {posts.map((post, i) => (
          <div key={i} className="bg-white rounded-lg p-3 shadow-sm border flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{post.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-medium ${
                  post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {post.status}
                </span>
                <span className="text-[10px] text-gray-400">{post.views} views</span>
              </div>
            </div>
            <button className="text-[10px] text-blue-600 font-medium">Edit</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function PageBuilderPreview() {
  return (
    <div className="p-4 min-h-[300px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 text-sm">Page Builder</h3>
        <button className="bg-green-600 text-white px-2 py-1 rounded text-[10px] font-medium">Publish</button>
      </div>

      <div className="flex gap-2">
        {/* Components Sidebar */}
        <div className="w-20 bg-white rounded-lg shadow-sm border p-2 space-y-2">
          <p className="text-[8px] font-medium text-gray-500 uppercase">Components</p>
          {['Hero', 'Text', 'Image', 'Grid', 'CTA'].map((comp) => (
            <div key={comp} className="bg-gray-50 rounded p-1.5 text-[9px] text-center text-gray-600 cursor-grab hover:bg-gray-100">
              {comp}
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border p-2">
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-3 mb-2 bg-blue-50">
            <div className="h-8 bg-blue-200 rounded mb-2" />
            <div className="h-3 bg-blue-200 rounded w-2/3 mx-auto" />
          </div>
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-2 mb-2">
            <div className="h-2 bg-gray-200 rounded mb-1" />
            <div className="h-2 bg-gray-200 rounded mb-1" />
            <div className="h-2 bg-gray-200 rounded w-3/4" />
          </div>
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3].map((n) => (
              <div key={n} className="aspect-square bg-gray-100 rounded border-2 border-dashed border-gray-200" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MediaPreview() {
  return (
    <div className="p-4 min-h-[300px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 text-sm">Media Library</h3>
        <button className="bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-medium">+ Upload</button>
      </div>

      {/* Upload Zone */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center mb-3 bg-white">
        <div className="text-gray-400 text-xl mb-1">📁</div>
        <p className="text-[10px] text-gray-500">Drop files here or click to upload</p>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-4 gap-2">
        {[
          'bg-gradient-to-br from-blue-400 to-purple-500',
          'bg-gradient-to-br from-green-400 to-teal-500',
          'bg-gradient-to-br from-orange-400 to-red-500',
          'bg-gradient-to-br from-pink-400 to-purple-500',
          'bg-gradient-to-br from-yellow-400 to-orange-500',
          'bg-gradient-to-br from-indigo-400 to-blue-500',
          'bg-gradient-to-br from-teal-400 to-green-500',
          'bg-gradient-to-br from-red-400 to-pink-500',
        ].map((bg, i) => (
          <div
            key={i}
            className={`aspect-square ${bg} rounded-lg cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all`}
          />
        ))}
      </div>
    </div>
  )
}

function EmailPreview() {
  return (
    <div className="p-4 min-h-[300px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 text-sm">Email Marketing</h3>
        <button className="bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-medium">+ Campaign</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Subscribers', value: '2,847' },
          { label: 'Open Rate', value: '42.3%' },
          { label: 'Click Rate', value: '8.7%' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-lg p-2 shadow-sm border text-center">
            <p className="text-xs font-bold text-gray-900">{stat.value}</p>
            <p className="text-[9px] text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Campaigns */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-3 py-2 bg-gray-50 border-b">
          <p className="text-[10px] font-medium text-gray-700">Recent Campaigns</p>
        </div>
        <div className="divide-y">
          {[
            { name: 'Welcome Series', sent: 156, status: 'active' },
            { name: 'Flash Sale Alert', sent: 2847, status: 'sent' },
            { name: 'Newsletter #12', sent: 0, status: 'draft' },
          ].map((campaign, i) => (
            <div key={i} className="px-3 py-2 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-gray-900">{campaign.name}</p>
                <p className="text-[9px] text-gray-500">{campaign.sent} sent</p>
              </div>
              <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-medium ${
                campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                campaign.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {campaign.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
