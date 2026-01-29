/**
 * v0 to Puck Component Converter
 *
 * Converts parsed v0 components to Puck ComponentConfig format.
 */

import {
  ParsedV0Component,
  ParsedProp,
  PuckComponentConfig,
  PuckField,
  PuckFieldType,
} from "./types";

/**
 * Convert parsed v0 component to Puck ComponentConfig
 */
export function convertToPuckConfig(
  parsed: ParsedV0Component
): PuckComponentConfig {
  const fields: Record<string, PuckField> = {};
  const defaultProps: Record<string, unknown> = {};

  // Convert each prop to a Puck field
  for (const prop of parsed.props) {
    // Skip children and className props - handled specially
    if (prop.name === "children" || prop.name === "className") continue;

    const field = convertPropToField(prop);
    if (field) {
      fields[prop.name] = field;
      if (prop.defaultValue !== undefined) {
        defaultProps[prop.name] = prop.defaultValue;
      }
    }
  }

  // Add common fields
  if (!fields.className) {
    fields.className = {
      type: "text",
      label: "Additional Classes",
      placeholder: "Add custom Tailwind classes...",
    };
    defaultProps.className = "";
  }

  return {
    label: parsed.displayName,
    fields,
    defaultProps,
    render: createRenderFunction(parsed),
  };
}

/**
 * Convert a parsed prop to a Puck field
 */
function convertPropToField(prop: ParsedProp): PuckField | null {
  const baseField: Partial<PuckField> = {
    label: formatLabel(prop.name),
  };

  if (prop.defaultValue !== undefined) {
    baseField.defaultValue = prop.defaultValue;
  }

  switch (prop.type) {
    case "string":
      return {
        ...baseField,
        type: "text",
      } as PuckField;

    case "number":
      return {
        ...baseField,
        type: "number",
      } as PuckField;

    case "boolean":
      return {
        ...baseField,
        type: "radio",
        options: [
          { label: "Yes", value: "true" },
          { label: "No", value: "false" },
        ],
      } as PuckField;

    case "select":
      if (prop.options) {
        return {
          ...baseField,
          type: "select",
          options: prop.options.map((opt) => ({
            label: formatLabel(opt),
            value: opt,
          })),
        } as PuckField;
      }
      return {
        ...baseField,
        type: "text",
      } as PuckField;

    case "color":
      return {
        ...baseField,
        type: "custom",
        // Custom color picker would be implemented separately
      } as PuckField;

    case "object":
      return {
        ...baseField,
        type: "object",
      } as PuckField;

    case "array":
      return {
        ...baseField,
        type: "array",
      } as PuckField;

    case "function":
    case "node":
      // Skip function and node props - they can't be configured in UI
      return null;

    default:
      return {
        ...baseField,
        type: "text",
      } as PuckField;
  }
}

/**
 * Format prop name to display label
 */
function formatLabel(name: string): string {
  return name
    // Insert space before uppercase letters
    .replace(/([A-Z])/g, " $1")
    // Capitalize first letter
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Create the render function for Puck
 */
function createRenderFunction(
  parsed: ParsedV0Component
): (props: Record<string, unknown>) => React.ReactNode {
  // Return a function that renders the component
  // This will be converted to a string for storage and eval'd at runtime
  return function V0Component(props: Record<string, unknown>) {
    // This is a placeholder - actual rendering will use the stored source code
    return null;
  };
}

/**
 * Generate component wrapper code that can be eval'd
 */
export function generateComponentWrapper(parsed: ParsedV0Component): string {
  const componentName = parsed.name;

  // Generate the wrapper code
  return `
// Auto-generated wrapper for v0 component: ${componentName}
import React from "react";

${parsed.sourceCode}

export function ${componentName}Wrapper(props) {
  return React.createElement(${componentName}, props);
}
`.trim();
}

/**
 * Generate Puck config as a string for storage
 */
export function generatePuckConfigString(
  parsed: ParsedV0Component,
  config: PuckComponentConfig
): string {
  const fieldsJson = JSON.stringify(config.fields, null, 2);
  const defaultPropsJson = JSON.stringify(config.defaultProps, null, 2);

  return `{
  "label": "${config.label}",
  "fields": ${fieldsJson},
  "defaultProps": ${defaultPropsJson},
  "componentName": "${parsed.name}",
  "sourceCode": ${JSON.stringify(parsed.sourceCode)}
}`;
}

/**
 * Create a Puck-compatible component from stored config
 */
export function createPuckComponent(
  storedConfig: string
): PuckComponentConfig | null {
  try {
    const config = JSON.parse(storedConfig);

    // Create the render function from source code
    // This uses Function constructor to create component at runtime
    const renderFn = (props: Record<string, unknown>) => {
      // Placeholder - actual implementation would use React.createElement
      // with the component defined in sourceCode
      return null;
    };

    return {
      label: config.label,
      fields: config.fields,
      defaultProps: config.defaultProps,
      render: renderFn,
    };
  } catch (error) {
    console.error("Failed to create Puck component from config:", error);
    return null;
  }
}

/**
 * Analyze component for potential issues
 */
export function analyzeComponent(parsed: ParsedV0Component): {
  complexity: "simple" | "moderate" | "complex";
  suggestions: string[];
  requiredSetup: string[];
} {
  const suggestions: string[] = [];
  const requiredSetup: string[] = [];

  // Check dependencies
  const needsInstall = parsed.dependencies.filter(
    (dep) => !isBuiltInDependency(dep)
  );
  if (needsInstall.length > 0) {
    requiredSetup.push(`Install dependencies: npm install ${needsInstall.join(" ")}`);
  }

  // Check for relative imports
  const relativeImports = parsed.imports.filter((imp) => imp.isRelative);
  if (relativeImports.length > 0) {
    suggestions.push(
      "Component has relative imports that may need to be updated or inlined"
    );
  }

  // Check Tailwind classes
  const customClasses = parsed.tailwindClasses.filter(
    (cls) => cls.includes("[") // Arbitrary values
  );
  if (customClasses.length > 0) {
    suggestions.push(
      "Component uses arbitrary Tailwind values - ensure your tailwind.config supports them"
    );
  }

  // Determine complexity
  let complexity: "simple" | "moderate" | "complex" = "simple";
  if (parsed.props.length > 5 || parsed.dependencies.length > 3) {
    complexity = "moderate";
  }
  if (
    parsed.props.some((p) => p.type === "function" || p.type === "object") ||
    relativeImports.length > 2
  ) {
    complexity = "complex";
  }

  return { complexity, suggestions, requiredSetup };
}

/**
 * Check if dependency is built-in (doesn't need installation)
 */
function isBuiltInDependency(dep: string): boolean {
  const builtIn = [
    "react",
    "react-dom",
    "next",
    "next/image",
    "next/link",
    "next/router",
    "next/navigation",
  ];
  return builtIn.includes(dep);
}
