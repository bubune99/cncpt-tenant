/**
 * Demo Setup API
 *
 * POST /api/setup/demo
 *
 * Initializes the demo subdomain with sample data.
 * This is a one-time setup endpoint, protected by a secret.
 */

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/neon";
import { redis } from "@/lib/redis";
import { DEMO_CONFIG } from "@/lib/demo";

export const dynamic = "force-dynamic";

// Simple secret check - in production, use a proper auth mechanism
const SETUP_SECRET = process.env.DEMO_SETUP_SECRET || "demo-setup-secret";

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${SETUP_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if demo subdomain already exists
    const existing = await sql`
      SELECT id FROM subdomains WHERE subdomain = 'demo'
    `;

    if (existing.length > 0) {
      return NextResponse.json({
        message: "Demo subdomain already exists",
        subdomainId: existing[0].id,
        exists: true,
      });
    }

    // Create demo subdomain
    const result = await sql`
      INSERT INTO subdomains (user_id, subdomain, emoji, site_name, contact_email, onboarding_completed)
      VALUES ('demo-system', 'demo', '🎯', ${DEMO_CONFIG.siteName}, ${DEMO_CONFIG.contactEmail}, true)
      RETURNING id
    `;

    const subdomainId = result[0].id;

    // Create tenant settings
    await sql`
      INSERT INTO tenant_settings (subdomain, site_name, site_description, contact_email)
      VALUES ('demo', ${DEMO_CONFIG.siteName}, ${DEMO_CONFIG.siteDescription}, ${DEMO_CONFIG.contactEmail})
      ON CONFLICT (subdomain) DO UPDATE SET
        site_name = ${DEMO_CONFIG.siteName},
        site_description = ${DEMO_CONFIG.siteDescription}
    `;

    // Also store in Redis for compatibility
    await redis.set(`subdomain:demo`, {
      emoji: "🎯",
      siteName: DEMO_CONFIG.siteName,
      createdAt: Date.now(),
      userId: "demo-system",
      isDemo: true,
    });

    // Seed sample blog posts if the posts table exists
    try {
      await sql`
        INSERT INTO posts (subdomain, title, slug, content, excerpt, status, author_id, created_at)
        VALUES
          ('demo', 'Welcome to CNCPT CMS', 'welcome-to-cncpt-cms',
           '<p>Welcome to the CNCPT CMS demo! This is a sample blog post to showcase our content management features.</p><p>With CNCPT, you can:</p><ul><li>Create and manage blog posts</li><li>Organize content with categories and tags</li><li>Schedule posts for future publication</li><li>Optimize for SEO with meta tags</li></ul>',
           'Explore the powerful features of CNCPT CMS',
           'published', 'demo-system', NOW()),
          ('demo', 'Building Your Online Store', 'building-your-online-store',
           '<p>Setting up an e-commerce store with CNCPT is straightforward. Our platform provides all the tools you need to manage products, track orders, and grow your business.</p>',
           'Learn how to set up and manage your online store',
           'published', 'demo-system', NOW() - INTERVAL '2 days'),
          ('demo', 'AI-Powered Content Creation', 'ai-powered-content-creation',
           '<p>CNCPT integrates AI features to help you create content faster. Generate product descriptions, blog posts, and marketing copy with our built-in AI assistant.</p>',
           'Discover how AI can enhance your content workflow',
           'published', 'demo-system', NOW() - INTERVAL '5 days')
        ON CONFLICT (subdomain, slug) DO NOTHING
      `;
    } catch (e) {
      console.log("[demo-setup] Posts table may not exist, skipping blog seeding");
    }

    // Seed sample products if the products table exists
    try {
      await sql`
        INSERT INTO products (subdomain, name, slug, description, price, compare_at_price, stock, status, created_at)
        VALUES
          ('demo', 'Premium Wireless Headphones', 'premium-wireless-headphones',
           'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
           19999, 24999, 50, 'active', NOW()),
          ('demo', 'Smart Home Hub', 'smart-home-hub',
           'Control all your smart devices from one central hub. Compatible with Alexa and Google Home.',
           12999, NULL, 100, 'active', NOW()),
          ('demo', 'Organic Coffee Blend', 'organic-coffee-blend',
           'Premium organic coffee beans sourced from sustainable farms. 500g bag.',
           2499, 2999, 200, 'active', NOW()),
          ('demo', 'Fitness Tracker Pro', 'fitness-tracker-pro',
           'Advanced fitness tracker with heart rate monitoring, GPS, and sleep analysis.',
           14999, 17999, 75, 'active', NOW()),
          ('demo', 'Eco-Friendly Water Bottle', 'eco-friendly-water-bottle',
           'Stainless steel water bottle that keeps drinks cold for 24 hours. BPA-free.',
           3499, NULL, 300, 'active', NOW())
        ON CONFLICT (subdomain, slug) DO NOTHING
      `;
    } catch (e) {
      console.log("[demo-setup] Products table may not exist, skipping product seeding");
    }

    return NextResponse.json({
      message: "Demo subdomain created successfully",
      subdomainId,
      exists: false,
    });
  } catch (error) {
    console.error("[demo-setup] Error:", error);
    return NextResponse.json(
      { error: "Failed to set up demo" },
      { status: 500 }
    );
  }
}
