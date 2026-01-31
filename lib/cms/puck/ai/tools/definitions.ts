import { tool } from "ai";
import {
  addComponentSchema,
  editComponentSchema,
  removeComponentSchema,
  moveComponentSchema,
  duplicateComponentSchema,
  getPageStateSchema,
  generateLayoutSchema,
  selectComponentSchema,
  searchImagesSchema,
  getComponentHelpSchema,
} from "./schemas";

// Tool definitions for the AI assistant
// These define WHAT tools are available and their schemas
// Actual execution happens client-side via executors.ts

export const puckTools = {
  addComponent: tool({
    description: `Add a new component to the page.

Available component types and their hierarchy:
- Layout containers (use at root level): Section, Container, Grid, Flex, Row, Columns
- Content components (place inside containers): Heading, Text, Button, Image, Spacer, Icon, Divider
- Pre-built sections (use at root level): HeroSplitTemplate, HeroCenteredTemplate, FeaturesGridTemplate, PricingTableTemplate, TestimonialsTemplate, CtaSectionTemplate
- Navigation: Header, Footer, NavLink, FooterColumn, FooterLink, SocialLink
- Data display: StatsCard, Card, DataTable, Box

Best practices:
- Always wrap content in a Section or Container for proper spacing
- Use Grid or Flex for multi-column layouts
- Section > Container > Grid/Flex > Content components is the recommended hierarchy`,
    inputSchema: addComponentSchema,
  }),

  editComponent: tool({
    description: `Edit an existing component's props. Use this to modify text content, styles, or any other properties.

Common editable props by component type:
- Heading: text, level (h1-h6), align, color
- Text: text, align, color, size
- Button: text, href, variant (primary/secondary/outline), size
- Image: src, alt, aspectRatio
- Section: background, padding, animation
- Container: maxWidth, padding
- Grid: columns, gap
- Flex: direction, justify, align, gap

The props will be merged with existing props, so you only need to specify what you want to change.`,
    inputSchema: editComponentSchema,
  }),

  removeComponent: tool({
    description: `Remove a component from the page. This will delete the component and all its children.

Be careful: This action cannot be undone through this tool. The user can use Ctrl+Z to undo in the editor.`,
    inputSchema: removeComponentSchema,
  }),

  moveComponent: tool({
    description: `Move a component to a different location in the page structure.

You can:
- Move to root level by not specifying targetParentId
- Move inside another container by specifying its ID as targetParentId
- Control position with 'start', 'end', or a specific index number`,
    inputSchema: moveComponentSchema,
  }),

  duplicateComponent: tool({
    description: `Create a copy of an existing component with a new ID.

The duplicate will have all the same props as the original. Useful for:
- Creating similar sections
- Duplicating cards in a grid
- Copying styled components`,
    inputSchema: duplicateComponentSchema,
  }),

  getPageState: tool({
    description: `Get information about the current page structure and components.

Use this to:
- Understand what's currently on the page before making changes
- Find component IDs for editing or moving
- Check the component hierarchy

Returns a summary of all components with their IDs, types, and key props.`,
    inputSchema: getPageStateSchema,
  }),

  generateLayout: tool({
    description: `Generate a complete pre-built section using AI. This calls the page generation API to create complex layouts.

Available layout types:
- hero-split: Hero section with text on left, image on right
- hero-centered: Centered hero with heading, subheading, and CTA
- features-grid: Grid of feature cards (typically 3-6 features)
- pricing-table: Pricing comparison with multiple tiers
- testimonials: Customer testimonials section
- cta-section: Call-to-action section with heading and button
- custom: Use customPrompt to describe what you want

Set replaceAll to true to clear the page first, or false to append.`,
    inputSchema: generateLayoutSchema,
  }),

  selectComponent: tool({
    description: `Select and highlight a component in the editor UI.

Use this to:
- Show the user which component you're referring to
- Help the user locate a component visually
- Focus the properties panel on a specific component`,
    inputSchema: selectComponentSchema,
  }),

  searchImages: tool({
    description: `Search available images from the image library (R2 storage or placeholders).

Image categories:
- heroes: Large background images for hero sections
- features: Images for feature cards/icons
- team: Profile photos for team members
- products: Product shots for e-commerce
- backgrounds: Textures, gradients, patterns

Usage:
1. Call searchImages to find relevant images by category or search term
2. Use the returned URL in addComponent with Image type
3. Example: searchImages({category: "heroes"}) -> get URL -> addComponent(Image, props: {src: URL, alt: "..."})

Returns list of images with URLs ready to use.`,
    inputSchema: searchImagesSchema,
  }),

  getComponentHelp: tool({
    description: `Get detailed help and documentation for a component type.

IMPORTANT: Use this tool in help mode when users ask:
- "How do I edit this?"
- "What does this component do?"
- "What are the options for this?"
- "Show me how to configure this"

Returns:
- Component description and purpose
- All available props with types and descriptions
- Example configurations
- Common use cases and tips
- Related components

Always use this BEFORE selectComponent when explaining components.`,
    inputSchema: getComponentHelpSchema,
  }),
};

// Export the tools object for use in streamText
export type PuckToolName = keyof typeof puckTools;
