// ---------------------------------------------------------------------------
// Content-Security-Policy
// ---------------------------------------------------------------------------
// Block editor inline styles require 'unsafe-inline' in style-src.
// react-live JSX preview requires 'unsafe-eval' in script-src.
// ---------------------------------------------------------------------------
const cspDirectives = [
  // Fallback for directives not explicitly listed
  "default-src 'self'",

  // Scripts: self + unsafe-eval (react-live) + Stripe + Shippo + analytics + Vercel
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://js.goshippo.com https://www.googletagmanager.com https://www.google-analytics.com https://plausible.io https://vercel.live",

  // Styles: self + inline (required by block editor and inline style props)
  "style-src 'self' 'unsafe-inline'",

  // Images: self + storage providers + data/blob URIs + Stripe + placeholders
  "img-src 'self' data: blob: https://*.r2.dev https://*.r2.cloudflarestorage.com https://*.amazonaws.com https://placehold.co https://*.stripe.com",

  // Fonts: self + data URIs (for base64-encoded fonts in emails)
  "font-src 'self' data:",

  // XHR / fetch / WebSocket connections
  "connect-src 'self' wss: https://*.stack-auth.com https://*.stripe.com https://www.google-analytics.com https://plausible.io https://*.r2.dev https://*.r2.cloudflarestorage.com https://*.amazonaws.com https://vercel.live",

  // Iframes: Stripe checkout/3DS, Shippo, YouTube (TipTap), Vercel toolbar
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://js.goshippo.com https://www.youtube.com https://vercel.live",

  // Media (audio/video): self + storage providers
  "media-src 'self' https://*.r2.dev https://*.r2.cloudflarestorage.com https://*.amazonaws.com",

  // Object / embed: none
  "object-src 'none'",

  // Base URI: self only (prevents <base> tag hijacking)
  "base-uri 'self'",

  // Form targets
  "form-action 'self'",

  // Ancestors — equivalent to X-Frame-Options: DENY but more granular
  "frame-ancestors 'none'",

  // Upgrade insecure requests in production
  "upgrade-insecure-requests",
];

const ContentSecurityPolicy = cspDirectives.join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
    ],
  },
  experimental: {
    // Enable experimental features if needed
  },

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: ContentSecurityPolicy,
          },
          {
            // Prevent the page from being embedded in iframes (clickjacking)
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            // Prevent MIME-type sniffing
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            // HSTS — force HTTPS for 2 years, include subdomains, allow preload list
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            // Control referrer information sent with requests
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            // Disable browser features the app does not use
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            // Disable legacy XSS filter — CSP is the modern replacement
            key: "X-XSS-Protection",
            value: "0",
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
