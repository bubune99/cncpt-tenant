/**
 * Seed Welcome Page
 *
 * Creates a welcome page that points first-time users to the login page.
 * Run with: npx tsx prisma/seed-welcome-page.ts
 */

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL!;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Puck content for the welcome page
const welcomePageContent = {
  root: {
    props: {
      title: 'Welcome',
    },
  },
  content: [
    {
      type: 'HeroSection',
      props: {
        id: 'hero-welcome',
        title: 'Welcome to Our Platform',
        subtitle: 'A powerful content management system with e-commerce, visual page builder, blog system, and AI chat integration.',
        backgroundColor: '#0f172a',
        textColor: '#ffffff',
        height: 'large',
        alignment: 'center',
        overlay: false,
        overlayOpacity: 50,
      },
    },
    {
      type: 'CTASection',
      props: {
        id: 'cta-login',
        title: 'Get Started',
        description: 'Sign in to access the admin dashboard and start managing your content.',
        buttonText: 'Sign In',
        buttonUrl: '/handler/sign-in',
        backgroundColor: '#3b82f6',
        textColor: '#ffffff',
        alignment: 'center',
      },
    },
    {
      type: 'Spacer',
      props: {
        id: 'spacer-1',
        height: 64,
      },
    },
    {
      type: 'Container',
      props: {
        id: 'features-container',
        maxWidth: '6xl',
        padding: 'lg',
      },
    },
    {
      type: 'Heading',
      props: {
        id: 'features-heading',
        text: 'Platform Features',
        level: 2,
        align: 'center',
      },
    },
    {
      type: 'Spacer',
      props: {
        id: 'spacer-2',
        height: 32,
      },
    },
    {
      type: 'Columns',
      props: {
        id: 'features-columns',
        columns: 3,
        gap: 'lg',
      },
    },
    {
      type: 'Text',
      props: {
        id: 'feature-1',
        text: '<strong>Visual Page Builder</strong><br/>Create stunning pages with our drag-and-drop Puck editor. No coding required.',
        align: 'center',
      },
    },
    {
      type: 'Text',
      props: {
        id: 'feature-2',
        text: '<strong>E-commerce Ready</strong><br/>Sell products with Stripe integration, inventory management, and order tracking.',
        align: 'center',
      },
    },
    {
      type: 'Text',
      props: {
        id: 'feature-3',
        text: '<strong>AI Assistant</strong><br/>Get help from our AI-powered chat assistant for content creation and management.',
        align: 'center',
      },
    },
    {
      type: 'Spacer',
      props: {
        id: 'spacer-3',
        height: 64,
      },
    },
    {
      type: 'CTASection',
      props: {
        id: 'cta-admin',
        title: 'Already have an account?',
        description: 'Access the admin dashboard to manage your content.',
        buttonText: 'Go to Admin',
        buttonUrl: '/admin',
        backgroundColor: '#1e293b',
        textColor: '#ffffff',
        alignment: 'center',
      },
    },
  ],
  zones: {},
};

async function main() {
  console.log('🌱 Seeding welcome page...\n');

  // 1. Create or update the welcome page (using findFirst for compound unique constraint)
  console.log('📄 Creating welcome page...');
  const existingPage = await prisma.page.findFirst({
    where: { slug: 'welcome', tenantId: null },
  });

  let welcomePage;
  if (existingPage) {
    welcomePage = await prisma.page.update({
      where: { id: existingPage.id },
      data: {
        title: 'Welcome',
        status: 'PUBLISHED',
        content: welcomePageContent,
        metaTitle: 'Welcome | CMS Platform',
        metaDescription: 'Welcome to our content management platform. Sign in to get started.',
      },
    });
  } else {
    welcomePage = await prisma.page.create({
      data: {
        title: 'Welcome',
        slug: 'welcome',
        status: 'PUBLISHED',
        content: welcomePageContent,
        metaTitle: 'Welcome | CMS Platform',
        metaDescription: 'Welcome to our content management platform. Sign in to get started.',
        tenantId: null,
      },
    });
  }
  console.log(`   ✅ Welcome page created/updated (${welcomePage.id})`);

  // 2. Create or update the route config for "/"
  console.log('\n🔗 Configuring root route...');

  // First check if a route config already exists for "/" (using findFirst for compound unique constraint)
  const existingRoute = await prisma.routeConfig.findFirst({
    where: { slug: '/', tenantId: null },
  });

  if (existingRoute) {
    // Update existing route to point to welcome page
    await prisma.routeConfig.update({
      where: { id: existingRoute.id },
      data: {
        type: 'PUCK',
        pageId: welcomePage.id,
        componentKey: null,
        redirectUrl: null,
        isActive: true,
        description: 'Welcome page for first-time visitors',
      },
    });
    console.log(`   ✅ Updated existing route config for "/" to use welcome page`);
  } else {
    // Create new route config
    await prisma.routeConfig.create({
      data: {
        slug: '/',
        type: 'PUCK',
        pageId: welcomePage.id,
        isActive: true,
        description: 'Welcome page for first-time visitors',
        tenantId: null,
      },
    });
    console.log(`   ✅ Created new route config for "/" pointing to welcome page`);
  }

  console.log('\n✨ Welcome page seeding completed!\n');
  console.log('The home page (/) now displays the welcome page with:');
  console.log('  - Hero section with platform introduction');
  console.log('  - Sign In button pointing to /handler/sign-in');
  console.log('  - Feature highlights');
  console.log('  - Admin dashboard link');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
