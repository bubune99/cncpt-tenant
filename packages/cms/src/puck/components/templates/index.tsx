"use client";

import React from "react";
import { ComponentConfig } from "@puckeditor/core";

// Type for slot content - at runtime it's a render function, in defaultProps it's an array of component data
interface SlotComponentData {
  type: string;
  props: Record<string, unknown>;
}
type SlotContent = React.FC | SlotComponentData[];

// ============================================
// HERO SPLIT TEMPLATE
// Two-column hero with content on left, image on right
// ============================================
interface HeroSplitTemplateProps {
  backgroundColor: string;
  paddingTop: string;
  paddingBottom: string;
  content?: SlotContent;
  puck?: { isEditing?: boolean };
}

const HeroSplitTemplate = ({
  backgroundColor,
  paddingTop,
  paddingBottom,
  content: Content,
}: HeroSplitTemplateProps) => {
  return (
    <section
      style={{
        backgroundColor,
        paddingTop,
        paddingBottom,
        paddingLeft: "24px",
        paddingRight: "24px",
        width: "100%",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: "48px",
          flexWrap: "wrap",
        }}
      >
        {typeof Content === "function" && <Content />}
      </div>
    </section>
  );
};

export const HeroSplitTemplateConfig: ComponentConfig<HeroSplitTemplateProps> = {
  label: "Hero - Split",
  defaultProps: {
    backgroundColor: "#f8fafc",
    paddingTop: "80px",
    paddingBottom: "80px",
    content: [
      {
        type: "Flex",
        props: {
          direction: "row",
          gap: "48px",
          alignItems: "center",
          wrap: "wrap",
          content: [
            {
              type: "Box",
              props: {
                padding: "0px",
                content: [
                  {
                    type: "Heading",
                    props: {
                      text: "Build something amazing today",
                      level: "h1",
                      align: "left",
                      color: "#0f172a",
                    },
                  },
                  {
                    type: "Text",
                    props: {
                      content: "Create beautiful, responsive websites with our intuitive drag-and-drop editor. No coding required.",
                      size: "large",
                      align: "left",
                      color: "#475569",
                    },
                  },
                  {
                    type: "Flex",
                    props: {
                      direction: "row",
                      gap: "16px",
                      content: [
                        {
                          type: "Button",
                          props: {
                            label: "Get Started",
                            variant: "primary",
                            size: "large",
                          },
                        },
                        {
                          type: "Button",
                          props: {
                            label: "Learn More",
                            variant: "outline",
                            size: "large",
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
            {
              type: "Image",
              props: {
                src: "https://placehold.co/600x400/e2e8f0/64748b?text=Hero+Image",
                alt: "Hero image",
                aspectRatio: "16:9",
                borderRadius: "12px",
              },
            },
          ],
        },
      },
    ],
  },
  fields: {
    content: {
      type: "slot",
    },
    backgroundColor: {
      type: "text",
      label: "Background Color",
    },
    paddingTop: {
      type: "select",
      label: "Padding Top",
      options: [
        { label: "Small (40px)", value: "40px" },
        { label: "Medium (60px)", value: "60px" },
        { label: "Large (80px)", value: "80px" },
        { label: "XL (100px)", value: "100px" },
      ],
    },
    paddingBottom: {
      type: "select",
      label: "Padding Bottom",
      options: [
        { label: "Small (40px)", value: "40px" },
        { label: "Medium (60px)", value: "60px" },
        { label: "Large (80px)", value: "80px" },
        { label: "XL (100px)", value: "100px" },
      ],
    },
  },
  render: HeroSplitTemplate,
};

// ============================================
// HERO CENTERED TEMPLATE
// Centered hero with heading, text, and CTA buttons
// ============================================
interface HeroCenteredTemplateProps {
  backgroundColor: string;
  paddingTop: string;
  paddingBottom: string;
  content?: SlotContent;
  puck?: { isEditing?: boolean };
}

const HeroCenteredTemplate = ({
  backgroundColor,
  paddingTop,
  paddingBottom,
  content: Content,
}: HeroCenteredTemplateProps) => {
  return (
    <section
      style={{
        backgroundColor,
        paddingTop,
        paddingBottom,
        paddingLeft: "24px",
        paddingRight: "24px",
        width: "100%",
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        {typeof Content === "function" && <Content />}
      </div>
    </section>
  );
};

export const HeroCenteredTemplateConfig: ComponentConfig<HeroCenteredTemplateProps> = {
  label: "Hero - Centered",
  defaultProps: {
    backgroundColor: "#0f172a",
    paddingTop: "100px",
    paddingBottom: "100px",
    content: [
      {
        type: "Heading",
        props: {
          text: "Welcome to the Future",
          level: "h1",
          align: "center",
          color: "#ffffff",
        },
      },
      {
        type: "Text",
        props: {
          content: "Discover a new way to build websites. Fast, intuitive, and beautifully designed for everyone.",
          size: "large",
          align: "center",
          color: "#94a3b8",
        },
      },
      {
        type: "Spacer",
        props: {
          height: "24px",
        },
      },
      {
        type: "Flex",
        props: {
          direction: "row",
          gap: "16px",
          justifyContent: "center",
          content: [
            {
              type: "Button",
              props: {
                label: "Start Free Trial",
                variant: "primary",
                size: "large",
              },
            },
            {
              type: "Button",
              props: {
                label: "Watch Demo",
                variant: "outline",
                size: "large",
              },
            },
          ],
        },
      },
    ],
  },
  fields: {
    content: {
      type: "slot",
    },
    backgroundColor: {
      type: "text",
      label: "Background Color",
    },
    paddingTop: {
      type: "select",
      label: "Padding Top",
      options: [
        { label: "Medium (60px)", value: "60px" },
        { label: "Large (80px)", value: "80px" },
        { label: "XL (100px)", value: "100px" },
        { label: "2XL (120px)", value: "120px" },
      ],
    },
    paddingBottom: {
      type: "select",
      label: "Padding Bottom",
      options: [
        { label: "Medium (60px)", value: "60px" },
        { label: "Large (80px)", value: "80px" },
        { label: "XL (100px)", value: "100px" },
        { label: "2XL (120px)", value: "120px" },
      ],
    },
  },
  render: HeroCenteredTemplate,
};

// ============================================
// FEATURES GRID TEMPLATE
// Grid of feature cards with icons
// ============================================
interface FeaturesGridTemplateProps {
  backgroundColor: string;
  paddingTop: string;
  paddingBottom: string;
  content?: SlotContent;
  puck?: { isEditing?: boolean };
}

const FeaturesGridTemplate = ({
  backgroundColor,
  paddingTop,
  paddingBottom,
  content: Content,
}: FeaturesGridTemplateProps) => {
  return (
    <section
      style={{
        backgroundColor,
        paddingTop,
        paddingBottom,
        paddingLeft: "24px",
        paddingRight: "24px",
        width: "100%",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {typeof Content === "function" && <Content />}
      </div>
    </section>
  );
};

export const FeaturesGridTemplateConfig: ComponentConfig<FeaturesGridTemplateProps> = {
  label: "Features Grid",
  defaultProps: {
    backgroundColor: "#ffffff",
    paddingTop: "80px",
    paddingBottom: "80px",
    content: [
      {
        type: "Heading",
        props: {
          text: "Everything you need",
          level: "h2",
          align: "center",
          color: "#0f172a",
        },
      },
      {
        type: "Text",
        props: {
          content: "Powerful features to help you build better websites faster.",
          size: "large",
          align: "center",
          color: "#64748b",
        },
      },
      {
        type: "Spacer",
        props: {
          height: "48px",
        },
      },
      {
        type: "Grid",
        props: {
          columns: 3,
          gap: "32px",
          content: [
            {
              type: "Card",
              props: {
                title: "Drag & Drop",
                subtitle: "Build pages visually with our intuitive editor",
                backgroundColor: "#f8fafc",
                showHeader: true,
                shadow: "sm",
              },
            },
            {
              type: "Card",
              props: {
                title: "Responsive Design",
                subtitle: "Your sites look great on any device",
                backgroundColor: "#f8fafc",
                showHeader: true,
                shadow: "sm",
              },
            },
            {
              type: "Card",
              props: {
                title: "Fast Performance",
                subtitle: "Optimized for speed and SEO",
                backgroundColor: "#f8fafc",
                showHeader: true,
                shadow: "sm",
              },
            },
          ],
        },
      },
    ],
  },
  fields: {
    content: {
      type: "slot",
    },
    backgroundColor: {
      type: "text",
      label: "Background Color",
    },
    paddingTop: {
      type: "select",
      label: "Padding Top",
      options: [
        { label: "Medium (60px)", value: "60px" },
        { label: "Large (80px)", value: "80px" },
        { label: "XL (100px)", value: "100px" },
      ],
    },
    paddingBottom: {
      type: "select",
      label: "Padding Bottom",
      options: [
        { label: "Medium (60px)", value: "60px" },
        { label: "Large (80px)", value: "80px" },
        { label: "XL (100px)", value: "100px" },
      ],
    },
  },
  render: FeaturesGridTemplate,
};

// ============================================
// PRICING TABLE TEMPLATE
// Pricing cards in a row
// ============================================
interface PricingTableTemplateProps {
  backgroundColor: string;
  paddingTop: string;
  paddingBottom: string;
  content?: SlotContent;
  puck?: { isEditing?: boolean };
}

const PricingTableTemplate = ({
  backgroundColor,
  paddingTop,
  paddingBottom,
  content: Content,
}: PricingTableTemplateProps) => {
  return (
    <section
      style={{
        backgroundColor,
        paddingTop,
        paddingBottom,
        paddingLeft: "24px",
        paddingRight: "24px",
        width: "100%",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {typeof Content === "function" && <Content />}
      </div>
    </section>
  );
};

export const PricingTableTemplateConfig: ComponentConfig<PricingTableTemplateProps> = {
  label: "Pricing Table",
  defaultProps: {
    backgroundColor: "#f8fafc",
    paddingTop: "80px",
    paddingBottom: "80px",
    content: [
      {
        type: "Heading",
        props: {
          text: "Simple, transparent pricing",
          level: "h2",
          align: "center",
          color: "#0f172a",
        },
      },
      {
        type: "Text",
        props: {
          content: "Choose the plan that works best for you and your team.",
          size: "large",
          align: "center",
          color: "#64748b",
        },
      },
      {
        type: "Spacer",
        props: {
          height: "48px",
        },
      },
      {
        type: "Grid",
        props: {
          columns: 3,
          gap: "24px",
          content: [
            {
              type: "Card",
              props: {
                title: "Starter",
                subtitle: "$9/month",
                backgroundColor: "#ffffff",
                showHeader: true,
                shadow: "md",
                content: [
                  {
                    type: "Text",
                    props: {
                      content: "Perfect for individuals and small projects.",
                      size: "small",
                      color: "#64748b",
                    },
                  },
                  {
                    type: "Button",
                    props: {
                      label: "Get Started",
                      variant: "outline",
                      fullWidth: true,
                    },
                  },
                ],
              },
            },
            {
              type: "Card",
              props: {
                title: "Professional",
                subtitle: "$29/month",
                backgroundColor: "#0f172a",
                textColor: "#ffffff",
                showHeader: true,
                shadow: "lg",
                content: [
                  {
                    type: "Text",
                    props: {
                      content: "Best for growing businesses and teams.",
                      size: "small",
                      color: "#94a3b8",
                    },
                  },
                  {
                    type: "Button",
                    props: {
                      label: "Get Started",
                      variant: "primary",
                      fullWidth: true,
                    },
                  },
                ],
              },
            },
            {
              type: "Card",
              props: {
                title: "Enterprise",
                subtitle: "$99/month",
                backgroundColor: "#ffffff",
                showHeader: true,
                shadow: "md",
                content: [
                  {
                    type: "Text",
                    props: {
                      content: "For large organizations with custom needs.",
                      size: "small",
                      color: "#64748b",
                    },
                  },
                  {
                    type: "Button",
                    props: {
                      label: "Contact Sales",
                      variant: "outline",
                      fullWidth: true,
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
  fields: {
    content: {
      type: "slot",
    },
    backgroundColor: {
      type: "text",
      label: "Background Color",
    },
    paddingTop: {
      type: "select",
      label: "Padding Top",
      options: [
        { label: "Medium (60px)", value: "60px" },
        { label: "Large (80px)", value: "80px" },
        { label: "XL (100px)", value: "100px" },
      ],
    },
    paddingBottom: {
      type: "select",
      label: "Padding Bottom",
      options: [
        { label: "Medium (60px)", value: "60px" },
        { label: "Large (80px)", value: "80px" },
        { label: "XL (100px)", value: "100px" },
      ],
    },
  },
  render: PricingTableTemplate,
};

// ============================================
// TESTIMONIALS TEMPLATE
// Customer testimonial cards
// ============================================
interface TestimonialsTemplateProps {
  backgroundColor: string;
  paddingTop: string;
  paddingBottom: string;
  content?: SlotContent;
  puck?: { isEditing?: boolean };
}

const TestimonialsTemplate = ({
  backgroundColor,
  paddingTop,
  paddingBottom,
  content: Content,
}: TestimonialsTemplateProps) => {
  return (
    <section
      style={{
        backgroundColor,
        paddingTop,
        paddingBottom,
        paddingLeft: "24px",
        paddingRight: "24px",
        width: "100%",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {typeof Content === "function" && <Content />}
      </div>
    </section>
  );
};

export const TestimonialsTemplateConfig: ComponentConfig<TestimonialsTemplateProps> = {
  label: "Testimonials",
  defaultProps: {
    backgroundColor: "#ffffff",
    paddingTop: "80px",
    paddingBottom: "80px",
    content: [
      {
        type: "Heading",
        props: {
          text: "What our customers say",
          level: "h2",
          align: "center",
          color: "#0f172a",
        },
      },
      {
        type: "Text",
        props: {
          content: "Trusted by thousands of businesses worldwide.",
          size: "large",
          align: "center",
          color: "#64748b",
        },
      },
      {
        type: "Spacer",
        props: {
          height: "48px",
        },
      },
      {
        type: "Grid",
        props: {
          columns: 3,
          gap: "24px",
          content: [
            {
              type: "Card",
              props: {
                backgroundColor: "#f8fafc",
                showHeader: false,
                shadow: "sm",
                padding: "24px",
                content: [
                  {
                    type: "Text",
                    props: {
                      content: '"This tool has completely transformed how we build websites. Highly recommended!"',
                      color: "#334155",
                    },
                  },
                  {
                    type: "Spacer",
                    props: { height: "16px" },
                  },
                  {
                    type: "Text",
                    props: {
                      content: "Sarah Johnson, CEO at TechCorp",
                      size: "small",
                      color: "#64748b",
                    },
                  },
                ],
              },
            },
            {
              type: "Card",
              props: {
                backgroundColor: "#f8fafc",
                showHeader: false,
                shadow: "sm",
                padding: "24px",
                content: [
                  {
                    type: "Text",
                    props: {
                      content: '"The best page builder I\'ve ever used. Simple, powerful, and beautiful results."',
                      color: "#334155",
                    },
                  },
                  {
                    type: "Spacer",
                    props: { height: "16px" },
                  },
                  {
                    type: "Text",
                    props: {
                      content: "Mike Chen, Designer at CreativeStudio",
                      size: "small",
                      color: "#64748b",
                    },
                  },
                ],
              },
            },
            {
              type: "Card",
              props: {
                backgroundColor: "#f8fafc",
                showHeader: false,
                shadow: "sm",
                padding: "24px",
                content: [
                  {
                    type: "Text",
                    props: {
                      content: '"We shipped our marketing site in half the time. Amazing product!"',
                      color: "#334155",
                    },
                  },
                  {
                    type: "Spacer",
                    props: { height: "16px" },
                  },
                  {
                    type: "Text",
                    props: {
                      content: "Emily Davis, Marketing at StartupXYZ",
                      size: "small",
                      color: "#64748b",
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
  fields: {
    content: {
      type: "slot",
    },
    backgroundColor: {
      type: "text",
      label: "Background Color",
    },
    paddingTop: {
      type: "select",
      label: "Padding Top",
      options: [
        { label: "Medium (60px)", value: "60px" },
        { label: "Large (80px)", value: "80px" },
        { label: "XL (100px)", value: "100px" },
      ],
    },
    paddingBottom: {
      type: "select",
      label: "Padding Bottom",
      options: [
        { label: "Medium (60px)", value: "60px" },
        { label: "Large (80px)", value: "80px" },
        { label: "XL (100px)", value: "100px" },
      ],
    },
  },
  render: TestimonialsTemplate,
};

// ============================================
// CTA SECTION TEMPLATE
// Call-to-action section with centered content
// ============================================
interface CtaSectionTemplateProps {
  backgroundColor: string;
  paddingTop: string;
  paddingBottom: string;
  content?: SlotContent;
  puck?: { isEditing?: boolean };
}

const CtaSectionTemplate = ({
  backgroundColor,
  paddingTop,
  paddingBottom,
  content: Content,
}: CtaSectionTemplateProps) => {
  return (
    <section
      style={{
        backgroundColor,
        paddingTop,
        paddingBottom,
        paddingLeft: "24px",
        paddingRight: "24px",
        width: "100%",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {typeof Content === "function" && <Content />}
      </div>
    </section>
  );
};

export const CtaSectionTemplateConfig: ComponentConfig<CtaSectionTemplateProps> = {
  label: "CTA Section",
  defaultProps: {
    backgroundColor: "#3b82f6",
    paddingTop: "80px",
    paddingBottom: "80px",
    content: [
      {
        type: "Heading",
        props: {
          text: "Ready to get started?",
          level: "h2",
          align: "center",
          color: "#ffffff",
        },
      },
      {
        type: "Text",
        props: {
          content: "Join thousands of satisfied customers and start building your dream website today.",
          size: "large",
          align: "center",
          color: "#dbeafe",
        },
      },
      {
        type: "Spacer",
        props: {
          height: "32px",
        },
      },
      {
        type: "Flex",
        props: {
          direction: "row",
          gap: "16px",
          justifyContent: "center",
          content: [
            {
              type: "Button",
              props: {
                label: "Start Free Trial",
                variant: "secondary",
                size: "large",
              },
            },
            {
              type: "Button",
              props: {
                label: "Contact Sales",
                variant: "outline",
                size: "large",
              },
            },
          ],
        },
      },
    ],
  },
  fields: {
    content: {
      type: "slot",
    },
    backgroundColor: {
      type: "text",
      label: "Background Color",
    },
    paddingTop: {
      type: "select",
      label: "Padding Top",
      options: [
        { label: "Medium (60px)", value: "60px" },
        { label: "Large (80px)", value: "80px" },
        { label: "XL (100px)", value: "100px" },
      ],
    },
    paddingBottom: {
      type: "select",
      label: "Padding Bottom",
      options: [
        { label: "Medium (60px)", value: "60px" },
        { label: "Large (80px)", value: "80px" },
        { label: "XL (100px)", value: "100px" },
      ],
    },
  },
  render: CtaSectionTemplate,
};

// ============================================
// HEADER TEMPLATE
// Navigation header with logo and menu items
// ============================================
interface HeaderTemplateProps {
  backgroundColor: string;
  sticky: boolean;
  content?: SlotContent;
  puck?: { isEditing?: boolean };
}

const HeaderTemplate = ({
  backgroundColor,
  sticky,
  content: Content,
}: HeaderTemplateProps) => {
  return (
    <header
      style={{
        backgroundColor,
        padding: "16px 24px",
        width: "100%",
        position: sticky ? "sticky" : "relative",
        top: sticky ? 0 : undefined,
        zIndex: sticky ? 100 : undefined,
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {typeof Content === "function" && <Content />}
      </div>
    </header>
  );
};

export const HeaderTemplateConfig: ComponentConfig<HeaderTemplateProps> = {
  label: "Header (Quick Start)",
  defaultProps: {
    backgroundColor: "#ffffff",
    sticky: true,
    content: [
      {
        type: "Flex",
        props: {
          direction: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "32px",
          content: [
            {
              type: "Flex",
              props: {
                direction: "row",
                alignItems: "center",
                gap: "32px",
                content: [
                  {
                    type: "Heading",
                    props: {
                      text: "Logo",
                      level: "h3",
                      color: "#0f172a",
                    },
                  },
                  {
                    type: "Flex",
                    props: {
                      direction: "row",
                      gap: "24px",
                      content: [
                        {
                          type: "Text",
                          props: {
                            content: "Home",
                            color: "#475569",
                          },
                        },
                        {
                          type: "Text",
                          props: {
                            content: "Features",
                            color: "#475569",
                          },
                        },
                        {
                          type: "Text",
                          props: {
                            content: "Pricing",
                            color: "#475569",
                          },
                        },
                        {
                          type: "Text",
                          props: {
                            content: "About",
                            color: "#475569",
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
            {
              type: "Flex",
              props: {
                direction: "row",
                gap: "12px",
                content: [
                  {
                    type: "Button",
                    props: {
                      label: "Sign In",
                      variant: "outline",
                      size: "small",
                    },
                  },
                  {
                    type: "Button",
                    props: {
                      label: "Get Started",
                      variant: "primary",
                      size: "small",
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
  fields: {
    content: {
      type: "slot",
    },
    backgroundColor: {
      type: "text",
      label: "Background Color",
    },
    sticky: {
      type: "radio",
      label: "Sticky Header",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
  },
  render: HeaderTemplate,
};

// ============================================
// FOOTER TEMPLATE
// Website footer with links and copyright
// ============================================
interface FooterTemplateProps {
  backgroundColor: string;
  paddingTop: string;
  paddingBottom: string;
  content?: SlotContent;
  puck?: { isEditing?: boolean };
}

const FooterTemplate = ({
  backgroundColor,
  paddingTop,
  paddingBottom,
  content: Content,
}: FooterTemplateProps) => {
  return (
    <footer
      style={{
        backgroundColor,
        paddingTop,
        paddingBottom,
        paddingLeft: "24px",
        paddingRight: "24px",
        width: "100%",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {typeof Content === "function" && <Content />}
      </div>
    </footer>
  );
};

export const FooterTemplateConfig: ComponentConfig<FooterTemplateProps> = {
  label: "Footer (Quick Start)",
  defaultProps: {
    backgroundColor: "#0f172a",
    paddingTop: "60px",
    paddingBottom: "40px",
    content: [
      {
        type: "Grid",
        props: {
          columns: 4,
          gap: "40px",
          content: [
            {
              type: "Box",
              props: {
                padding: "0px",
                content: [
                  {
                    type: "Heading",
                    props: {
                      text: "Company",
                      level: "h4",
                      color: "#ffffff",
                    },
                  },
                  {
                    type: "Spacer",
                    props: { height: "16px" },
                  },
                  {
                    type: "Text",
                    props: {
                      content: "Building amazing products for our customers.",
                      color: "#94a3b8",
                      size: "small",
                    },
                  },
                ],
              },
            },
            {
              type: "Box",
              props: {
                padding: "0px",
                content: [
                  {
                    type: "Heading",
                    props: {
                      text: "Product",
                      level: "h5",
                      color: "#ffffff",
                    },
                  },
                  {
                    type: "Spacer",
                    props: { height: "12px" },
                  },
                  {
                    type: "Text",
                    props: {
                      content: "Features",
                      color: "#94a3b8",
                      size: "small",
                    },
                  },
                  {
                    type: "Spacer",
                    props: { height: "8px" },
                  },
                  {
                    type: "Text",
                    props: {
                      content: "Pricing",
                      color: "#94a3b8",
                      size: "small",
                    },
                  },
                  {
                    type: "Spacer",
                    props: { height: "8px" },
                  },
                  {
                    type: "Text",
                    props: {
                      content: "Documentation",
                      color: "#94a3b8",
                      size: "small",
                    },
                  },
                ],
              },
            },
            {
              type: "Box",
              props: {
                padding: "0px",
                content: [
                  {
                    type: "Heading",
                    props: {
                      text: "Company",
                      level: "h5",
                      color: "#ffffff",
                    },
                  },
                  {
                    type: "Spacer",
                    props: { height: "12px" },
                  },
                  {
                    type: "Text",
                    props: {
                      content: "About",
                      color: "#94a3b8",
                      size: "small",
                    },
                  },
                  {
                    type: "Spacer",
                    props: { height: "8px" },
                  },
                  {
                    type: "Text",
                    props: {
                      content: "Blog",
                      color: "#94a3b8",
                      size: "small",
                    },
                  },
                  {
                    type: "Spacer",
                    props: { height: "8px" },
                  },
                  {
                    type: "Text",
                    props: {
                      content: "Careers",
                      color: "#94a3b8",
                      size: "small",
                    },
                  },
                ],
              },
            },
            {
              type: "Box",
              props: {
                padding: "0px",
                content: [
                  {
                    type: "Heading",
                    props: {
                      text: "Legal",
                      level: "h5",
                      color: "#ffffff",
                    },
                  },
                  {
                    type: "Spacer",
                    props: { height: "12px" },
                  },
                  {
                    type: "Text",
                    props: {
                      content: "Privacy",
                      color: "#94a3b8",
                      size: "small",
                    },
                  },
                  {
                    type: "Spacer",
                    props: { height: "8px" },
                  },
                  {
                    type: "Text",
                    props: {
                      content: "Terms",
                      color: "#94a3b8",
                      size: "small",
                    },
                  },
                  {
                    type: "Spacer",
                    props: { height: "8px" },
                  },
                  {
                    type: "Text",
                    props: {
                      content: "Contact",
                      color: "#94a3b8",
                      size: "small",
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        type: "Spacer",
        props: { height: "40px" },
      },
      {
        type: "Divider",
        props: {
          color: "#334155",
          thickness: "1px",
        },
      },
      {
        type: "Spacer",
        props: { height: "24px" },
      },
      {
        type: "Flex",
        props: {
          direction: "row",
          justifyContent: "space-between",
          alignItems: "center",
          content: [
            {
              type: "Text",
              props: {
                content: "© 2024 Company. All rights reserved.",
                color: "#64748b",
                size: "small",
              },
            },
            {
              type: "Flex",
              props: {
                direction: "row",
                gap: "16px",
                content: [
                  {
                    type: "Text",
                    props: {
                      content: "Twitter",
                      color: "#64748b",
                      size: "small",
                    },
                  },
                  {
                    type: "Text",
                    props: {
                      content: "LinkedIn",
                      color: "#64748b",
                      size: "small",
                    },
                  },
                  {
                    type: "Text",
                    props: {
                      content: "GitHub",
                      color: "#64748b",
                      size: "small",
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
  fields: {
    content: {
      type: "slot",
    },
    backgroundColor: {
      type: "text",
      label: "Background Color",
    },
    paddingTop: {
      type: "select",
      label: "Padding Top",
      options: [
        { label: "Small (40px)", value: "40px" },
        { label: "Medium (60px)", value: "60px" },
        { label: "Large (80px)", value: "80px" },
      ],
    },
    paddingBottom: {
      type: "select",
      label: "Padding Bottom",
      options: [
        { label: "Small (24px)", value: "24px" },
        { label: "Medium (40px)", value: "40px" },
        { label: "Large (60px)", value: "60px" },
      ],
    },
  },
  render: FooterTemplate,
};

// Export template component names for the config
export const templateComponents = [
  "HeroSplitTemplate",
  "HeroCenteredTemplate",
  "FeaturesGridTemplate",
  "PricingTableTemplate",
  "TestimonialsTemplate",
  "CtaSectionTemplate",
  "HeaderTemplate",
  "FooterTemplate",
];
