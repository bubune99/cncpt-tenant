/**
 * Built-in Templates Plugin
 *
 * Provides pre-built seed templates that come with the CMS
 */

import { TemplatePlugin, SeedTemplate } from "../types";

/**
 * Built-in seed templates
 */
const builtinTemplates: SeedTemplate[] = [
  // Landing Pages
  {
    id: "landing-hero-simple",
    name: "Simple Hero Landing",
    description: "Clean landing page with hero section, features, and CTA",
    category: "landing",
    tags: ["hero", "features", "cta", "minimal"],
    version: "1.0.0",
    createdAt: "2024-01-01",
    isFeatured: true,
    content: {
      root: { props: {} },
      content: [
        {
          type: "Section",
          props: {
            paddingY: "24",
            background: "linear-gradient(to bottom right, #3B82F6, #8B5CF6)",
          },
          slots: {
            content: [
              {
                type: "Heading",
                props: {
                  text: "Build Something Amazing",
                  level: "1",
                  size: "5xl",
                  weight: "bold",
                  color: "#ffffff",
                  align: "center",
                },
              },
              {
                type: "Text",
                props: {
                  text: "The modern platform for creating beautiful websites without code.",
                  size: "xl",
                  color: "rgba(255,255,255,0.9)",
                  align: "center",
                },
              },
              {
                type: "Flex",
                props: { justify: "center", gap: "4" },
                slots: {
                  children: [
                    {
                      type: "Button",
                      props: { text: "Get Started", variant: "secondary", size: "lg" },
                    },
                    {
                      type: "Button",
                      props: { text: "Learn More", variant: "outline", size: "lg" },
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          type: "Section",
          props: { paddingY: "16", maxWidth: "6xl" },
          slots: {
            content: [
              {
                type: "Heading",
                props: {
                  text: "Features",
                  level: "2",
                  size: "3xl",
                  weight: "bold",
                  align: "center",
                },
              },
              {
                type: "Grid",
                props: { columns: 1, columnsMd: 3, gap: "8" },
                slots: {
                  children: [
                    {
                      type: "Card",
                      props: { padding: "6" },
                      slots: {
                        body: [
                          { type: "Heading", props: { text: "Easy to Use", level: "3", size: "xl" } },
                          { type: "Text", props: { text: "Intuitive drag-and-drop interface that anyone can use." } },
                        ],
                      },
                    },
                    {
                      type: "Card",
                      props: { padding: "6" },
                      slots: {
                        body: [
                          { type: "Heading", props: { text: "Fully Customizable", level: "3", size: "xl" } },
                          { type: "Text", props: { text: "Customize every aspect to match your brand." } },
                        ],
                      },
                    },
                    {
                      type: "Card",
                      props: { padding: "6" },
                      slots: {
                        body: [
                          { type: "Heading", props: { text: "Lightning Fast", level: "3", size: "xl" } },
                          { type: "Text", props: { text: "Optimized for performance out of the box." } },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  },

  // SaaS Templates
  {
    id: "saas-pricing",
    name: "SaaS Pricing Page",
    description: "Professional pricing page with three tiers and feature comparison",
    category: "saas",
    tags: ["pricing", "saas", "tiers", "comparison"],
    version: "1.0.0",
    createdAt: "2024-01-01",
    isFeatured: true,
    content: {
      root: { props: {} },
      content: [
        {
          type: "Section",
          props: { paddingY: "16", maxWidth: "6xl" },
          slots: {
            content: [
              {
                type: "Heading",
                props: {
                  text: "Simple, Transparent Pricing",
                  level: "1",
                  size: "4xl",
                  weight: "bold",
                  align: "center",
                },
              },
              {
                type: "Text",
                props: {
                  text: "Choose the plan that works best for you",
                  size: "lg",
                  color: "#6B7280",
                  align: "center",
                },
              },
              {
                type: "Grid",
                props: { columns: 1, columnsMd: 3, gap: "8" },
                slots: {
                  children: [
                    {
                      type: "Card",
                      props: { padding: "8", rounded: "xl" },
                      slots: {
                        body: [
                          { type: "Text", props: { text: "Starter", weight: "semibold" } },
                          { type: "Flex", props: { align: "baseline", gap: "1" }, slots: { children: [
                            { type: "Text", props: { text: "$9", size: "4xl", weight: "bold" } },
                            { type: "Text", props: { text: "/month", color: "#6B7280" } },
                          ]}},
                          { type: "List", props: { items: ["5 projects", "Basic analytics", "Email support"], type: "unordered" } },
                          { type: "Button", props: { text: "Get Started", variant: "outline", fullWidth: true } },
                        ],
                      },
                    },
                    {
                      type: "Card",
                      props: { padding: "8", rounded: "xl", variant: "elevated" },
                      slots: {
                        body: [
                          { type: "Badge", props: { text: "Popular", variant: "primary" } },
                          { type: "Text", props: { text: "Pro", weight: "semibold" } },
                          { type: "Flex", props: { align: "baseline", gap: "1" }, slots: { children: [
                            { type: "Text", props: { text: "$29", size: "4xl", weight: "bold" } },
                            { type: "Text", props: { text: "/month", color: "#6B7280" } },
                          ]}},
                          { type: "List", props: { items: ["Unlimited projects", "Advanced analytics", "Priority support", "Custom domain"], type: "unordered" } },
                          { type: "Button", props: { text: "Get Started", variant: "primary", fullWidth: true } },
                        ],
                      },
                    },
                    {
                      type: "Card",
                      props: { padding: "8", rounded: "xl" },
                      slots: {
                        body: [
                          { type: "Text", props: { text: "Enterprise", weight: "semibold" } },
                          { type: "Flex", props: { align: "baseline", gap: "1" }, slots: { children: [
                            { type: "Text", props: { text: "$99", size: "4xl", weight: "bold" } },
                            { type: "Text", props: { text: "/month", color: "#6B7280" } },
                          ]}},
                          { type: "List", props: { items: ["Everything in Pro", "SSO/SAML", "Dedicated support", "SLA guarantee"], type: "unordered" } },
                          { type: "Button", props: { text: "Contact Sales", variant: "outline", fullWidth: true } },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  },

  // Coming Soon
  {
    id: "coming-soon-simple",
    name: "Coming Soon Page",
    description: "Simple coming soon page with email signup",
    category: "coming-soon",
    tags: ["coming-soon", "launch", "email", "waitlist"],
    version: "1.0.0",
    createdAt: "2024-01-01",
    content: {
      root: { props: {} },
      content: [
        {
          type: "Section",
          props: {
            paddingY: "32",
            background: "#111827",
          },
          slots: {
            content: [
              {
                type: "Heading",
                props: {
                  text: "Something Amazing is Coming",
                  level: "1",
                  size: "5xl",
                  weight: "bold",
                  color: "#ffffff",
                  align: "center",
                },
              },
              {
                type: "Text",
                props: {
                  text: "We're working hard to bring you something special. Join the waitlist to be the first to know.",
                  size: "lg",
                  color: "#9CA3AF",
                  align: "center",
                },
              },
              {
                type: "Flex",
                props: { justify: "center", gap: "2" },
                slots: {
                  children: [
                    {
                      type: "Input",
                      props: { placeholder: "Enter your email", type: "email" },
                    },
                    {
                      type: "Button",
                      props: { text: "Notify Me", variant: "primary" },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  },

  // Error Pages
  {
    id: "error-404",
    name: "404 Error Page",
    description: "Clean 404 not found error page",
    category: "error",
    tags: ["error", "404", "not-found"],
    version: "1.0.0",
    createdAt: "2024-01-01",
    content: {
      root: { props: {} },
      content: [
        {
          type: "Section",
          props: { paddingY: "32" },
          slots: {
            content: [
              {
                type: "Text",
                props: {
                  text: "404",
                  size: "5xl",
                  weight: "bold",
                  color: "#E5E7EB",
                  align: "center",
                },
              },
              {
                type: "Heading",
                props: {
                  text: "Page Not Found",
                  level: "1",
                  size: "3xl",
                  weight: "bold",
                  align: "center",
                },
              },
              {
                type: "Text",
                props: {
                  text: "Sorry, we couldn't find the page you're looking for.",
                  color: "#6B7280",
                  align: "center",
                },
              },
              {
                type: "Flex",
                props: { justify: "center", gap: "4" },
                slots: {
                  children: [
                    { type: "Button", props: { text: "Go Home", variant: "primary", href: "/" } },
                    { type: "Button", props: { text: "Contact Support", variant: "outline" } },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  },

  // About Page
  {
    id: "about-company",
    name: "Company About Page",
    description: "Professional about page with team section and values",
    category: "about",
    tags: ["about", "company", "team", "values"],
    version: "1.0.0",
    createdAt: "2024-01-01",
    content: {
      root: { props: {} },
      content: [
        {
          type: "Section",
          props: { paddingY: "16", maxWidth: "4xl" },
          slots: {
            content: [
              {
                type: "Heading",
                props: {
                  text: "About Us",
                  level: "1",
                  size: "4xl",
                  weight: "bold",
                  align: "center",
                },
              },
              {
                type: "Text",
                props: {
                  text: "We're on a mission to make building websites accessible to everyone. Our team of passionate builders is dedicated to creating tools that empower creators.",
                  size: "lg",
                  align: "center",
                  leading: "relaxed",
                },
              },
            ],
          },
        },
        {
          type: "Section",
          props: { paddingY: "16", background: "#F9FAFB", maxWidth: "6xl" },
          slots: {
            content: [
              {
                type: "Heading",
                props: { text: "Our Values", level: "2", size: "2xl", weight: "bold", align: "center" },
              },
              {
                type: "Grid",
                props: { columns: 1, columnsMd: 3, gap: "8" },
                slots: {
                  children: [
                    {
                      type: "Container",
                      props: { padding: "6" },
                      slots: {
                        content: [
                          { type: "Heading", props: { text: "Simplicity", level: "3", size: "lg", weight: "semibold" } },
                          { type: "Text", props: { text: "We believe powerful tools should be simple to use.", color: "#6B7280" } },
                        ],
                      },
                    },
                    {
                      type: "Container",
                      props: { padding: "6" },
                      slots: {
                        content: [
                          { type: "Heading", props: { text: "Quality", level: "3", size: "lg", weight: "semibold" } },
                          { type: "Text", props: { text: "We're committed to excellence in everything we build.", color: "#6B7280" } },
                        ],
                      },
                    },
                    {
                      type: "Container",
                      props: { padding: "6" },
                      slots: {
                        content: [
                          { type: "Heading", props: { text: "Community", level: "3", size: "lg", weight: "semibold" } },
                          { type: "Text", props: { text: "We grow together with our users and listen to feedback.", color: "#6B7280" } },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  },

  // Contact Page
  {
    id: "contact-simple",
    name: "Simple Contact Page",
    description: "Contact page with form and contact info",
    category: "contact",
    tags: ["contact", "form", "support"],
    version: "1.0.0",
    createdAt: "2024-01-01",
    content: {
      root: { props: {} },
      content: [
        {
          type: "Section",
          props: { paddingY: "16", maxWidth: "4xl" },
          slots: {
            content: [
              {
                type: "Heading",
                props: {
                  text: "Get in Touch",
                  level: "1",
                  size: "4xl",
                  weight: "bold",
                  align: "center",
                },
              },
              {
                type: "Text",
                props: {
                  text: "Have a question or want to work together? We'd love to hear from you.",
                  align: "center",
                  color: "#6B7280",
                },
              },
              {
                type: "Grid",
                props: { columns: 1, columnsMd: 2, gap: "12" },
                slots: {
                  children: [
                    {
                      type: "Container",
                      props: {},
                      slots: {
                        content: [
                          { type: "Input", props: { label: "Name", placeholder: "Your name" } },
                          { type: "Spacer", props: { size: "4" } },
                          { type: "Input", props: { label: "Email", placeholder: "you@example.com", type: "email" } },
                          { type: "Spacer", props: { size: "4" } },
                          { type: "Textarea", props: { label: "Message", placeholder: "How can we help?", rows: 5 } },
                          { type: "Spacer", props: { size: "4" } },
                          { type: "Button", props: { text: "Send Message", variant: "primary", fullWidth: true } },
                        ],
                      },
                    },
                    {
                      type: "Container",
                      props: { padding: "6", background: "#F9FAFB", rounded: "lg" },
                      slots: {
                        content: [
                          { type: "Heading", props: { text: "Contact Info", level: "3", size: "lg", weight: "semibold" } },
                          { type: "Spacer", props: { size: "4" } },
                          { type: "Text", props: { text: "Email", weight: "medium" } },
                          { type: "Text", props: { text: "hello@example.com", color: "#6B7280" } },
                          { type: "Spacer", props: { size: "4" } },
                          { type: "Text", props: { text: "Phone", weight: "medium" } },
                          { type: "Text", props: { text: "+1 (555) 123-4567", color: "#6B7280" } },
                          { type: "Spacer", props: { size: "4" } },
                          { type: "Text", props: { text: "Address", weight: "medium" } },
                          { type: "Text", props: { text: "123 Main St, San Francisco, CA 94102", color: "#6B7280" } },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  },
];

/**
 * Built-in templates plugin
 */
export const builtinTemplatesPlugin: TemplatePlugin = {
  id: "builtin",
  name: "Built-in Templates",
  description: "Pre-built templates that come with the CMS",

  async getTemplates(): Promise<SeedTemplate[]> {
    return builtinTemplates;
  },

  async getTemplate(id: string): Promise<SeedTemplate | null> {
    return builtinTemplates.find((t) => t.id === id) || null;
  },

  async hasTemplate(id: string): Promise<boolean> {
    return builtinTemplates.some((t) => t.id === id);
  },
};

export default builtinTemplatesPlugin;
