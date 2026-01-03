/**
 * Root Page Route
 *
 * Dynamically renders content based on RouteConfig for "/"
 * - PUCK: Renders a Puck page from the database
 * - CUSTOM: Renders a registered custom component
 * - REDIRECT: Redirects to another URL
 * - If no config: Shows default home page
 */

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import type { Data } from '@measured/puck'
import { getRouteConfig } from '../lib/routes'
import { getCustomComponent } from '../lib/routes/custom-components'
import { PageWrapper, getPageLayoutSettings } from '../components/page-wrapper'
import { PageRenderer } from '../components/page-wrapper/page-renderer'
import { prisma } from '../lib/db'

/**
 * Generate metadata for the root page
 */
export async function generateMetadata(): Promise<Metadata> {
  const routeConfig = await getRouteConfig('/')

  if (routeConfig.type === 'PUCK' && routeConfig.pageTitle) {
    return {
      title: routeConfig.pageMetaTitle || routeConfig.pageTitle,
      description: routeConfig.pageMetaDescription || undefined,
    }
  }

  return {
    title: 'Home',
    description: 'Welcome to our website',
  }
}

/**
 * Default home page when no route is configured
 */
function DefaultHomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center max-w-2xl px-6">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Welcome
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
          This is the default home page. Configure this route in the admin panel
          to use a Puck page or a custom component.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a
            href="/admin"
            className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            Go to Admin
          </a>
          <a
            href="/admin/routes"
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Manage Routes
          </a>
        </div>
      </div>
    </div>
  )
}

/**
 * Root page component
 */
export default async function RootPage() {
  const routeConfig = await getRouteConfig('/')

  switch (routeConfig.type) {
    case 'PUCK': {
      // Fetch full page data for wrapper settings
      const page = await prisma.page.findUnique({
        where: { id: routeConfig.pageId },
        include: { featuredImage: true },
      })

      if (!page || !routeConfig.pageContent) {
        return <DefaultHomePage />
      }

      return (
        <PageWrapper pageSettings={getPageLayoutSettings(page)}>
          <PageRenderer puckContent={routeConfig.pageContent as Data} />
        </PageWrapper>
      )
    }

    case 'CUSTOM': {
      const CustomComponent = getCustomComponent(routeConfig.componentKey!)
      if (!CustomComponent) {
        return <DefaultHomePage />
      }
      return <CustomComponent />
    }

    case 'REDIRECT': {
      redirect(routeConfig.redirectUrl!)
    }

    default:
      return <DefaultHomePage />
  }
}
