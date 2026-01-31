import type { Data, ComponentData } from "@puckeditor/core";
import type {
  AddComponentInput,
  EditComponentInput,
  RemoveComponentInput,
  MoveComponentInput,
  DuplicateComponentInput,
  GetPageStateInput,
  GenerateLayoutInput,
  SelectComponentInput,
  SearchImagesInput,
  GetComponentHelpInput,
} from "./schemas";

// Component documentation database for help mode
const componentHelp: Record<string, {
  description: string;
  props: Array<{ name: string; type: string; description: string; required?: boolean; default?: string }>;
  examples: Array<{ title: string; props: Record<string, unknown> }>;
  tips: string[];
  relatedComponents: string[];
}> = {
  Section: {
    description: "A full-width page section that acts as a container for page content. Use sections to divide your page into logical areas with different backgrounds and spacing.",
    props: [
      { name: "background", type: "string", description: "Background color or gradient (e.g., '#f8fafc', 'linear-gradient(...)') ", default: "transparent" },
      { name: "padding", type: "string", description: "Vertical padding size", default: "lg" },
      { name: "maxWidth", type: "string", description: "Maximum content width (sm, md, lg, xl, full)", default: "xl" },
    ],
    examples: [
      { title: "Hero Section", props: { background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "xl" } },
      { title: "Light Section", props: { background: "#f8fafc", padding: "lg" } },
    ],
    tips: [
      "Always use Section as the root-level container for content",
      "Nest a Container inside for centered, max-width content",
      "Use padding to control vertical spacing between sections",
    ],
    relatedComponents: ["Container", "Grid", "Flex"],
  },
  Container: {
    description: "Centers content with a maximum width. Use inside Section to constrain content width.",
    props: [
      { name: "maxWidth", type: "string", description: "Maximum width (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)", default: "xl" },
      { name: "padding", type: "string", description: "Horizontal padding", default: "md" },
    ],
    examples: [
      { title: "Standard Container", props: { maxWidth: "xl", padding: "md" } },
      { title: "Narrow Container", props: { maxWidth: "md", padding: "lg" } },
    ],
    tips: [
      "Use Container inside Section for proper centering",
      "Container > Grid/Flex > Content is the recommended structure",
    ],
    relatedComponents: ["Section", "Grid", "Flex"],
  },
  Grid: {
    description: "A CSS Grid layout with equal-width columns. Use for card grids, feature lists, or any uniform column layout.",
    props: [
      { name: "columns", type: "number", description: "Number of columns (1-6)", default: "3" },
      { name: "gap", type: "string", description: "Gap between items (sm, md, lg)", default: "md" },
    ],
    examples: [
      { title: "3-Column Grid", props: { columns: 3, gap: "md" } },
      { title: "2-Column Grid", props: { columns: 2, gap: "lg" } },
    ],
    tips: [
      "Use Grid when all columns should be equal width",
      "For unequal columns, use Flex or Columns instead",
      "Grid items automatically wrap on smaller screens",
    ],
    relatedComponents: ["Flex", "Columns", "Card"],
  },
  Flex: {
    description: "A flexible container using CSS Flexbox. Use for layouts where items need different sizes or alignment.",
    props: [
      { name: "direction", type: "string", description: "Flex direction (row, column)", default: "row" },
      { name: "justify", type: "string", description: "Justify content (start, center, end, between, around)", default: "start" },
      { name: "align", type: "string", description: "Align items (start, center, end, stretch)", default: "stretch" },
      { name: "gap", type: "string", description: "Gap between items", default: "md" },
      { name: "wrap", type: "boolean", description: "Whether items wrap to next line", default: "true" },
    ],
    examples: [
      { title: "Centered Row", props: { direction: "row", justify: "center", align: "center", gap: "md" } },
      { title: "Space Between", props: { direction: "row", justify: "between", align: "center" } },
    ],
    tips: [
      "Use Flex for hero layouts (text + image side by side)",
      "Use justify='between' for navigation-style layouts",
      "Use direction='column' for stacked content",
    ],
    relatedComponents: ["Grid", "Row", "Columns"],
  },
  Heading: {
    description: "A text heading component (h1-h6). Use for titles, section headers, and any prominent text.",
    props: [
      { name: "text", type: "string", description: "The heading text content", required: true },
      { name: "level", type: "string", description: "Heading level (h1, h2, h3, h4, h5, h6)", default: "h2" },
      { name: "align", type: "string", description: "Text alignment (left, center, right)", default: "left" },
      { name: "color", type: "string", description: "Text color (any CSS color)", default: "inherit" },
    ],
    examples: [
      { title: "Page Title", props: { text: "Welcome to Our Site", level: "h1", align: "center" } },
      { title: "Section Title", props: { text: "Our Features", level: "h2" } },
    ],
    tips: [
      "Use h1 only once per page (main title)",
      "Use h2 for section titles, h3 for subsections",
      "Keep heading text concise and descriptive",
    ],
    relatedComponents: ["Text", "Section"],
  },
  Text: {
    description: "A paragraph text component. Use for body text, descriptions, and any longer form content.",
    props: [
      { name: "text", type: "string", description: "The text content", required: true },
      { name: "align", type: "string", description: "Text alignment (left, center, right)", default: "left" },
      { name: "color", type: "string", description: "Text color", default: "inherit" },
      { name: "size", type: "string", description: "Font size (sm, md, lg, xl)", default: "md" },
    ],
    examples: [
      { title: "Body Text", props: { text: "Lorem ipsum dolor sit amet...", size: "md" } },
      { title: "Large Intro", props: { text: "Discover amazing features", size: "xl", align: "center" } },
    ],
    tips: [
      "Use size='lg' or 'xl' for introductory paragraphs",
      "Keep text readable with good line length (max-width)",
      "Use color for emphasis or to match section backgrounds",
    ],
    relatedComponents: ["Heading", "Button"],
  },
  Button: {
    description: "A clickable button component. Use for calls-to-action, links, and interactive elements.",
    props: [
      { name: "text", type: "string", description: "Button label text", required: true },
      { name: "href", type: "string", description: "Link URL (makes button a link)", required: true },
      { name: "variant", type: "string", description: "Visual style (primary, secondary, outline, ghost)", default: "primary" },
      { name: "size", type: "string", description: "Button size (sm, md, lg)", default: "md" },
    ],
    examples: [
      { title: "Primary CTA", props: { text: "Get Started", href: "/signup", variant: "primary", size: "lg" } },
      { title: "Secondary Button", props: { text: "Learn More", href: "/about", variant: "outline" } },
    ],
    tips: [
      "Use primary variant for main CTAs",
      "Use outline or ghost for secondary actions",
      "Keep button text action-oriented (verbs)",
    ],
    relatedComponents: ["Text", "Heading"],
  },
  Image: {
    description: "An image component with responsive sizing. Use for photos, illustrations, and visual content.",
    props: [
      { name: "src", type: "string", description: "Image URL", required: true },
      { name: "alt", type: "string", description: "Alt text for accessibility", required: true },
      { name: "aspectRatio", type: "string", description: "Aspect ratio (16:9, 4:3, 1:1, auto)", default: "auto" },
      { name: "objectFit", type: "string", description: "How image fills container (cover, contain)", default: "cover" },
    ],
    examples: [
      { title: "Hero Image", props: { src: "/images/hero.jpg", alt: "Hero image", aspectRatio: "16:9" } },
      { title: "Square Image", props: { src: "/images/photo.jpg", alt: "Photo", aspectRatio: "1:1" } },
    ],
    tips: [
      "Always provide meaningful alt text",
      "Use aspectRatio to maintain consistent layouts",
      "Use searchImages tool to find available images",
    ],
    relatedComponents: ["Card", "Section"],
  },
  Card: {
    description: "A card component with image, title, and content. Use for feature cards, blog previews, or any boxed content.",
    props: [
      { name: "title", type: "string", description: "Card title", required: true },
      { name: "description", type: "string", description: "Card description text" },
      { name: "image", type: "string", description: "Card image URL" },
      { name: "href", type: "string", description: "Link URL for the card" },
    ],
    examples: [
      { title: "Feature Card", props: { title: "Fast Performance", description: "Lightning fast load times" } },
      { title: "Blog Card", props: { title: "New Blog Post", description: "Read our latest...", image: "/images/blog.jpg", href: "/blog/post" } },
    ],
    tips: [
      "Use Cards inside a Grid for uniform layouts",
      "Cards work great for features, team members, blog posts",
    ],
    relatedComponents: ["Grid", "StatsCard"],
  },
  Spacer: {
    description: "Adds vertical whitespace. Use to create breathing room between components.",
    props: [
      { name: "height", type: "string", description: "Spacer height (sm, md, lg, xl, or custom like '80px')", default: "md" },
    ],
    examples: [
      { title: "Medium Space", props: { height: "md" } },
      { title: "Large Space", props: { height: "xl" } },
    ],
    tips: [
      "Use Spacer instead of margin for explicit spacing",
      "Prefer padding on Section/Container for section spacing",
    ],
    relatedComponents: ["Divider", "Section"],
  },
  Divider: {
    description: "A horizontal line divider. Use to visually separate content sections.",
    props: [
      { name: "color", type: "string", description: "Line color", default: "#e5e7eb" },
      { name: "thickness", type: "string", description: "Line thickness", default: "1px" },
    ],
    examples: [
      { title: "Light Divider", props: { color: "#e5e7eb" } },
      { title: "Dark Divider", props: { color: "#374151", thickness: "2px" } },
    ],
    tips: [
      "Use sparingly - whitespace often works better",
      "Match color to your design palette",
    ],
    relatedComponents: ["Spacer", "Section"],
  },
};

