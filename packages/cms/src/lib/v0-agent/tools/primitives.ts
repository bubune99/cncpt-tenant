/**
 * Puck Primitives Tool
 *
 * Provides information about available Puck components/primitives
 * that v0 components can be mapped to.
 */

import { AgentToolResult, PuckPrimitive, PuckPropDefinition } from "../types";

interface GetPrimitivesInput {
  category?: string;
  search?: string;
}

interface GetPrimitivesOutput {
  primitives: PuckPrimitive[];
  categories: string[];
}

interface GetPrimitiveInput {
  name: string;
}

/**
 * Tool to list available primitives
 */
export const listPrimitivesTool = {
  name: "list_puck_primitives",
  description: `Lists all available Puck primitives (components) that v0 elements can be mapped to.
Returns component names, their props, and what they're used for.
Use this to understand what building blocks are available for conversion.`,

  inputSchema: {
    type: "object" as const,
    properties: {
      category: {
        type: "string",
        description:
          "Filter by category (e.g., 'layout', 'content', 'form', 'media')",
      },
      search: {
        type: "string",
        description: "Search primitives by name or description",
      },
    },
    required: [],
  },

  async execute(
    input: GetPrimitivesInput
  ): Promise<AgentToolResult<GetPrimitivesOutput>> {
    try {
      let primitives = getAllPrimitives();

      // Filter by category
      if (input.category) {
        primitives = primitives.filter(
          (p) => p.category.toLowerCase() === input.category!.toLowerCase()
        );
      }

      // Search
      if (input.search) {
        const searchLower = input.search.toLowerCase();
        primitives = primitives.filter(
          (p) =>
            p.name.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower)
        );
      }

      // Get unique categories
      const categories = [
        ...new Set(getAllPrimitives().map((p) => p.category)),
      ];

      return {
        success: true,
        data: {
          primitives,
          categories,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to list primitives: ${(error as Error).message}`,
      };
    }
  },
};

/**
 * Tool to get details about a specific primitive
 */
export const getPrimitiveTool = {
  name: "get_puck_primitive",
  description: `Gets detailed information about a specific Puck primitive.
Returns full prop definitions, slots, and usage examples.
Use this when you need to know exactly how to configure a specific component.`,

  inputSchema: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description: "The primitive name (e.g., 'Heading', 'Container')",
      },
    },
    required: ["name"],
  },

  async execute(
    input: GetPrimitiveInput
  ): Promise<AgentToolResult<PuckPrimitive>> {
    try {
      const primitive = getAllPrimitives().find(
        (p) => p.name.toLowerCase() === input.name.toLowerCase()
      );

      if (!primitive) {
        return {
          success: false,
          error: `Primitive '${input.name}' not found. Use list_puck_primitives to see available options.`,
        };
      }

      return {
        success: true,
        data: primitive,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get primitive: ${(error as Error).message}`,
      };
    }
  },
};

/**
 * Get all available Puck primitives
 * This should ideally be loaded from the actual Puck config
 */
