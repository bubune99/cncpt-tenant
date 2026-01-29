"use client";

import React from "react";
import { Config } from "@puckeditor/core";

// Primitive components (building blocks)
import { BoxConfig } from "./components/primitives/Box";
import { IconConfig } from "./components/primitives/Icon";
import { DividerConfig } from "./components/primitives/Divider";

// Layout components
import { SectionConfig } from "./components/layout/Section";
import { ContainerConfig } from "./components/layout/Container";
import { GridConfig } from "./components/layout/Grid";
import { FlexConfig } from "./components/layout/Flex";
import { RowConfig } from "./components/layout/Row";
import { ColumnsConfig } from "./components/layout/Columns";
import { HeaderConfig } from "./components/layout/Header";
import { FooterConfig } from "./components/layout/Footer";

// Navigation components (for headers/footers)
import { NavLinkConfig } from "./components/navigation/NavLink";
import { NavMenuConfig } from "./components/navigation/NavMenu";
import { NavMenuItemConfig } from "./components/navigation/NavMenuItem";
import { FooterColumnConfig } from "./components/navigation/FooterColumn";
import { FooterLinkConfig } from "./components/navigation/FooterLink";
import { SocialLinkConfig } from "./components/navigation/SocialLink";

// Content components
import { HeadingConfig } from "./components/content/Heading";
import { TextConfig } from "./components/content/Text";
import { ButtonConfig } from "./components/content/Button";
import { ImageConfig } from "./components/content/Image";
import { SpacerConfig } from "./components/content/Spacer";

// Dashboard components (pre-built, can be composed from primitives)
import { StatsCardConfig } from "./components/dashboard/StatsCard";
import { CardConfig } from "./components/dashboard/Card";
import { DataTableConfig } from "./components/dashboard/DataTable";

// Template components (pre-configured sections with default child content)
import {
  HeroSplitTemplateConfig,
  HeroCenteredTemplateConfig,
  FeaturesGridTemplateConfig,
  PricingTableTemplateConfig,
  TestimonialsTemplateConfig,
  CtaSectionTemplateConfig,
  HeaderTemplateConfig,
  FooterTemplateConfig,
  templateComponents,
} from "./components/templates";

// Define component categories
const primitiveComponents = ["Box", "Icon", "Divider"];
const layoutComponents = ["Section", "Container", "Grid", "Flex", "Row", "Columns"];
const contentComponents = ["Heading", "Text", "Button", "Image", "Spacer"];
const navigationComponents = ["Header", "Footer", "NavMenu", "NavMenuItem", "NavLink", "FooterColumn", "FooterLink", "SocialLink"];
const dashboardComponents = ["StatsCard", "Card", "DataTable"];
const allComponents = [...primitiveComponents, ...layoutComponents, ...contentComponents, ...navigationComponents, ...dashboardComponents];