// Generate a unique ID for new components
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Helper to find a component by ID in the tree
function findComponent(
  content: ComponentData[],
  id: string
): { component: ComponentData; parent: ComponentData[] | null; index: number } | null {
  for (let i = 0; i < content.length; i++) {
    const component = content[i];
    if (component.props?.id === id) {
      return { component, parent: content, index: i };
    }
    // Search in nested content
    if (Array.isArray(component.props?.content)) {
      const found = findComponent(component.props.content, id);
      if (found) return found;
    }
  }
  return null;
}

// Helper to get all components as a flat list with their paths
function flattenComponents(
  content: ComponentData[],
  path: string[] = []
): Array<{ component: ComponentData; path: string[] }> {
  const result: Array<{ component: ComponentData; path: string[] }> = [];

  for (const component of content) {
    const componentPath = [...path, component.type];
    result.push({ component, path: componentPath });

    if (Array.isArray(component.props?.content)) {
      result.push(...flattenComponents(component.props.content, componentPath));
    }
  }

  return result;
}

// Deep clone a component with new IDs
function cloneComponentWithNewIds(component: ComponentData): ComponentData {
  const cloned: ComponentData = {
    type: component.type,
    props: {
      ...component.props,
      id: generateId(),
    },
  };

  if (Array.isArray(component.props?.content)) {
    cloned.props.content = component.props.content.map(cloneComponentWithNewIds);
  }

  return cloned;
}

