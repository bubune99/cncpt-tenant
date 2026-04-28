import type { MetadataRoute } from "next"

const SITE_URL = "https://cncptweb.com"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/dashboard/",
          "/admin",
          "/admin/",
          "/api/",
          "/handler/",
          "/auth-error",
          "/login",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
