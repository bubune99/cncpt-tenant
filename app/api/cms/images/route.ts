/**
 * Images API - List and manage images from R2
 */

import { NextRequest, NextResponse } from "next/server";
import { listImages, getCategories, R2_CONFIG } from "@/lib/cms/r2";

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category") || undefined;
  const search = searchParams.get("search") || undefined;

  // Check if R2 is configured
  if (!R2_CONFIG.isConfigured) {
    // Return placeholder images if R2 is not configured
    return NextResponse.json({
      configured: false,
      message: "R2 is not configured. Using placeholder images.",
      categories: ["heroes", "features", "team", "products", "backgrounds"],
      images: getPlaceholderImages(category, search),
    });
  }

  try {
    // Get categories
    const categories = await getCategories();

    // Get images (optionally filtered by category)
    let images = await listImages(category);

    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase();
      images = images.filter(
        (img) =>
          img.name.toLowerCase().includes(searchLower) ||
          img.category.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      configured: true,
      categories,
      images,
      count: images.length,
    });
  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}

/**
 * Generate placeholder images when R2 is not configured
 * Uses picsum.photos for random images with consistent seeds
 */
function getPlaceholderImages(category?: string, search?: string) {
  const placeholders = [
    // Heroes
    { key: "heroes/hero-1.jpg", name: "Hero Background 1", category: "heroes", tags: ["hero", "background", "gradient", "abstract"] },
    { key: "heroes/hero-2.jpg", name: "Hero Background 2", category: "heroes", tags: ["hero", "background", "nature", "landscape"] },
    { key: "heroes/hero-3.jpg", name: "Hero Background 3", category: "heroes", tags: ["hero", "background", "city", "urban"] },
    { key: "heroes/hero-team.jpg", name: "Team Hero", category: "heroes", tags: ["hero", "team", "people", "office"] },
    // Features
    { key: "features/feature-1.jpg", name: "Feature Icon 1", category: "features", tags: ["feature", "icon", "technology"] },
    { key: "features/feature-2.jpg", name: "Feature Icon 2", category: "features", tags: ["feature", "icon", "business"] },
    { key: "features/feature-3.jpg", name: "Feature Icon 3", category: "features", tags: ["feature", "icon", "creative"] },
    // Team
    { key: "team/person-1.jpg", name: "Team Member 1", category: "team", tags: ["team", "person", "portrait", "professional"] },
    { key: "team/person-2.jpg", name: "Team Member 2", category: "team", tags: ["team", "person", "portrait", "professional"] },
    { key: "team/person-3.jpg", name: "Team Member 3", category: "team", tags: ["team", "person", "portrait", "professional"] },
    { key: "team/person-4.jpg", name: "Team Member 4", category: "team", tags: ["team", "person", "portrait", "professional"] },
    // Products
    { key: "products/product-1.jpg", name: "Product Shot 1", category: "products", tags: ["product", "ecommerce", "retail"] },
    { key: "products/product-2.jpg", name: "Product Shot 2", category: "products", tags: ["product", "ecommerce", "technology"] },
    { key: "products/product-3.jpg", name: "Product Shot 3", category: "products", tags: ["product", "ecommerce", "lifestyle"] },
    // Backgrounds
    { key: "backgrounds/texture-1.jpg", name: "Texture Background", category: "backgrounds", tags: ["background", "texture", "pattern"] },
    { key: "backgrounds/gradient-1.jpg", name: "Gradient Background", category: "backgrounds", tags: ["background", "gradient", "abstract"] },
    { key: "backgrounds/nature-1.jpg", name: "Nature Background", category: "backgrounds", tags: ["background", "nature", "outdoor"] },
  ];

  // Generate URLs using picsum with consistent seeds
  const images = placeholders.map((p, index) => ({
    ...p,
    url: `https://picsum.photos/seed/${p.key.replace(/[^a-z0-9]/gi, "")}/800/600`,
    size: 150000 + index * 10000,
  }));

  // Filter by category
  let filtered = images;
  if (category) {
    filtered = filtered.filter((img) => img.category === category);
  }

  // Filter by search
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(
      (img) =>
        img.name.toLowerCase().includes(searchLower) ||
        img.category.toLowerCase().includes(searchLower) ||
        img.tags.some((tag) => tag.includes(searchLower))
    );
  }

  return filtered;
}