function getAllPrimitives(): PuckPrimitive[] {
  return [
    // Layout primitives
    {
      name: "Container",
      description:
        "A flexible container with padding, margin, and background options. Use for grouping content.",
      category: "layout",
      props: [
        prop("padding", "string", "Padding size (0-12 or Tailwind class)", false, "4"),
        prop("margin", "string", "Margin size", false, "0"),
        prop("background", "color", "Background color", false),
        prop("rounded", "select", "Border radius", false, "none", [
          "none",
          "sm",
          "md",
          "lg",
          "xl",
          "full",
        ]),
        prop("border", "boolean", "Show border", false, false),
        prop("shadow", "select", "Box shadow", false, "none", [
          "none",
          "sm",
          "md",
          "lg",
          "xl",
        ]),
        prop("maxWidth", "select", "Maximum width", false, "none", [
          "none",
          "sm",
          "md",
          "lg",
          "xl",
          "2xl",
          "full",
        ]),
      ],
      slots: ["content"],
    },
    {
      name: "Flex",
      description: "Flexbox container for horizontal or vertical layouts.",
      category: "layout",
      props: [
        prop("direction", "select", "Flex direction", false, "row", [
          "row",
          "column",
          "row-reverse",
          "column-reverse",
        ]),
        prop("justify", "select", "Justify content", false, "start", [
          "start",
          "center",
          "end",
          "between",
          "around",
          "evenly",
        ]),
        prop("align", "select", "Align items", false, "stretch", [
          "start",
          "center",
          "end",
          "stretch",
          "baseline",
        ]),
        prop("gap", "string", "Gap between items", false, "4"),
        prop("wrap", "boolean", "Allow wrapping", false, false),
      ],
      slots: ["children"],
    },
    {
      name: "Grid",
      description: "CSS Grid container for complex layouts.",
      category: "layout",
      props: [
        prop("columns", "number", "Number of columns", false, 2),
        prop("gap", "string", "Gap between items", false, "4"),
        prop("columnsMd", "number", "Columns on medium screens", false),
        prop("columnsLg", "number", "Columns on large screens", false),
      ],
      slots: ["children"],
    },
    {
      name: "Section",
      description: "Full-width section with optional background and padding.",
      category: "layout",
      props: [
        prop("paddingY", "string", "Vertical padding", false, "16"),
        prop("paddingX", "string", "Horizontal padding", false, "4"),
        prop("background", "color", "Background color", false),
        prop("backgroundImage", "string", "Background image URL", false),
        prop("overlay", "boolean", "Show dark overlay on background", false, false),
        prop("maxWidth", "select", "Content max width", false, "6xl", [
          "sm",
          "md",
          "lg",
          "xl",
          "2xl",
          "4xl",
          "6xl",
          "full",
        ]),
      ],
      slots: ["content"],
    },

    // Content primitives
    {
      name: "Heading",
      description: "Text heading (h1-h6) with size and style options.",
      category: "content",
      props: [
        prop("text", "string", "Heading text content", true),
        prop("level", "select", "Heading level (h1-h6)", false, "2", [
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
        ]),
        prop("size", "select", "Text size", false, "2xl", [
          "xs",
          "sm",
          "base",
          "lg",
          "xl",
          "2xl",
          "3xl",
          "4xl",
          "5xl",
        ]),
        prop("weight", "select", "Font weight", false, "bold", [
          "normal",
          "medium",
          "semibold",
          "bold",
          "extrabold",
        ]),
        prop("color", "color", "Text color", false),
        prop("align", "select", "Text alignment", false, "left", [
          "left",
          "center",
          "right",
        ]),
      ],
    },
    {
      name: "Text",
      description: "Paragraph or span text with styling options.",
      category: "content",
      props: [
        prop("text", "string", "Text content", true),
        prop("size", "select", "Text size", false, "base", [
          "xs",
          "sm",
          "base",
          "lg",
          "xl",
        ]),
        prop("color", "color", "Text color", false),
        prop("weight", "select", "Font weight", false, "normal", [
          "normal",
          "medium",
          "semibold",
          "bold",
        ]),
        prop("align", "select", "Text alignment", false, "left", [
          "left",
          "center",
          "right",
        ]),
        prop("leading", "select", "Line height", false, "normal", [
          "tight",
          "snug",
          "normal",
          "relaxed",
          "loose",
        ]),
      ],
    },
    {
      name: "RichText",
      description: "Rich text content with HTML/markdown support.",
      category: "content",
      props: [
        prop("content", "string", "HTML or markdown content", true),
        prop("format", "select", "Content format", false, "html", [
          "html",
          "markdown",
        ]),
      ],
    },
    {
      name: "List",
      description: "Ordered or unordered list.",
      category: "content",
      props: [
        prop("items", "array", "List items", true),
        prop("type", "select", "List type", false, "unordered", [
          "ordered",
          "unordered",
        ]),
        prop("icon", "string", "Custom icon for list items", false),
      ],
    },

    // Interactive primitives
    {
      name: "Button",
      description: "Clickable button with various styles.",
      category: "interactive",
      props: [
        prop("text", "string", "Button text", true),
        prop("variant", "select", "Button style", false, "primary", [
          "primary",
          "secondary",
          "outline",
          "ghost",
          "link",
        ]),
        prop("size", "select", "Button size", false, "md", [
          "sm",
          "md",
          "lg",
        ]),
        prop("href", "string", "Link URL (makes button a link)", false),
        prop("fullWidth", "boolean", "Full width button", false, false),
        prop("icon", "string", "Icon name", false),
        prop("iconPosition", "select", "Icon position", false, "left", [
          "left",
          "right",
        ]),
      ],
    },
    {
      name: "Link",
      description: "Text link to another page or URL.",
      category: "interactive",
      props: [
        prop("text", "string", "Link text", true),
        prop("href", "string", "URL to link to", true),
        prop("target", "select", "Link target", false, "_self", [
          "_self",
          "_blank",
        ]),
        prop("color", "color", "Link color", false),
        prop("underline", "boolean", "Show underline", false, true),
      ],
    },

    // Media primitives
    {
      name: "Image",
      description: "Responsive image with optional caption.",
      category: "media",
      props: [
        prop("src", "string", "Image URL", true),
        prop("alt", "string", "Alt text for accessibility", true),
        prop("width", "number", "Image width", false),
        prop("height", "number", "Image height", false),
        prop("objectFit", "select", "How image fits container", false, "cover", [
          "cover",
          "contain",
          "fill",
          "none",
        ]),
        prop("rounded", "select", "Border radius", false, "none", [
          "none",
          "sm",
          "md",
          "lg",
          "full",
        ]),
        prop("caption", "string", "Image caption", false),
      ],
    },
    {
      name: "Icon",
      description: "SVG icon from icon library.",
      category: "media",
      props: [
        prop("name", "string", "Icon name from library", true),
        prop("size", "select", "Icon size", false, "md", [
          "xs",
          "sm",
          "md",
          "lg",
          "xl",
        ]),
        prop("color", "color", "Icon color", false),
      ],
    },
    {
      name: "Video",
      description: "Embedded video player.",
      category: "media",
      props: [
        prop("src", "string", "Video URL or embed code", true),
        prop("type", "select", "Video type", false, "url", [
          "url",
          "youtube",
          "vimeo",
          "embed",
        ]),
        prop("autoplay", "boolean", "Autoplay video", false, false),
        prop("controls", "boolean", "Show controls", false, true),
        prop("loop", "boolean", "Loop video", false, false),
        prop("muted", "boolean", "Mute video", false, false),
      ],
    },

    // Card primitives
    {
      name: "Card",
      description: "Card component with optional header, body, and footer.",
      category: "card",
      props: [
        prop("variant", "select", "Card style", false, "elevated", [
          "elevated",
          "outlined",
          "filled",
        ]),
        prop("padding", "string", "Inner padding", false, "4"),
        prop("rounded", "select", "Border radius", false, "lg", [
          "none",
          "sm",
          "md",
          "lg",
          "xl",
        ]),
      ],
      slots: ["header", "body", "footer"],
    },
    {
      name: "Badge",
      description: "Small badge or tag for labels.",
      category: "card",
      props: [
        prop("text", "string", "Badge text", true),
        prop("variant", "select", "Badge style", false, "default", [
          "default",
          "primary",
          "secondary",
          "success",
          "warning",
          "error",
        ]),
        prop("size", "select", "Badge size", false, "md", ["sm", "md", "lg"]),
      ],
    },

    // Form primitives
    {
      name: "Input",
      description: "Text input field.",
      category: "form",
      props: [
        prop("label", "string", "Input label", false),
        prop("placeholder", "string", "Placeholder text", false),
        prop("type", "select", "Input type", false, "text", [
          "text",
          "email",
          "password",
          "number",
          "tel",
          "url",
        ]),
        prop("required", "boolean", "Is required", false, false),
        prop("disabled", "boolean", "Is disabled", false, false),
      ],
    },
    {
      name: "Textarea",
      description: "Multi-line text input.",
      category: "form",
      props: [
        prop("label", "string", "Input label", false),
        prop("placeholder", "string", "Placeholder text", false),
        prop("rows", "number", "Number of rows", false, 4),
        prop("required", "boolean", "Is required", false, false),
      ],
    },
    {
      name: "Select",
      description: "Dropdown select input.",
      category: "form",
      props: [
        prop("label", "string", "Select label", false),
        prop("options", "array", "Select options", true),
        prop("placeholder", "string", "Placeholder text", false),
        prop("required", "boolean", "Is required", false, false),
      ],
    },
    {
      name: "Checkbox",
      description: "Checkbox input.",
      category: "form",
      props: [
        prop("label", "string", "Checkbox label", true),
        prop("checked", "boolean", "Is checked", false, false),
        prop("disabled", "boolean", "Is disabled", false, false),
      ],
    },

    // Utility primitives
    {
      name: "Spacer",
      description: "Adds vertical or horizontal space.",
      category: "utility",
      props: [
        prop("size", "string", "Space size (Tailwind spacing)", false, "4"),
        prop("direction", "select", "Space direction", false, "vertical", [
          "vertical",
          "horizontal",
        ]),
      ],
    },
    {
      name: "Divider",
      description: "Horizontal or vertical divider line.",
      category: "utility",
      props: [
        prop("direction", "select", "Divider direction", false, "horizontal", [
          "horizontal",
          "vertical",
        ]),
        prop("color", "color", "Divider color", false),
        prop("thickness", "string", "Line thickness", false, "1"),
      ],
    },
  ];
}

/**
 * Helper to create prop definitions
 */
function prop(
  name: string,
  type: PuckPropDefinition["type"],
  description: string,
  required: boolean,
  defaultValue?: unknown,
  options?: string[]
): PuckPropDefinition {
  return {
    name,
    type,
    description,
    required,
    default: defaultValue,
    options,
  };
}

export default { listPrimitivesTool, getPrimitiveTool };