// Tool result types
export interface ToolResult {
  success: boolean;
  message: string;
  data?: unknown;
}

// Create executor functions that work with Puck state
export function createToolExecutors(
  appState: { data: Data; ui: unknown },
  dispatch: (action: { type: string; [key: string]: unknown }) => void
) {
  return {
    addComponent: async (args: AddComponentInput): Promise<ToolResult> => {
      try {
        const newComponent: ComponentData = {
          type: args.componentType,
          props: {
            id: generateId(),
            ...args.props,
          },
        };

        const newData = JSON.parse(JSON.stringify(appState.data)) as Data;

        if (args.parentId) {
          // Add to specific parent
          const found = findComponent(newData.content, args.parentId);
          if (!found) {
            return {
              success: false,
              message: `Parent component with ID "${args.parentId}" not found`,
            };
          }

          // Ensure parent has content array
          if (!Array.isArray(found.component.props.content)) {
            found.component.props.content = [];
          }

          if (args.position === "start") {
            found.component.props.content.unshift(newComponent);
          } else {
            found.component.props.content.push(newComponent);
          }
        } else {
          // Add to root content
          if (args.position === "start") {
            newData.content.unshift(newComponent);
          } else {
            newData.content.push(newComponent);
          }
        }

        dispatch({ type: "setData", data: newData });

        return {
          success: true,
          message: `Added ${args.componentType} component`,
          data: { componentId: newComponent.props.id },
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to add component: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },

    editComponent: async (args: EditComponentInput): Promise<ToolResult> => {
      try {
        const newData = JSON.parse(JSON.stringify(appState.data)) as Data;
        const found = findComponent(newData.content, args.componentId);

        if (!found) {
          return {
            success: false,
            message: `Component with ID "${args.componentId}" not found`,
          };
        }

        // Merge new props with existing props
        found.component.props = {
          ...found.component.props,
          ...args.props,
        };

        dispatch({ type: "setData", data: newData });

        return {
          success: true,
          message: `Updated ${found.component.type} component`,
          data: { componentId: args.componentId },
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to edit component: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },

    removeComponent: async (args: RemoveComponentInput): Promise<ToolResult> => {
      try {
        const newData = JSON.parse(JSON.stringify(appState.data)) as Data;
        const found = findComponent(newData.content, args.componentId);

        if (!found) {
          return {
            success: false,
            message: `Component with ID "${args.componentId}" not found`,
          };
        }

        const componentType = found.component.type;

        // Remove from parent array
        found.parent!.splice(found.index, 1);

        dispatch({ type: "setData", data: newData });

        return {
          success: true,
          message: `Removed ${componentType} component`,
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to remove component: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },

    moveComponent: async (args: MoveComponentInput): Promise<ToolResult> => {
      try {
        const newData = JSON.parse(JSON.stringify(appState.data)) as Data;
        const found = findComponent(newData.content, args.componentId);

        if (!found) {
          return {
            success: false,
            message: `Component with ID "${args.componentId}" not found`,
          };
        }

        // Remove from current location
        const [component] = found.parent!.splice(found.index, 1);

        // Find target location
        let targetArray: ComponentData[];
        if (args.targetParentId) {
          const targetFound = findComponent(newData.content, args.targetParentId);
          if (!targetFound) {
            return {
              success: false,
              message: `Target parent with ID "${args.targetParentId}" not found`,
            };
          }
          if (!Array.isArray(targetFound.component.props.content)) {
            targetFound.component.props.content = [];
          }
          targetArray = targetFound.component.props.content;
        } else {
          targetArray = newData.content;
        }

        // Insert at position
        if (args.position === "start") {
          targetArray.unshift(component);
        } else if (args.position === "end" || args.position === undefined) {
          targetArray.push(component);
        } else if (typeof args.position === "number") {
          targetArray.splice(args.position, 0, component);
        }

        dispatch({ type: "setData", data: newData });

        return {
          success: true,
          message: `Moved ${component.type} component`,
          data: { componentId: args.componentId },
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to move component: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },

    duplicateComponent: async (args: DuplicateComponentInput): Promise<ToolResult> => {
      try {
        const newData = JSON.parse(JSON.stringify(appState.data)) as Data;
        const found = findComponent(newData.content, args.componentId);

        if (!found) {
          return {
            success: false,
            message: `Component with ID "${args.componentId}" not found`,
          };
        }

        // Clone with new IDs
        const cloned = cloneComponentWithNewIds(found.component);

        // Insert at appropriate position
        if (args.insertAfter) {
          found.parent!.splice(found.index + 1, 0, cloned);
        } else {
          found.parent!.push(cloned);
        }

        dispatch({ type: "setData", data: newData });

        return {
          success: true,
          message: `Duplicated ${found.component.type} component`,
          data: { newComponentId: cloned.props.id },
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to duplicate component: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },

    getPageState: async (args: GetPageStateInput): Promise<ToolResult> => {
      try {
        if (args.includeFullTree) {
          return {
            success: true,
            message: "Retrieved full page state",
            data: appState.data,
          };
        }

        // Return a summary
        const components = flattenComponents(appState.data.content);
        const summary = components.map(({ component, path }) => ({
          id: component.props?.id,
          type: component.type,
          path: path.join(" > "),
          keyProps: getKeyProps(component),
        }));

        return {
          success: true,
          message: `Page has ${summary.length} components`,
          data: {
            rootTitle: appState.data.root?.props?.title,
            componentCount: summary.length,
            components: summary,
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to get page state: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },

    generateLayout: async (args: GenerateLayoutInput): Promise<ToolResult> => {
      try {
        // Map layout type to prompt
        const prompts: Record<string, string> = {
          "hero-split": "Create a hero section with heading on the left and image on the right",
          "hero-centered": "Create a centered hero section with heading, subheading, and CTA button",
          "features-grid": "Create a features section with 3-4 feature cards in a grid",
          "pricing-table": "Create a pricing section with 3 pricing tiers",
          "testimonials": "Create a testimonials section with customer quotes",
          "cta-section": "Create a call-to-action section with heading and button",
          "custom": args.customPrompt || "Create a custom section",
        };

        const prompt = prompts[args.layoutType];

        // Call the generate-page API
        const response = await fetch("/api/ai/generate-page", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, pageType: "custom" }),
        });

        if (!response.ok) {
          const error = await response.json();
          return {
            success: false,
            message: `Failed to generate layout: ${error.error || "Unknown error"}`,
          };
        }

        const result = await response.json();

        if (args.replaceAll) {
          dispatch({ type: "setData", data: result.data });
        } else {
          const newData = JSON.parse(JSON.stringify(appState.data)) as Data;
          newData.content.push(...result.data.content);
          dispatch({ type: "setData", data: newData });
        }

        return {
          success: true,
          message: `Generated ${args.layoutType} layout with ${result.data.content.length} components`,
          data: { componentsAdded: result.data.content.length },
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to generate layout: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },

    selectComponent: async (args: SelectComponentInput): Promise<ToolResult> => {
      try {
        // Find the component to verify it exists
        const found = findComponent(appState.data.content, args.componentId);

        if (!found) {
          return {
            success: false,
            message: `Component with ID "${args.componentId}" not found`,
          };
        }

        // Use Puck's setUi action to select the component
        dispatch({
          type: "setUi",
          ui: {
            itemSelector: {
              index: found.index,
              zone: null, // Root zone
            },
          },
        });

        return {
          success: true,
          message: `Selected ${found.component.type} component`,
          data: { componentId: args.componentId, componentType: found.component.type },
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to select component: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },

    searchImages: async (args: SearchImagesInput): Promise<ToolResult> => {
      try {
        // Build query params
        const params = new URLSearchParams();
        if (args.category) params.set("category", args.category);
        if (args.search) params.set("search", args.search);

        // Fetch from the images API
        const response = await fetch(`/api/images?${params.toString()}`);

        if (!response.ok) {
          return {
            success: false,
            message: "Failed to fetch images from library",
          };
        }

        const data = await response.json();
        const images = (data.images || []).slice(0, 10); // Limit to 10 results

        return {
          success: true,
          message: `Found ${images.length} images${args.category ? ` in category "${args.category}"` : ""}`,
          data: {
            images: images.map((img: { url: string; name: string; category: string }) => ({
              url: img.url,
              name: img.name,
              category: img.category,
            })),
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `Image search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },

    getComponentHelp: async (args: GetComponentHelpInput): Promise<ToolResult> => {
      try {
        const help = componentHelp[args.componentType];

        if (!help) {
          // Return generic help for unknown components
          return {
            success: true,
            message: `No detailed documentation for "${args.componentType}", but here's general guidance`,
            data: {
              componentType: args.componentType,
              description: `A ${args.componentType} component. Check the Properties Panel on the right to see available options.`,
              tips: [
                "Select the component to see its properties in the right panel",
                "All props can be edited in the Properties Panel",
                "Use undo (Ctrl+Z) if you make a mistake",
              ],
              availableComponents: Object.keys(componentHelp),
            },
          };
        }

        return {
          success: true,
          message: `Help for ${args.componentType} component`,
          data: {
            componentType: args.componentType,
            ...help,
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to get component help: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  };
}

// Helper to extract key props for summary
function getKeyProps(component: ComponentData): Record<string, unknown> {
  const keyPropsByType: Record<string, string[]> = {
    Heading: ["text", "level"],
    Text: ["text"],
    Button: ["text", "href"],
    Image: ["src", "alt"],
    Section: ["background"],
    Container: ["maxWidth"],
    Grid: ["columns"],
    Flex: ["direction", "justify"],
  };

  const keysToExtract = keyPropsByType[component.type] || [];
  const result: Record<string, unknown> = {};

  for (const key of keysToExtract) {
    if (component.props?.[key] !== undefined) {
      const value = component.props[key];
      // Truncate long text
      if (typeof value === "string" && value.length > 50) {
        result[key] = value.substring(0, 50) + "...";
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}

export type ToolExecutors = ReturnType<typeof createToolExecutors>;

/**
 * Create executor functions using a GETTER for state instead of static state.
 * This prevents stale closure issues when multiple tools execute in sequence.
 *
 * The getter is called fresh for each tool execution, ensuring we always
 * have the latest Puck state after previous tool calls have updated it.
 */
export function createToolExecutorsWithGetter(
  getAppState: () => { data: Data; ui: unknown },
  dispatch: (action: { type: string; [key: string]: unknown }) => void
) {
  return {
    addComponent: async (args: AddComponentInput): Promise<ToolResult> => {
      try {
        // CRITICAL: Get fresh state at execution time
        const appState = getAppState();

        const newComponent: ComponentData = {
          type: args.componentType,
          props: {
            id: generateId(),
            ...args.props,
          },
        };

        const newData = JSON.parse(JSON.stringify(appState.data)) as Data;

        if (args.parentId) {
          const found = findComponent(newData.content, args.parentId);
          if (!found) {
            return {
              success: false,
              message: `Parent component with ID "${args.parentId}" not found`,
            };
          }

          if (!Array.isArray(found.component.props.content)) {
            found.component.props.content = [];
          }

          if (args.position === "start") {
            found.component.props.content.unshift(newComponent);
          } else {
            found.component.props.content.push(newComponent);
          }
        } else {
          if (args.position === "start") {
            newData.content.unshift(newComponent);
          } else {
            newData.content.push(newComponent);
          }
        }

        dispatch({ type: "setData", data: newData });

        return {
          success: true,
          message: `Added ${args.componentType} component`,
          data: { componentId: newComponent.props.id },
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to add component: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },

    editComponent: async (args: EditComponentInput): Promise<ToolResult> => {
      try {
        const appState = getAppState();
        const newData = JSON.parse(JSON.stringify(appState.data)) as Data;
        const found = findComponent(newData.content, args.componentId);

        if (!found) {
          return {
            success: false,
            message: `Component with ID "${args.componentId}" not found`,
          };
        }

        found.component.props = {
          ...found.component.props,
          ...args.props,
        };

        dispatch({ type: "setData", data: newData });

        return {
          success: true,
          message: `Updated ${found.component.type} component`,
          data: { componentId: args.componentId },
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to edit component: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },

    removeComponent: async (args: RemoveComponentInput): Promise<ToolResult> => {
      try {
        const appState = getAppState();
        const newData = JSON.parse(JSON.stringify(appState.data)) as Data;
        const found = findComponent(newData.content, args.componentId);

        if (!found) {
          return {
            success: false,
            message: `Component with ID "${args.componentId}" not found`,
          };
        }

        const componentType = found.component.type;
        found.parent!.splice(found.index, 1);

        dispatch({ type: "setData", data: newData });

        return {
          success: true,
          message: `Removed ${componentType} component`,
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to remove component: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },

    moveComponent: async (args: MoveComponentInput): Promise<ToolResult> => {
      try {
        const appState = getAppState();
        const newData = JSON.parse(JSON.stringify(appState.data)) as Data;
        const found = findComponent(newData.content, args.componentId);

        if (!found) {
          return {
            success: false,
            message: `Component with ID "${args.componentId}" not found`,
          };
        }

        const [component] = found.parent!.splice(found.index, 1);

        let targetArray: ComponentData[];
        if (args.targetParentId) {
          const targetFound = findComponent(newData.content, args.targetParentId);
          if (!targetFound) {
            return {
              success: false,
              message: `Target parent with ID "${args.targetParentId}" not found`,
            };
          }
          if (!Array.isArray(targetFound.component.props.content)) {
            targetFound.component.props.content = [];
          }
          targetArray = targetFound.component.props.content;
        } else {
          targetArray = newData.content;
        }

        if (args.position === "start") {
          targetArray.unshift(component);
        } else if (args.position === "end" || args.position === undefined) {
          targetArray.push(component);
        } else if (typeof args.position === "number") {
          targetArray.splice(args.position, 0, component);
        }

        dispatch({ type: "setData", data: newData });

        return {
          success: true,
          message: `Moved ${component.type} component`,
          data: { componentId: args.componentId },
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to move component: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },

    duplicateComponent: async (args: DuplicateComponentInput): Promise<ToolResult> => {
      try {
        const appState = getAppState();
        const newData = JSON.parse(JSON.stringify(appState.data)) as Data;
        const found = findComponent(newData.content, args.componentId);

        if (!found) {
          return {
            success: false,
            message: `Component with ID "${args.componentId}" not found`,
          };
        }

        const cloned = cloneComponentWithNewIds(found.component);

        if (args.insertAfter) {
          found.parent!.splice(found.index + 1, 0, cloned);
        } else {
          found.parent!.push(cloned);
        }

        dispatch({ type: "setData", data: newData });

        return {
          success: true,
          message: `Duplicated ${found.component.type} component`,
          data: { newComponentId: cloned.props.id },
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to duplicate component: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },

    getPageState: async (args: GetPageStateInput): Promise<ToolResult> => {
      try {
        const appState = getAppState();

        if (args.includeFullTree) {
          return {
            success: true,
            message: "Retrieved full page state",
            data: appState.data,
          };
        }

        const components = flattenComponents(appState.data.content);
        const summary = components.map(({ component, path }) => ({
          id: component.props?.id,
          type: component.type,
          path: path.join(" > "),
          keyProps: getKeyProps(component),
        }));

        return {
          success: true,
          message: `Page has ${summary.length} components`,
          data: {
            rootTitle: appState.data.root?.props?.title,
            componentCount: summary.length,
            components: summary,
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to get page state: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },

    generateLayout: async (args: GenerateLayoutInput): Promise<ToolResult> => {
      try {
        const appState = getAppState();

        const prompts: Record<string, string> = {
          "hero-split": "Create a hero section with heading on the left and image on the right",
          "hero-centered": "Create a centered hero section with heading, subheading, and CTA button",
          "features-grid": "Create a features section with 3-4 feature cards in a grid",
          "pricing-table": "Create a pricing section with 3 pricing tiers",
          "testimonials": "Create a testimonials section with customer quotes",
          "cta-section": "Create a call-to-action section with heading and button",
          "custom": args.customPrompt || "Create a custom section",
        };

        const prompt = prompts[args.layoutType];

        const response = await fetch("/api/ai/generate-page", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, pageType: "custom" }),
        });

        if (!response.ok) {
          const error = await response.json();
          return {
            success: false,
            message: `Failed to generate layout: ${error.error || "Unknown error"}`,
          };
        }

        const result = await response.json();

        if (args.replaceAll) {
          dispatch({ type: "setData", data: result.data });
        } else {
          const newData = JSON.parse(JSON.stringify(appState.data)) as Data;
          newData.content.push(...result.data.content);
          dispatch({ type: "setData", data: newData });
        }

        return {
          success: true,
          message: `Generated ${args.layoutType} layout with ${result.data.content.length} components`,
          data: { componentsAdded: result.data.content.length },
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to generate layout: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },

    selectComponent: async (args: SelectComponentInput): Promise<ToolResult> => {
      try {
        const appState = getAppState();
        const found = findComponent(appState.data.content, args.componentId);

        if (!found) {
          return {
            success: false,
            message: `Component with ID "${args.componentId}" not found`,
          };
        }

        dispatch({
          type: "setUi",
          ui: {
            itemSelector: {
              index: found.index,
              zone: null,
            },
          },
        });

        return {
          success: true,
          message: `Selected ${found.component.type} component`,
          data: { componentId: args.componentId, componentType: found.component.type },
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to select component: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },

    searchImages: async (args: SearchImagesInput): Promise<ToolResult> => {
      try {
        const params = new URLSearchParams();
        if (args.category) params.set("category", args.category);
        if (args.search) params.set("search", args.search);

        const response = await fetch(`/api/images?${params.toString()}`);

        if (!response.ok) {
          return {
            success: false,
            message: "Failed to fetch images from library",
          };
        }

        const data = await response.json();
        const images = (data.images || []).slice(0, 10);

        return {
          success: true,
          message: `Found ${images.length} images${args.category ? ` in category "${args.category}"` : ""}`,
          data: {
            images: images.map((img: { url: string; name: string; category: string }) => ({
              url: img.url,
              name: img.name,
              category: img.category,
            })),
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `Image search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },

    getComponentHelp: async (args: GetComponentHelpInput): Promise<ToolResult> => {
      try {
        const help = componentHelp[args.componentType];

        if (!help) {
          return {
            success: true,
            message: `No detailed documentation for "${args.componentType}", but here's general guidance`,
            data: {
              componentType: args.componentType,
              description: `A ${args.componentType} component. Check the Properties Panel on the right to see available options.`,
              tips: [
                "Select the component to see its properties in the right panel",
                "All props can be edited in the Properties Panel",
                "Use undo (Ctrl+Z) if you make a mistake",
              ],
              availableComponents: Object.keys(componentHelp),
            },
          };
        }

        return {
          success: true,
          message: `Help for ${args.componentType} component`,
          data: {
            componentType: args.componentType,
            ...help,
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to get component help: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  };
}

export type ToolExecutorsWithGetter = ReturnType<typeof createToolExecutorsWithGetter>;
