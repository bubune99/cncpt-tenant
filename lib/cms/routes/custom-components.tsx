/**
 * Custom Components Registry
 *
 * Register custom-coded React components that can be used at root-level routes.
 * These are alternatives to Puck pages for routes that need custom functionality.
 *
 * To add a new custom component:
 * 1. Create your component
 * 2. Add it to the CUSTOM_COMPONENTS map below
 * 3. In admin, create a route with type "CUSTOM" and use the key
 */

import { ComponentType } from 'react'

// Default home page component (placeholder)
function DefaultHomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center max-w-2xl px-6">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Welcome
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
          This is the default home page. Configure this route in the admin panel
          to use a Puck page or a different custom component.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/admin"
            className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            Go to Admin
          </a>
          <a
            href="/admin/routes"
            className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors dark:border-slate-600 dark:hover:bg-slate-800"
          >
            Manage Routes
          </a>
        </div>
      </div>
    </div>
  )
}

// Example: Landing page component
function LandingPageV1() {
  return (
    <div className="min-h-screen">
      <header className="bg-white dark:bg-slate-900 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Landing Page V1
          </h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-12 px-4">
        <p className="text-slate-600 dark:text-slate-300">
          This is a custom-coded landing page component.
          Edit <code>src/lib/routes/custom-components.tsx</code> to customize.
        </p>
      </main>
    </div>
  )
}

/**
 * Registry of custom components
 *
 * Key: Unique identifier used in RouteConfig.componentKey
 * Value: Object with component and metadata
 */
export const CUSTOM_COMPONENTS: Record<string, {
  component: ComponentType
  name: string
  description: string
}> = {
  'default-home': {
    component: DefaultHomePage,
    name: 'Default Home',
    description: 'Simple welcome page with links to admin',
  },
  'landing-v1': {
    component: LandingPageV1,
    name: 'Landing Page V1',
    description: 'Basic landing page template',
  },
  // Add more custom components here:
  // 'marketing-home': {
  //   component: MarketingHomePage,
  //   name: 'Marketing Home',
  //   description: 'Full marketing homepage with hero, features, testimonials',
  // },
}

/**
 * Get a custom component by key
 */
export function getCustomComponent(key: string): ComponentType | null {
  return CUSTOM_COMPONENTS[key]?.component || null
}

/**
 * Get all available custom components (for admin UI)
 */
export function getAvailableCustomComponents() {
  return Object.entries(CUSTOM_COMPONENTS).map(([key, value]) => ({
    key,
    name: value.name,
    description: value.description,
  }))
}