export const puckConfig: Config = {
  categories: {
    primitives: {
      title: "Primitives",
      components: primitiveComponents,
      defaultExpanded: true,
    },
    layout: {
      title: "Layout",
      components: layoutComponents,
      defaultExpanded: true,
    },
    content: {
      title: "Content",
      components: contentComponents,
      defaultExpanded: false,
    },
    navigation: {
      title: "Header & Footer",
      components: navigationComponents,
      defaultExpanded: false,
    },
    templates: {
      title: "Templates",
      components: templateComponents,
      defaultExpanded: false,
    },
    dashboard: {
      title: "Pre-built",
      components: dashboardComponents,
      defaultExpanded: false,
    },
  },
  components: {
    // ===========================================
    // LAYOUT COMPONENTS (AI: Use freely)
    // Hierarchy: Section → Container → Grid/Flex/Row/Columns → Content
    // ===========================================
    Section: {
      ...SectionConfig,
      ai: {
        instructions: `LAYOUT HIERARCHY: Section is the TOP-LEVEL container. Always start page sections with a Section component.

USAGE RULES:
- Every distinct page area (hero, features, about, contact, etc.) should be wrapped in its own Section
- Section handles full-width backgrounds (colors, images, gradients, overlays)
- Always place a Container inside Section to constrain content width
- Set appropriate vertical padding (paddingTop/paddingBottom) for breathing room

SLOT LAYOUT:
- slotDirection: 'vertical' (default) or 'horizontal' for side-by-side content
- slotGap: spacing between direct children
- slotAlign: alignment of children (start, center, end, stretch, space-between)

STRUCTURE PATTERN:
Section (background, full-width)
  └── Container (max-width constraint)
      └── Grid/Flex/Columns (layout)
          └── Content (Heading, Text, Button, Image)

BACKGROUND OPTIONS: solid color, image with overlay, gradient. Use overlays for text readability on images.`,
      },
    },
    Container: {
      ...ContainerConfig,
      ai: {
        instructions: `LAYOUT HIERARCHY: Container goes INSIDE Section. It constrains content to a max-width and centers it.

USAGE RULES:
- Always place Container inside Section (never at root level)
- Use maxWidth to control content width (1200px is standard, 800px for narrow text)
- Container centers itself horizontally with margin: 0 auto
- Add padding for internal spacing

SLOT LAYOUT:
- slotDirection: 'vertical' (default) or 'horizontal' for side-by-side children
- slotGap: spacing between direct children
- slotAlign: alignment of children (start, center, end, stretch, space-between)

STRUCTURE PATTERN:
Section
  └── Container (you are here)
      └── Grid/Flex/Columns or direct content

WHEN TO USE: Always use Container inside Section to prevent content from stretching edge-to-edge.`,
      },
    },
    Grid: {
      ...GridConfig,
      ai: {
        instructions: `LAYOUT HIERARCHY: Grid goes INSIDE Container. Use for equal-width multi-column layouts.

USAGE RULES:
- Place inside Container (not directly in Section)
- Use for card grids, feature lists, image galleries
- Set columns (2-4 is typical) and gap
- Children automatically get equal widths

BEST FOR: Card layouts, feature grids, team members, product grids, gallery layouts.
NOT FOR: Asymmetric layouts (use Columns), single items (use Box).`,
      },
    },
    Flex: {
      ...FlexConfig,
      ai: {
        instructions: `LAYOUT HIERARCHY: Flex goes INSIDE Container. Use for flexible layouts with varying child widths.

USAGE RULES:
- Place inside Container (not directly in Section)
- Use direction 'row' for horizontal, 'column' for vertical
- Control alignment with justifyContent and alignItems
- Children can have different widths

BEST FOR: Navigation bars, button groups, footer columns, centering content, spacing items.
NOT FOR: Equal-width grids (use Grid), two-column splits (use Columns).`,
      },
    },
    Row: {
      ...RowConfig,
      ai: {
        instructions: `LAYOUT HIERARCHY: Row goes INSIDE Container. Simpler alternative to Grid for horizontal layouts.

USAGE RULES:
- Place inside Container (not directly in Section)
- Creates equal-width columns in a row
- Simpler than Grid, less flexible

BEST FOR: Simple multi-column content, side-by-side elements.
PREFER Grid for: More control, responsive breakpoints, complex layouts.`,
      },
    },
    Columns: {
      ...ColumnsConfig,
      ai: {
        instructions: `LAYOUT HIERARCHY: Columns goes INSIDE Container. Use for two-column layouts with custom width splits.

USAGE RULES:
- Place inside Container (not directly in Section)
- Set split ratio: 50/50 (equal), 60/40, 70/30, 40/60, 30/70
- Perfect for image + text layouts
- Use 'reverse' to flip order on mobile

BEST FOR: Hero with image, about sections, feature highlights with visuals.
COMMON PATTERNS:
- Image left (40%) + Text right (60%): split="40/60"
- Text left (60%) + Image right (40%): split="60/40"`,
      },
    },

    // ===========================================
    // HEADER & FOOTER COMPONENTS
    // Dedicated components for site navigation
    // ===========================================
    Header: {
      ...HeaderConfig,
      ai: {
        instructions: `HEADER COMPONENT: Purpose-built component for site navigation headers with 3-column layout.

USAGE RULES:
- Place at the top of pages or use globally in layout
- Has built-in logo (text or image) in left column by default
- THREE COLUMN SLOTS for flexible layout: leftContent, centerContent, rightContent

LAYOUT OPTIONS:
- 3-column: All three columns visible (most flexible)
- 2-column-left: Logo + left content, center content
- 2-column-right: Center content, right content
- logo-center: Left content, centered logo, right content

COLUMN SLOTS:
- leftContent: Navigation links, typically placed after logo
- centerContent: Can hold centered nav or search
- rightContent: CTAs, user menu, buttons

FEATURES: Sticky option, shadow levels, background (solid/transparent/blur), configurable column widths.

CHILD COMPONENTS:
- Use NavMenu + NavMenuItem for navigation with dropdowns
- Use NavLink for simple links with optional submenus
- Use Button for CTAs

STRUCTURE:
Header (3-column layout)
  ├── leftContent → NavMenu → NavMenuItem (with dropdown children)
  ├── centerContent → (optional: search, centered nav)
  └── rightContent → Button, user menu

vs HEADER TEMPLATE: Use "Header (Quick Start)" template if user wants pre-filled content. Use this Header component when building from scratch with more customization.`,
      },
    },
    Footer: {
      ...FooterConfig,
      ai: {
        instructions: `FOOTER COMPONENT: Purpose-built component for site footers with dedicated column slots.

USAGE RULES:
- Place at the bottom of pages or use globally in layout
- FOUR DEDICATED COLUMN SLOTS: column1, column2, column3, column4
- 'bottomContent' slot is horizontal for social links, legal links, etc.
- Built-in copyright with toggle

COLUMN SETTINGS:
- columnsCount: Choose 2, 3, or 4 columns
- columnsLayout: Equal width or ratios (1:2, 2:1, 1:1:2, 2:1:1, 1:2:1, or custom)
- mobileStack: Automatically stacks columns on mobile

COLUMN SLOTS:
- column1: First footer section (e.g., Company info, logo, description)
- column2: Second section (e.g., Products links)
- column3: Third section (e.g., Resources links)
- column4: Fourth section (e.g., Contact info)

CHILD COMPONENTS: Use FooterColumn, FooterLink for links, SocialLink for social icons.

STRUCTURE:
Footer (CSS Grid layout)
  ├── column1 → FooterColumn (Company Info)
  ├── column2 → FooterColumn (Products)
  ├── column3 → FooterColumn (Resources)
  └── column4 → FooterColumn (Contact)
  └── bottomContent → SocialLink icons

FEATURES: Background (solid/gradient), mobile-responsive stacking, divider, copyright text.

vs FOOTER TEMPLATE: Use "Footer (Quick Start)" template if user wants pre-filled content. Use this Footer component when building from scratch with more customization.`,
      },
    },
    NavMenu: {
      ...NavMenuConfig,
      ai: {
        instructions: `NAVIGATION MENU: Container for navigation items with dropdown support.

USAGE:
- Drop into Header's leftContent, centerContent, or rightContent slots
- Displays items horizontally (or vertically)
- Provides dropdown styling for child NavMenuItem components

STRUCTURE:
NavMenu
  └── NavMenuItem (with optional dropdown children)
      └── NavLink or NavMenuItem (nested)

FEATURES: Direction (horizontal/vertical), alignment, gap, dropdown styling (background, shadow, radius).`,
      },
    },
    NavMenuItem: {
      ...NavMenuItemConfig,
      ai: {
        instructions: `NAVIGATION MENU ITEM: Individual menu item with dropdown support.

USAGE:
- Drop into NavMenu's items slot
- Enable "Has Dropdown" to show nested items
- Drop NavLink or more NavMenuItem components into the children slot for submenus

FEATURES: Label, URL, dropdown toggle, hover/click trigger, colors.
DROPDOWN: When enabled, hovering/clicking reveals nested children as dropdown menu.`,
      },
    },
    NavLink: {
      ...NavLinkConfig,
      ai: {
        instructions: `NAVIGATION LINK: Flexible nav link with optional dropdown submenu.

USAGE:
- Drop into Header slots or NavMenu for navigation items
- Enable "Has Dropdown" to add nested submenu items
- Automatically shows dropdown arrow when submenu is enabled

FEATURES: Label, URL, hover color, active state, dropdown submenu support.
SUBMENU: Enable hasSubmenu and add NavLink components to the submenu slot for dropdowns.`,
      },
    },
    FooterColumn: {
      ...FooterColumnConfig,
      ai: {
        instructions: `FOOTER COLUMN: Use inside Footer's columns slot.

USAGE: Creates a titled column with vertical links.
DROP INTO: Footer's 'columns' slot
CHILDREN: FooterLink components for each link, or Text for descriptions.`,
      },
    },
    FooterLink: {
      ...FooterLinkConfig,
      ai: {
        instructions: `FOOTER LINK: Use inside FooterColumn for footer navigation links.

USAGE: Simple link optimized for footer styling.
FEATURES: Label, URL, colors, open in new tab option.`,
      },
    },
    SocialLink: {
      ...SocialLinkConfig,
      ai: {
        instructions: `SOCIAL LINK: Use inside Footer's bottomContent slot.

USAGE: Displays social media icon with link.
PLATFORMS: Facebook, Twitter/X, Instagram, LinkedIn, YouTube, GitHub, TikTok, or custom SVG.
FEATURES: Icon color, hover color, size.`,
      },
    },

    // ===========================================
    // PRIMITIVE COMPONENTS (AI: Use freely)
    // Building blocks that go inside layout components
    // ===========================================
    Box: {
      ...BoxConfig,
      ai: {
        instructions: `PRIMITIVE: Box is a flexible container for grouping and styling content.

USAGE RULES:
- Use inside Grid, Flex, Columns, or Container
- Set slotDirection to 'horizontal' to arrange children side-by-side (great for headers, nav bars)
- Set slotDirection to 'vertical' (default) for stacked content
- Use slotGap to add spacing between children
- Use slotAlign to control alignment (start, center, end, stretch, space-between)
- Add padding, background, border, borderRadius for styling

SLOT LAYOUT (Quick Access):
- Direction: vertical (↓) or horizontal (→)
- Gap: spacing between children
- Align: how children are aligned

WHEN TO USE: When you need a styled container. Use horizontal direction for headers, navbars, button groups.
WHEN NOT TO USE: For page-level sections (use Section), for width constraints (use Container).`,
      },
    },
    Icon: {
      ...IconConfig,
      ai: {
        instructions: `PRIMITIVE: Icon displays vector icons from the icon library.

USAGE: Add visual indicators, enhance buttons, decorative elements.
SETTINGS: Choose icon name, size (in pixels), and color.`,
      },
    },
    Divider: {
      ...DividerConfig,
      ai: {
        instructions: `PRIMITIVE: Divider creates visual separation between content.

USAGE: Separate content sections, create visual breaks.
SETTINGS: orientation (horizontal/vertical), thickness, color, style (solid/dashed/dotted).
TIP: Use sparingly - whitespace (Spacer or padding) is often better.`,
      },
    },

    // ===========================================
    // CONTENT COMPONENTS (AI: Use freely)
    // The actual content that users see
    // ===========================================
    Heading: {
      ...HeadingConfig,
      ai: {
        instructions: `CONTENT: Heading displays titles and section headers.

USAGE RULES:
- H1: Page title only (use once per page)
- H2: Major section titles
- H3: Subsection titles
- H4-H6: Minor headings

SETTINGS: text, level (h1-h6), align, color, fontSize (optional override).
KEEP: Concise and descriptive. Front-load important words.`,
      },
    },
    Text: {
      ...TextConfig,
      ai: {
        instructions: `CONTENT: Text displays paragraphs and body content.

USAGE RULES:
- Use for all paragraph text, descriptions, body copy
- Keep paragraphs scannable (3-4 sentences max)
- Use size 'large' for lead paragraphs, 'small' for captions

SETTINGS: content, align, color, size (small/base/large).`,
      },
    },
    Button: {
      ...ButtonConfig,
      ai: {
        instructions: `CONTENT: Button creates clickable call-to-action elements.

USAGE RULES:
- Primary: Main action (1 per section typically)
- Secondary: Alternative action
- Outline: Subtle/tertiary action

LABEL TIPS: Keep short (2-4 words), action-oriented verbs.
GOOD: "Get Started", "Learn More", "Sign Up", "Contact Us"
BAD: "Click Here", "Submit", "Button"`,
      },
    },
    Image: {
      ...ImageConfig,
      ai: {
        instructions: `CONTENT: Image displays pictures and graphics.

USAGE RULES:
- Always set meaningful alt text for accessibility
- Use aspectRatio for consistent sizing (16:9 hero, 4:3 cards, 1:1 avatars)
- objectFit 'cover' for cropping, 'contain' for full image

SETTINGS: src (URL), alt (required), aspectRatio, objectFit, borderRadius.`,
      },
    },
    Spacer: {
      ...SpacerConfig,
      ai: {
        instructions: `CONTENT: Spacer adds vertical whitespace between elements.

USAGE RULES:
- Use sparingly - prefer padding on containers
- Heights: 16px (small), 32px (medium), 48px (large), 64px (xl)
- Can optionally show a divider line

PREFER: Container/Section padding over multiple Spacers.`,
      },
    },

    // ===========================================
    // PRE-BUILT COMPONENTS (AI: User-controlled)
    // Only use when explicitly requested by user
    // ===========================================
    StatsCard: {
      ...StatsCardConfig,
      ai: {
        instructions: `USER-CONTROLLED: Only use StatsCard when the user explicitly requests statistics, metrics, or dashboard-style number displays.

DO NOT use unless user specifically asks for: stats, metrics, KPIs, numbers display, dashboard cards.

WHEN REQUESTED: Display label, value, optional trend indicator. Good for impact numbers, analytics.`,
      },
    },
    Card: {
      ...CardConfig,
      ai: {
        instructions: `USER-CONTROLLED: Only use Card when the user explicitly requests card-style content blocks.

DO NOT use unless user specifically asks for: cards, card layout, blog cards, product cards, team cards.

ALTERNATIVE: Build card-like layouts with Box + Image + Heading + Text for more control.

WHEN REQUESTED: Contains image, title, description in a boxed format.`,
      },
    },
    DataTable: {
      ...DataTableConfig,
      ai: {
        instructions: `USER-CONTROLLED: Only use DataTable when the user explicitly requests tabular data display.

DO NOT use unless user specifically asks for: tables, data tables, comparison tables, pricing tables with rows/columns.

WHEN REQUESTED: Configure columns and rows for structured data display.`,
      },
    },

    // ===========================================
    // TEMPLATE COMPONENTS (AI: User-controlled)
    // Pre-designed sections - only use when explicitly requested
    // ===========================================
    HeroSplitTemplate: {
      ...HeroSplitTemplateConfig,
      ai: {
        instructions: `USER-CONTROLLED TEMPLATE: Only use when user explicitly requests a "hero template", "split hero", or "hero with image on side".

DO NOT use unless explicitly requested. Instead, BUILD hero sections using:
Section → Container → Columns (60/40 or 40/60) → [Heading + Text + Button] + [Image]

This template provides a pre-designed split hero layout.`,
      },
    },
    HeroCenteredTemplate: {
      ...HeroCenteredTemplateConfig,
      ai: {
        instructions: `USER-CONTROLLED TEMPLATE: Only use when user explicitly requests a "centered hero template" or "centered hero section".

DO NOT use unless explicitly requested. Instead, BUILD centered heroes using:
Section (with background) → Container → Box (centered flex) → Heading + Text + Button

This template provides a pre-designed centered hero layout.`,
      },
    },
    FeaturesGridTemplate: {
      ...FeaturesGridTemplateConfig,
      ai: {
        instructions: `USER-CONTROLLED TEMPLATE: Only use when user explicitly requests a "features template" or "features grid template".

DO NOT use unless explicitly requested. Instead, BUILD feature sections using:
Section → Container → Heading + Text → Grid (3 columns) → [Box + Icon + Heading + Text] repeated

This template provides a pre-designed features grid.`,
      },
    },
    PricingTableTemplate: {
      ...PricingTableTemplateConfig,
      ai: {
        instructions: `USER-CONTROLLED TEMPLATE: Only use when user explicitly requests a "pricing template" or "pricing table template".

DO NOT use unless explicitly requested. Instead, BUILD pricing sections using:
Section → Container → Heading → Grid (3 columns) → [Box with pricing content] repeated

This template provides a pre-designed pricing comparison layout.`,
      },
    },
    TestimonialsTemplate: {
      ...TestimonialsTemplateConfig,
      ai: {
        instructions: `USER-CONTROLLED TEMPLATE: Only use when user explicitly requests a "testimonials template" or "testimonials section template".

DO NOT use unless explicitly requested. Instead, BUILD testimonials using:
Section → Container → Heading → Grid → [Box + Text (quote) + Image + Text (name)] repeated

This template provides a pre-designed testimonials layout.`,
      },
    },
    CtaSectionTemplate: {
      ...CtaSectionTemplateConfig,
      ai: {
        instructions: `USER-CONTROLLED TEMPLATE: Only use when user explicitly requests a "CTA template" or "call-to-action template".

DO NOT use unless explicitly requested. Instead, BUILD CTA sections using:
Section (colored background) → Container → Box (centered) → Heading + Text + Button

This template provides a pre-designed call-to-action section.`,
      },
    },
    HeaderTemplate: {
      ...HeaderTemplateConfig,
      ai: {
        instructions: `QUICK START TEMPLATE: Pre-filled header with default navigation content. Only use when user wants a quick starting point.

PREFER the "Header" component from Header & Footer category for:
- More customization (built-in logo, layouts, blur effects)
- Better control over structure
- Purpose-built header features

USE THIS TEMPLATE when:
- User explicitly asks for "header template" or "quick start header"
- User wants pre-filled example content to modify

This template uses generic components (Flex, Text, Button) arranged as a header.`,
      },
    },
    FooterTemplate: {
      ...FooterTemplateConfig,
      ai: {
        instructions: `QUICK START TEMPLATE: Pre-filled footer with default column content. Only use when user wants a quick starting point.

PREFER the "Footer" component from Header & Footer category for:
- More customization (column layouts, gradient backgrounds)
- Built-in copyright, dividers
- Purpose-built footer features with dedicated child components

USE THIS TEMPLATE when:
- User explicitly asks for "footer template" or "quick start footer"
- User wants pre-filled example content to modify

This template uses generic components (Grid, Box, Text) arranged as a footer.`,
      },
    },
  },
  root: {
    defaultProps: {
      title: "Untitled Page",
    },
    fields: {
      title: {
        type: "text",
        label: "Page Title",
      },
    },
    render: ({ children }: { children: React.ReactNode }) => {
      return (
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#ffffff",
          }}
        >
          {children}
        </div>
      );
    },
  },
};

export default puckConfig;
