/**
 * Default Walkthrough Tours
 *
 * Pre-built Joyride tours for common workflows.
 * These can be seeded to the database or used as templates.
 */

import type { HelpTour, JoyrideStep } from './types'

// Tour: Getting Started with Admin
export const gettingStartedTour: Omit<HelpTour, 'id'> = {
  slug: 'getting-started',
  title: 'Getting Started with Your CMS',
  description:
    'A quick introduction to the main areas of your admin dashboard.',
  isActive: true,
  steps: [
    {
      target: '[data-help-key="admin.sidebar.dashboard"]',
      content:
        'Welcome to your CMS dashboard! This is your home base where you can see an overview of your store.',
      title: 'Dashboard',
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: '[data-help-key="admin.sidebar.products"]',
      content:
        'Manage your product catalog here. Add new products, edit existing ones, and organize your inventory.',
      title: 'Products',
      placement: 'right',
    },
    {
      target: '[data-help-key="admin.sidebar.orders"]',
      content:
        'View and manage customer orders. Track order status, process shipments, and handle returns.',
      title: 'Orders',
      placement: 'right',
    },
    {
      target: '[data-help-key="admin.sidebar.pages"]',
      content:
        'Create and edit website pages using our visual editor. Build landing pages, about pages, and more.',
      title: 'Pages',
      placement: 'right',
    },
    {
      target: '[data-help-key="admin.sidebar.settings"]',
      content:
        "Configure your store settings, payment processing, shipping options, and more. Let's explore the dashboard!",
      title: 'Settings',
      placement: 'right',
    },
  ] as JoyrideStep[],
  options: {
    continuous: true,
    scrollToFirstStep: true,
    showProgress: true,
    showSkipButton: true,
  },
}

// Tour: Creating Your First Product
export const createProductTour: Omit<HelpTour, 'id'> = {
  slug: 'create-product',
  title: 'Create Your First Product',
  description: 'Learn how to add a new product to your catalog.',
  isActive: true,
  route: '/admin/products',
  steps: [
    {
      target: '[data-help-key="products.add-button"]',
      content: 'Click this button to start adding a new product to your catalog.',
      title: 'Add New Product',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-help-key="product.title-field"]',
      content:
        'Give your product a clear, descriptive title. This is what customers will see.',
      title: 'Product Title',
      placement: 'bottom',
    },
    {
      target: '[data-help-key="product.price-field"]',
      content: 'Set your product price. You can also add a compare-at price for sales.',
      title: 'Pricing',
      placement: 'left',
    },
    {
      target: '[data-help-key="product.images-section"]',
      content:
        'Upload product images. High-quality photos help customers make purchase decisions.',
      title: 'Product Images',
      placement: 'left',
    },
    {
      target: '[data-help-key="product.save-button"]',
      content: "When you're ready, save your product. You can always edit it later!",
      title: 'Save Product',
      placement: 'top',
    },
  ] as JoyrideStep[],
  options: {
    continuous: true,
    scrollToFirstStep: true,
    showProgress: true,
    showSkipButton: true,
  },
}

// Tour: Using the Page Editor
export const pageEditorTour: Omit<HelpTour, 'id'> = {
  slug: 'page-editor',
  title: 'Using the Visual Page Editor',
  description: 'Learn how to build beautiful pages with drag-and-drop.',
  isActive: true,
  route: '/editor',
  steps: [
    {
      target: '[data-help-key="puck.components"]',
      content:
        'This is your component library. Drag components from here onto your page canvas.',
      title: 'Component Library',
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: '[data-help-key="puck.canvas"]',
      content:
        'This is your page canvas. Arrange components here to build your layout.',
      title: 'Page Canvas',
      placement: 'left',
    },
    {
      target: '[data-help-key="puck.settings"]',
      content:
        'When you select a component, its settings appear here. Customize content, styling, and behavior.',
      title: 'Component Settings',
      placement: 'left',
    },
    {
      target: '[data-help-key="puck.preview"]',
      content:
        'Preview your page on different device sizes to ensure it looks great everywhere.',
      title: 'Preview',
      placement: 'bottom',
    },
    {
      target: '[data-help-key="puck.publish"]',
      content:
        "When you're happy with your page, publish it to make it live on your website.",
      title: 'Publish',
      placement: 'bottom',
    },
  ] as JoyrideStep[],
  options: {
    continuous: true,
    scrollToFirstStep: true,
    showProgress: true,
    showSkipButton: true,
  },
}

/**
 * All default tours
 */
export const defaultTours = [
  gettingStartedTour,
  createProductTour,
  pageEditorTour,
]

/**
 * Seed default tours to database
 * Call this from a seed script or admin action
 */
export async function seedDefaultTours() {
  const results = []

  for (const tour of defaultTours) {
    try {
      const response = await fetch('/api/help/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tour),
      })

      if (response.ok) {
        results.push({ slug: tour.slug, success: true })
      } else if (response.status === 409) {
        // Already exists
        results.push({ slug: tour.slug, success: true, skipped: true })
      } else {
        results.push({ slug: tour.slug, success: false, error: await response.text() })
      }
    } catch (error) {
      results.push({
        slug: tour.slug,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return results
}
