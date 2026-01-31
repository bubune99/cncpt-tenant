import { TemplateDefinition, NestedComponent, generateId, defaultPreset } from "./types";

const p = defaultPreset.styles;

export const heroTemplate: TemplateDefinition = {
  id: "hero-split",
  name: "Hero - Split",
  description: "Two-column hero with headline, subtext, CTAs, and image",
  category: "marketing",
  structure: [
    {
      type: "Section",
      props: {
        id: generateId(),
        backgroundColor: p.colors.background,
        paddingTop: "80px",
        paddingBottom: "80px",
        paddingLeft: "24px",
        paddingRight: "24px",
        maxWidth: p.spacing.containerMaxWidth,
        fullWidth: false,
      },
    },
  ],
};

// Function to create Hero template with fresh IDs
export function createHeroTemplate(): TemplateDefinition["structure"] {
  const sectionId = generateId();
  const columnsId = generateId();
  const headingId = generateId();
  const textId = generateId();
  const rowId = generateId();
  const button1Id = generateId();
  const button2Id = generateId();
  const imageId = generateId();

  return [
    {
      type: "Section",
      props: {
        id: sectionId,
        backgroundColor: "#f8fafc",
        paddingTop: "80px",
        paddingBottom: "80px",
        paddingLeft: "24px",
        paddingRight: "24px",
        maxWidth: "1200px",
        fullWidth: false,
      },
      zones: {
        content: [
          {
            type: "Columns",
            props: {
              id: columnsId,
              layout: "1-1",
              gap: "48px",
              alignItems: "center",
              stackOnMobile: true,
              reverseOnMobile: false,
            },
            zones: {
              "column-0": [
                {
                  type: "Heading",
                  props: {
                    id: headingId,
                    text: "Build something amazing today",
                    level: "h1",
                    fontSize: "48px",
                    fontWeight: "700",
                    color: "#1a1a1a",
                    textAlign: "left",
                    marginBottom: "24px",
                  },
                },
                {
                  type: "Text",
                  props: {
                    id: textId,
                    text: "Create stunning pages with our visual editor. No coding required. Drag, drop, and publish in minutes.",
                    fontSize: "18px",
                    fontWeight: "400",
                    color: "#6b7280",
                    textAlign: "left",
                    lineHeight: "1.6",
                    marginBottom: "32px",
                  },
                },
                {
                  type: "Row",
                  props: {
                    id: rowId,
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: "16px",
                    wrap: true,
                    verticalPadding: "0px",
                    horizontalPadding: "0px",
                    backgroundColor: "transparent",
                  },
                  zones: {
                    content: [
                      {
                        type: "Button",
                        props: {
                          id: button1Id,
                          text: "Get Started",
                          href: "#",
                          variant: "primary",
                          size: "lg",
                          backgroundColor: "#3b82f6",
                          textColor: "#ffffff",
                          borderRadius: "8px",
                          fullWidth: false,
                          openInNewTab: false,
                        },
                      },
                      {
                        type: "Button",
                        props: {
                          id: button2Id,
                          text: "Learn More",
                          href: "#",
                          variant: "outline",
                          size: "lg",
                          backgroundColor: "",
                          textColor: "",
                          borderRadius: "8px",
                          fullWidth: false,
                          openInNewTab: false,
                        },
                      },
                    ],
                  },
                },
              ],
              "column-1": [
                {
                  type: "Image",
                  props: {
                    id: imageId,
                    src: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800",
                    alt: "Hero image",
                    width: "100%",
                    height: "auto",
                    objectFit: "cover",
                    borderRadius: "16px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                    alignment: "center",
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ];
}

// Hero Centered variant
export function createHeroCenteredTemplate(): TemplateDefinition["structure"] {
  return [
    {
      type: "Section",
      props: {
        id: generateId(),
        backgroundColor: "#1a1a1a",
        paddingTop: "100px",
        paddingBottom: "100px",
        paddingLeft: "24px",
        paddingRight: "24px",
        maxWidth: "1200px",
        fullWidth: false,
      },
      zones: {
        content: [
          {
            type: "Container",
            props: {
              id: generateId(),
              maxWidth: "768px",
              padding: "0px",
              backgroundColor: "transparent",
              borderRadius: "0px",
              boxShadow: "none",
            },
            zones: {
              content: [
                {
                  type: "Heading",
                  props: {
                    id: generateId(),
                    text: "The future of web building",
                    level: "h1",
                    fontSize: "60px",
                    fontWeight: "700",
                    color: "#ffffff",
                    textAlign: "center",
                    marginBottom: "24px",
                  },
                },
                {
                  type: "Text",
                  props: {
                    id: generateId(),
                    text: "Build beautiful, responsive websites without writing a single line of code. Our visual editor makes it easy.",
                    fontSize: "20px",
                    fontWeight: "400",
                    color: "#9ca3af",
                    textAlign: "center",
                    lineHeight: "1.6",
                    marginBottom: "40px",
                  },
                },
                {
                  type: "Flex",
                  props: {
                    id: generateId(),
                    direction: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "16px",
                    wrap: "wrap",
                  },
                  zones: {
                    content: [
                      {
                        type: "Button",
                        props: {
                          id: generateId(),
                          text: "Start Free Trial",
                          href: "#",
                          variant: "primary",
                          size: "lg",
                          backgroundColor: "#3b82f6",
                          textColor: "#ffffff",
                          borderRadius: "8px",
                          fullWidth: false,
                          openInNewTab: false,
                        },
                      },
                      {
                        type: "Button",
                        props: {
                          id: generateId(),
                          text: "Watch Demo",
                          href: "#",
                          variant: "outline",
                          size: "lg",
                          backgroundColor: "transparent",
                          textColor: "#ffffff",
                          borderRadius: "8px",
                          fullWidth: false,
                          openInNewTab: false,
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
}

// Features Grid template
export function createFeaturesGridTemplate(): TemplateDefinition["structure"] {
  const featureItems = [
    { title: "Lightning Fast", description: "Optimized for speed and performance out of the box.", icon: "⚡" },
    { title: "Fully Responsive", description: "Looks great on every device, from mobile to desktop.", icon: "📱" },
    { title: "Easy to Use", description: "Intuitive drag-and-drop interface anyone can master.", icon: "✨" },
    { title: "Customizable", description: "Endless customization options to match your brand.", icon: "🎨" },
    { title: "SEO Optimized", description: "Built-in SEO best practices for better rankings.", icon: "🔍" },
    { title: "24/7 Support", description: "Our team is here to help whenever you need us.", icon: "💬" },
  ];

  return [
    {
      type: "Section",
      props: {
        id: generateId(),
        backgroundColor: "#ffffff",
        paddingTop: "80px",
        paddingBottom: "80px",
        paddingLeft: "24px",
        paddingRight: "24px",
        maxWidth: "1200px",
        fullWidth: false,
      },
      zones: {
        content: [
          {
            type: "Container",
            props: {
              id: generateId(),
              maxWidth: "768px",
              padding: "0px",
              backgroundColor: "transparent",
              borderRadius: "0px",
              boxShadow: "none",
            },
            zones: {
              content: [
                {
                  type: "Heading",
                  props: {
                    id: generateId(),
                    text: "Everything you need",
                    level: "h2",
                    fontSize: "40px",
                    fontWeight: "700",
                    color: "#1a1a1a",
                    textAlign: "center",
                    marginBottom: "16px",
                  },
                },
                {
                  type: "Text",
                  props: {
                    id: generateId(),
                    text: "Powerful features to help you build better websites faster.",
                    fontSize: "18px",
                    fontWeight: "400",
                    color: "#6b7280",
                    textAlign: "center",
                    lineHeight: "1.6",
                    marginBottom: "0px",
                  },
                },
              ],
            },
          },
          {
            type: "Spacer",
            props: {
              id: generateId(),
              height: "48px",
              showDivider: false,
              dividerColor: "#e5e7eb",
              dividerWidth: "100%",
            },
          },
          {
            type: "Grid",
            props: {
              id: generateId(),
              columns: 3,
              gap: "32px",
              alignItems: "stretch",
              justifyItems: "stretch",
            },
            zones: {
              ...Object.fromEntries(
                featureItems.map((feature, index) => [
                  `column-${index}`,
                  [
                    {
                      type: "Container",
                      props: {
                        id: generateId(),
                        maxWidth: "100%",
                        padding: "24px",
                        backgroundColor: "#f8fafc",
                        borderRadius: "16px",
                        boxShadow: "none",
                      },
                      zones: {
                        content: [
                          {
                            type: "Heading",
                            props: {
                              id: generateId(),
                              text: `${feature.icon} ${feature.title}`,
                              level: "h3",
                              fontSize: "20px",
                              fontWeight: "600",
                              color: "#1a1a1a",
                              textAlign: "left",
                              marginBottom: "8px",
                            },
                          },
                          {
                            type: "Text",
                            props: {
                              id: generateId(),
                              text: feature.description,
                              fontSize: "16px",
                              fontWeight: "400",
                              color: "#6b7280",
                              textAlign: "left",
                              lineHeight: "1.5",
                              marginBottom: "0px",
                            },
                          },
                        ],
                      },
                    },
                  ],
                ])
              ),
            },
          },
        ],
      },
    },
  ];
}

// Pricing Table template
export function createPricingTemplate(): TemplateDefinition["structure"] {
  const plans = [
    {
      name: "Starter",
      price: "$9",
      period: "/month",
      description: "Perfect for getting started",
      features: ["5 pages", "Basic analytics", "Email support"],
      buttonText: "Start Free",
      featured: false,
    },
    {
      name: "Pro",
      price: "$29",
      period: "/month",
      description: "Best for growing businesses",
      features: ["Unlimited pages", "Advanced analytics", "Priority support", "Custom domain"],
      buttonText: "Get Pro",
      featured: true,
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "/month",
      description: "For large organizations",
      features: ["Everything in Pro", "Dedicated support", "SLA guarantee", "Custom integrations"],
      buttonText: "Contact Sales",
      featured: false,
    },
  ];

  return [
    {
      type: "Section",
      props: {
        id: generateId(),
        backgroundColor: "#f8fafc",
        paddingTop: "80px",
        paddingBottom: "80px",
        paddingLeft: "24px",
        paddingRight: "24px",
        maxWidth: "1200px",
        fullWidth: false,
      },
      zones: {
        content: [
          {
            type: "Container",
            props: {
              id: generateId(),
              maxWidth: "768px",
              padding: "0px",
              backgroundColor: "transparent",
              borderRadius: "0px",
              boxShadow: "none",
            },
            zones: {
              content: [
                {
                  type: "Heading",
                  props: {
                    id: generateId(),
                    text: "Simple, transparent pricing",
                    level: "h2",
                    fontSize: "40px",
                    fontWeight: "700",
                    color: "#1a1a1a",
                    textAlign: "center",
                    marginBottom: "16px",
                  },
                },
                {
                  type: "Text",
                  props: {
                    id: generateId(),
                    text: "Choose the plan that's right for you. All plans include a 14-day free trial.",
                    fontSize: "18px",
                    fontWeight: "400",
                    color: "#6b7280",
                    textAlign: "center",
                    lineHeight: "1.6",
                    marginBottom: "0px",
                  },
                },
              ],
            },
          },
          {
            type: "Spacer",
            props: {
              id: generateId(),
              height: "48px",
              showDivider: false,
              dividerColor: "#e5e7eb",
              dividerWidth: "100%",
            },
          },
          {
            type: "Grid",
            props: {
              id: generateId(),
              columns: 3,
              gap: "24px",
              alignItems: "stretch",
              justifyItems: "stretch",
            },
            zones: {
              ...Object.fromEntries(
                plans.map((plan, index) => [
                  `column-${index}`,
                  [
                    {
                      type: "Container",
                      props: {
                        id: generateId(),
                        maxWidth: "100%",
                        padding: "32px",
                        backgroundColor: plan.featured ? "#1a1a1a" : "#ffffff",
                        borderRadius: "16px",
                        boxShadow: plan.featured ? "0 10px 25px rgba(0,0,0,0.2)" : "0 1px 3px rgba(0,0,0,0.1)",
                      },
                      zones: {
                        content: [
                          {
                            type: "Heading",
                            props: {
                              id: generateId(),
                              text: plan.name,
                              level: "h3",
                              fontSize: "20px",
                              fontWeight: "600",
                              color: plan.featured ? "#ffffff" : "#1a1a1a",
                              textAlign: "left",
                              marginBottom: "8px",
                            },
                          },
                          {
                            type: "Text",
                            props: {
                              id: generateId(),
                              text: plan.description,
                              fontSize: "14px",
                              fontWeight: "400",
                              color: plan.featured ? "#9ca3af" : "#6b7280",
                              textAlign: "left",
                              lineHeight: "1.5",
                              marginBottom: "16px",
                            },
                          },
                          {
                            type: "Heading",
                            props: {
                              id: generateId(),
                              text: `${plan.price}${plan.period}`,
                              level: "h4",
                              fontSize: "32px",
                              fontWeight: "700",
                              color: plan.featured ? "#ffffff" : "#1a1a1a",
                              textAlign: "left",
                              marginBottom: "24px",
                            },
                          },
                          {
                            type: "Text",
                            props: {
                              id: generateId(),
                              text: plan.features.map(f => `✓ ${f}`).join("\n"),
                              fontSize: "14px",
                              fontWeight: "400",
                              color: plan.featured ? "#d1d5db" : "#6b7280",
                              textAlign: "left",
                              lineHeight: "2",
                              marginBottom: "24px",
                            },
                          },
                          {
                            type: "Button",
                            props: {
                              id: generateId(),
                              text: plan.buttonText,
                              href: "#",
                              variant: plan.featured ? "primary" : "outline",
                              size: "md",
                              backgroundColor: plan.featured ? "#3b82f6" : "",
                              textColor: "",
                              borderRadius: "8px",
                              fullWidth: true,
                              openInNewTab: false,
                            },
                          },
                        ],
                      },
                    },
                  ],
                ])
              ),
            },
          },
        ],
      },
    },
  ];
}

// Testimonials template
export function createTestimonialsTemplate(): TemplateDefinition["structure"] {
  const testimonials = [
    {
      quote: "This tool has completely transformed how we build websites. It's incredibly intuitive and powerful.",
      author: "Sarah Johnson",
      role: "Marketing Director",
      company: "TechCorp",
    },
    {
      quote: "We've cut our development time in half. The drag-and-drop interface is a game changer.",
      author: "Michael Chen",
      role: "Product Manager",
      company: "StartupXYZ",
    },
    {
      quote: "Finally, a page builder that doesn't sacrifice quality for ease of use. Highly recommended!",
      author: "Emily Davis",
      role: "Designer",
      company: "Creative Agency",
    },
  ];

  return [
    {
      type: "Section",
      props: {
        id: generateId(),
        backgroundColor: "#1a1a1a",
        paddingTop: "80px",
        paddingBottom: "80px",
        paddingLeft: "24px",
        paddingRight: "24px",
        maxWidth: "1200px",
        fullWidth: false,
      },
      zones: {
        content: [
          {
            type: "Heading",
            props: {
              id: generateId(),
              text: "Loved by thousands",
              level: "h2",
              fontSize: "40px",
              fontWeight: "700",
              color: "#ffffff",
              textAlign: "center",
              marginBottom: "48px",
            },
          },
          {
            type: "Grid",
            props: {
              id: generateId(),
              columns: 3,
              gap: "24px",
              alignItems: "stretch",
              justifyItems: "stretch",
            },
            zones: {
              ...Object.fromEntries(
                testimonials.map((testimonial, index) => [
                  `column-${index}`,
                  [
                    {
                      type: "Container",
                      props: {
                        id: generateId(),
                        maxWidth: "100%",
                        padding: "24px",
                        backgroundColor: "#2a2a2a",
                        borderRadius: "16px",
                        boxShadow: "none",
                      },
                      zones: {
                        content: [
                          {
                            type: "Text",
                            props: {
                              id: generateId(),
                              text: `"${testimonial.quote}"`,
                              fontSize: "16px",
                              fontWeight: "400",
                              color: "#d1d5db",
                              textAlign: "left",
                              lineHeight: "1.6",
                              marginBottom: "24px",
                            },
                          },
                          {
                            type: "Heading",
                            props: {
                              id: generateId(),
                              text: testimonial.author,
                              level: "h4",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#ffffff",
                              textAlign: "left",
                              marginBottom: "4px",
                            },
                          },
                          {
                            type: "Text",
                            props: {
                              id: generateId(),
                              text: `${testimonial.role}, ${testimonial.company}`,
                              fontSize: "14px",
                              fontWeight: "400",
                              color: "#9ca3af",
                              textAlign: "left",
                              lineHeight: "1.4",
                              marginBottom: "0px",
                            },
                          },
                        ],
                      },
                    },
                  ],
                ])
              ),
            },
          },
        ],
      },
    },
  ];
}

// CTA Section template
export function createCTATemplate(): TemplateDefinition["structure"] {
  return [
    {
      type: "Section",
      props: {
        id: generateId(),
        backgroundColor: "#3b82f6",
        paddingTop: "80px",
        paddingBottom: "80px",
        paddingLeft: "24px",
        paddingRight: "24px",
        maxWidth: "1200px",
        fullWidth: false,
      },
      zones: {
        content: [
          {
            type: "Container",
            props: {
              id: generateId(),
              maxWidth: "768px",
              padding: "0px",
              backgroundColor: "transparent",
              borderRadius: "0px",
              boxShadow: "none",
            },
            zones: {
              content: [
                {
                  type: "Heading",
                  props: {
                    id: generateId(),
                    text: "Ready to get started?",
                    level: "h2",
                    fontSize: "40px",
                    fontWeight: "700",
                    color: "#ffffff",
                    textAlign: "center",
                    marginBottom: "16px",
                  },
                },
                {
                  type: "Text",
                  props: {
                    id: generateId(),
                    text: "Join thousands of creators building amazing websites. Start your free trial today.",
                    fontSize: "18px",
                    fontWeight: "400",
                    color: "rgba(255,255,255,0.8)",
                    textAlign: "center",
                    lineHeight: "1.6",
                    marginBottom: "32px",
                  },
                },
                {
                  type: "Flex",
                  props: {
                    id: generateId(),
                    direction: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "16px",
                    wrap: "wrap",
                  },
                  zones: {
                    content: [
                      {
                        type: "Button",
                        props: {
                          id: generateId(),
                          text: "Start Free Trial",
                          href: "#",
                          variant: "primary",
                          size: "lg",
                          backgroundColor: "#ffffff",
                          textColor: "#3b82f6",
                          borderRadius: "8px",
                          fullWidth: false,
                          openInNewTab: false,
                        },
                      },
                      {
                        type: "Button",
                        props: {
                          id: generateId(),
                          text: "Contact Sales",
                          href: "#",
                          variant: "outline",
                          size: "lg",
                          backgroundColor: "transparent",
                          textColor: "#ffffff",
                          borderRadius: "8px",
                          fullWidth: false,
                          openInNewTab: false,
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
}

// Export all template creators
export const marketingTemplates = {
  "hero-split": {
    id: "hero-split",
    name: "Hero - Split Layout",
    description: "Two-column hero with headline, CTAs, and image",
    category: "marketing" as const,
    create: createHeroTemplate,
  },
  "hero-centered": {
    id: "hero-centered",
    name: "Hero - Centered",
    description: "Centered hero with dark background",
    category: "marketing" as const,
    create: createHeroCenteredTemplate,
  },
  "features-grid": {
    id: "features-grid",
    name: "Features Grid",
    description: "6-feature grid with icons and descriptions",
    category: "marketing" as const,
    create: createFeaturesGridTemplate,
  },
  "pricing-table": {
    id: "pricing-table",
    name: "Pricing Table",
    description: "3-tier pricing with featured plan",
    category: "marketing" as const,
    create: createPricingTemplate,
  },
  "testimonials": {
    id: "testimonials",
    name: "Testimonials",
    description: "3-column testimonial cards",
    category: "marketing" as const,
    create: createTestimonialsTemplate,
  },
  "cta-section": {
    id: "cta-section",
    name: "CTA Section",
    description: "Call-to-action with buttons",
    category: "marketing" as const,
    create: createCTATemplate,
  },
};
