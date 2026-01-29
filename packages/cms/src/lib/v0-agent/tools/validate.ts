/**
 * Validation Tool
 *
 * Validates Puck template structure and provides feedback
 */

import { AgentToolResult, ComponentNode, PuckPrimitive } from "../types";
import { listPrimitivesTool } from "./primitives";

interface ValidateTemplateInput {
  root: ComponentNode;
  strict?: boolean;
}

interface ValidationIssue {
  path: string;
  type: "error" | "warning";
  message: string;
  suggestion?: string;
}

interface ValidateTemplateOutput {
  valid: boolean;
  issues: ValidationIssue[];
  stats: {
    totalNodes: number;
    primitivesUsed: string[];
    maxDepth: number;
    hasSlots: boolean;
  };
}

interface SuggestMappingInput {
  jsxElement: string;
  attributes: Record<string, string>;
  children?: string;
}

interface SuggestMappingOutput {
  suggestedPrimitive: string;
  confidence: "high" | "medium" | "low";
  props: Record<string, unknown>;
  reasoning: string;
  alternatives?: string[];
}

/**
 * Tool to validate a Puck template structure
 */
export const validateTemplateTool = {
  name: "validate_puck_template",
  description: `Validates a Puck template structure for correctness.
Checks that all primitives exist, required props are present, and structure is valid.
Returns validation issues and suggestions for fixes.`,

  inputSchema: {
    type: "object" as const,
    properties: {
      root: {
        type: "object",
        description: "The root ComponentNode to validate",
      },
      strict: {
        type: "boolean",
        description: "Enable strict validation (warnings become errors)",
      },
    },
    required: ["root"],
  },

  async execute(
    input: ValidateTemplateInput
  ): Promise<AgentToolResult<ValidateTemplateOutput>> {
    try {
      const issues: ValidationIssue[] = [];
      const primitivesUsed = new Set<string>();
      let totalNodes = 0;
      let maxDepth = 0;
      let hasSlots = false;

      // Get available primitives
      const primitivesResult = await listPrimitivesTool.execute({});
      const availablePrimitives = primitivesResult.success
        ? primitivesResult.data!.primitives
        : [];
      const primitiveMap = new Map<string, PuckPrimitive>(
        availablePrimitives.map((p) => [p.name.toLowerCase(), p])
      );

      // Recursive validation
      function validateNode(node: ComponentNode, path: string, depth: number) {
        totalNodes++;
        maxDepth = Math.max(maxDepth, depth);

        // Check type exists
        if (!node.type) {
          issues.push({
            path,
            type: "error",
            message: "Missing component type",
            suggestion: "Every component must have a type property",
          });
          return;
        }

        primitivesUsed.add(node.type);

        // Check if primitive exists
        const primitive = primitiveMap.get(node.type.toLowerCase());
        if (!primitive) {
          issues.push({
            path,
            type: "error",
            message: `Unknown primitive: ${node.type}`,
            suggestion: `Available primitives: ${availablePrimitives
              .slice(0, 5)
              .map((p) => p.name)
              .join(", ")}...`,
          });
        } else {
          // Validate required props
          for (const propDef of primitive.props) {
            if (propDef.required && !(propDef.name in (node.props || {}))) {
              issues.push({
                path: `${path}.props.${propDef.name}`,
                type: "error",
                message: `Missing required prop: ${propDef.name}`,
                suggestion: `${propDef.name} (${propDef.type}): ${propDef.description}`,
              });
            }
          }

          // Validate prop types
          if (node.props) {
            for (const [propName, propValue] of Object.entries(node.props)) {
              const propDef = primitive.props.find((p) => p.name === propName);
              if (propDef) {
                const typeError = validatePropType(
                  propValue,
                  propDef.type,
                  propDef.options
                );
                if (typeError) {
                  issues.push({
                    path: `${path}.props.${propName}`,
                    type: input.strict ? "error" : "warning",
                    message: typeError,
                  });
                }
              } else {
                issues.push({
                  path: `${path}.props.${propName}`,
                  type: "warning",
                  message: `Unknown prop: ${propName} on ${node.type}`,
                  suggestion: `This prop may be ignored. Valid props: ${primitive.props
                    .map((p) => p.name)
                    .join(", ")}`,
                });
              }
            }
          }

          // Validate slots
          if (node.slots) {
            hasSlots = true;
            const validSlots = primitive.slots || [];

            for (const [slotName, children] of Object.entries(node.slots)) {
              if (!validSlots.includes(slotName)) {
                issues.push({
                  path: `${path}.slots.${slotName}`,
                  type: "warning",
                  message: `Unknown slot: ${slotName} on ${node.type}`,
                  suggestion: validSlots.length
                    ? `Valid slots: ${validSlots.join(", ")}`
                    : `${node.type} does not have slots`,
                });
              }

              if (Array.isArray(children)) {
                children.forEach((child, index) => {
                  validateNode(
                    child,
                    `${path}.slots.${slotName}[${index}]`,
                    depth + 1
                  );
                });
              }
            }
          }
        }
      }

      validateNode(input.root, "root", 0);

      // Check for excessive depth
      if (maxDepth > 10) {
        issues.push({
          path: "root",
          type: "warning",
          message: `Template is deeply nested (${maxDepth} levels)`,
          suggestion: "Consider flattening the structure for better performance",
        });
      }

      const hasErrors = issues.some((i) => i.type === "error");

      return {
        success: true,
        data: {
          valid: !hasErrors,
          issues,
          stats: {
            totalNodes,
            primitivesUsed: Array.from(primitivesUsed),
            maxDepth,
            hasSlots,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Validation failed: ${(error as Error).message}`,
      };
    }
  },
};

/**
 * Tool to suggest primitive mapping for a JSX element
 */
export const suggestMappingTool = {
  name: "suggest_primitive_mapping",
  description: `Suggests the best Puck primitive to use for a JSX element.
Analyzes the element tag, attributes, and classes to recommend a mapping.
Use this when unsure how to map a specific v0 element.`,

  inputSchema: {
    type: "object" as const,
    properties: {
      jsxElement: {
        type: "string",
        description: "The JSX element tag (e.g., 'div', 'h1', 'button')",
      },
      attributes: {
        type: "object",
        description: "Element attributes including className",
      },
      children: {
        type: "string",
        description: "Text content or description of children",
      },
    },
    required: ["jsxElement", "attributes"],
  },

  async execute(
    input: SuggestMappingInput
  ): Promise<AgentToolResult<SuggestMappingOutput>> {
    try {
      const { jsxElement, attributes, children } = input;
      const className = attributes.className || attributes.class || "";

      // Element-based mapping rules
      const elementMappings: Record<
        string,
        { primitive: string; confidence: "high" | "medium" | "low" }
      > = {
        h1: { primitive: "Heading", confidence: "high" },
        h2: { primitive: "Heading", confidence: "high" },
        h3: { primitive: "Heading", confidence: "high" },
        h4: { primitive: "Heading", confidence: "high" },
        h5: { primitive: "Heading", confidence: "high" },
        h6: { primitive: "Heading", confidence: "high" },
        p: { primitive: "Text", confidence: "high" },
        span: { primitive: "Text", confidence: "medium" },
        a: { primitive: "Link", confidence: "high" },
        button: { primitive: "Button", confidence: "high" },
        img: { primitive: "Image", confidence: "high" },
        video: { primitive: "Video", confidence: "high" },
        input: { primitive: "Input", confidence: "high" },
        textarea: { primitive: "Textarea", confidence: "high" },
        select: { primitive: "Select", confidence: "high" },
        ul: { primitive: "List", confidence: "high" },
        ol: { primitive: "List", confidence: "high" },
        hr: { primitive: "Divider", confidence: "high" },
        svg: { primitive: "Icon", confidence: "medium" },
      };

      // Check for direct mapping
      if (elementMappings[jsxElement.toLowerCase()]) {
        const mapping = elementMappings[jsxElement.toLowerCase()];
        const props = extractPropsFromAttributes(
          mapping.primitive,
          attributes,
          jsxElement,
          children
        );

        return {
          success: true,
          data: {
            suggestedPrimitive: mapping.primitive,
            confidence: mapping.confidence,
            props,
            reasoning: `${jsxElement} directly maps to ${mapping.primitive}`,
          },
        };
      }

      // For div/section, analyze classes to determine best mapping
      if (["div", "section", "article", "main", "aside", "nav"].includes(jsxElement.toLowerCase())) {
        const suggestion = analyzeContainerClasses(className);
        const props = extractPropsFromAttributes(
          suggestion.primitive,
          attributes,
          jsxElement,
          children
        );

        return {
          success: true,
          data: {
            suggestedPrimitive: suggestion.primitive,
            confidence: suggestion.confidence,
            props,
            reasoning: suggestion.reasoning,
            alternatives: suggestion.alternatives,
          },
        };
      }

      // Unknown element - suggest Container as fallback
      return {
        success: true,
        data: {
          suggestedPrimitive: "Container",
          confidence: "low",
          props: extractPropsFromAttributes("Container", attributes, jsxElement, children),
          reasoning: `Unknown element ${jsxElement} - using Container as fallback`,
          alternatives: ["Flex", "Section"],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Suggestion failed: ${(error as Error).message}`,
      };
    }
  },
};

/**
 * Helper functions
 */

function validatePropType(
  value: unknown,
  expectedType: string,
  options?: string[]
): string | null {
  switch (expectedType) {
    case "string":
      if (typeof value !== "string") {
        return `Expected string, got ${typeof value}`;
      }
      break;
    case "number":
      if (typeof value !== "number") {
        return `Expected number, got ${typeof value}`;
      }
      break;
    case "boolean":
      if (typeof value !== "boolean") {
        return `Expected boolean, got ${typeof value}`;
      }
      break;
    case "select":
      if (options && !options.includes(String(value))) {
        return `Invalid option: ${value}. Valid options: ${options.join(", ")}`;
      }
      break;
    case "array":
      if (!Array.isArray(value)) {
        return `Expected array, got ${typeof value}`;
      }
      break;
    case "object":
      if (typeof value !== "object" || value === null) {
        return `Expected object, got ${typeof value}`;
      }
      break;
  }
  return null;
}

function analyzeContainerClasses(className: string): {
  primitive: string;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  alternatives?: string[];
} {
  const classes = className.toLowerCase();

  // Check for flex patterns
  if (classes.includes("flex")) {
    return {
      primitive: "Flex",
      confidence: "high",
      reasoning: "Contains flex class - use Flex primitive",
    };
  }

  // Check for grid patterns
  if (classes.includes("grid")) {
    return {
      primitive: "Grid",
      confidence: "high",
      reasoning: "Contains grid class - use Grid primitive",
    };
  }

  // Check for section/full-width patterns
  if (
    classes.includes("w-full") ||
    classes.includes("min-h-screen") ||
    classes.includes("py-") ||
    classes.includes("px-")
  ) {
    return {
      primitive: "Section",
      confidence: "medium",
      reasoning: "Full-width container with padding - likely a Section",
      alternatives: ["Container"],
    };
  }

  // Check for card patterns
  if (
    classes.includes("rounded") &&
    (classes.includes("shadow") || classes.includes("border"))
  ) {
    return {
      primitive: "Card",
      confidence: "medium",
      reasoning: "Rounded with shadow/border - likely a Card",
      alternatives: ["Container"],
    };
  }

  // Default to Container
  return {
    primitive: "Container",
    confidence: "medium",
    reasoning: "Generic container element",
    alternatives: ["Flex", "Section", "Card"],
  };
}

function extractPropsFromAttributes(
  primitive: string,
  attributes: Record<string, string>,
  element: string,
  children?: string
): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  const className = attributes.className || attributes.class || "";

  // Extract common props based on primitive
  switch (primitive) {
    case "Heading":
      if (children) props.text = children;
      props.level = element.match(/h(\d)/)?.[1] || "2";
      if (className.includes("text-center")) props.align = "center";
      if (className.includes("text-right")) props.align = "right";
      break;

    case "Text":
      if (children) props.text = children;
      if (className.includes("text-center")) props.align = "center";
      if (className.includes("text-right")) props.align = "right";
      break;

    case "Button":
      if (children) props.text = children;
      if (attributes.href) props.href = attributes.href;
      break;

    case "Link":
      if (children) props.text = children;
      props.href = attributes.href || "#";
      if (attributes.target) props.target = attributes.target;
      break;

    case "Image":
      props.src = attributes.src || "";
      props.alt = attributes.alt || "";
      break;

    case "Container":
    case "Flex":
    case "Section":
      // Extract layout-related props from Tailwind classes
      const paddingMatch = className.match(/p-(\d+)/);
      if (paddingMatch) props.padding = paddingMatch[1];

      const roundedMatch = className.match(/rounded-?(\w+)?/);
      if (roundedMatch) props.rounded = roundedMatch[1] || "md";
      break;
  }

  return props;
}

export default { validateTemplateTool, suggestMappingTool };
