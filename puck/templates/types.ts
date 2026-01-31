import { Data } from "@puckeditor/core";

// Component with nested zones support
export interface NestedComponent {
  type: string;
  props: Record<string, unknown>;
  zones?: Record<string, NestedComponent[]>;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: "marketing" | "dashboard" | "content" | "custom";
  thumbnail?: string;
  // The component structure this template creates
  structure: NestedComponent[];
}

export interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  // Style overrides to apply to template components
  styles: {
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
      textMuted: string;
    };
    typography: {
      headingFont?: string;
      bodyFont?: string;
      baseFontSize: string;
    };
    spacing: {
      sectionPadding: string;
      containerMaxWidth: string;
      elementGap: string;
    };
    borders: {
      radius: string;
      buttonRadius: string;
    };
  };
}

// Default preset for templates
export const defaultPreset: TemplatePreset = {
  id: "default",
  name: "Default",
  description: "Clean, modern default styling",
  styles: {
    colors: {
      primary: "#3b82f6",
      secondary: "#6b7280",
      accent: "#8b5cf6",
      background: "#ffffff",
      text: "#1a1a1a",
      textMuted: "#6b7280",
    },
    typography: {
      baseFontSize: "16px",
    },
    spacing: {
      sectionPadding: "64px",
      containerMaxWidth: "1200px",
      elementGap: "24px",
    },
    borders: {
      radius: "8px",
      buttonRadius: "8px",
    },
  },
};

// Helper to generate unique IDs for template components
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Puck's flat data structure
export interface FlattenedData {
  content: Array<{ type: string; props: Record<string, unknown> }>;
  zones: Record<string, Array<{ type: string; props: Record<string, unknown> }>>;
}

/**
 * Flattens nested template structure into Puck's expected flat zone format.
 *
 * Converts from:
 *   { type: "Section", props: { id: "sec1" }, zones: { content: [...children] } }
 *
 * To:
 *   content: [{ type: "Section", props: { id: "sec1" } }]
 *   zones: { "sec1:content": [...flattenedChildren] }
 */
export function flattenNestedComponents(components: NestedComponent[]): FlattenedData {
  const flatContent: FlattenedData["content"] = [];
  const flatZones: FlattenedData["zones"] = {};

  function processComponent(component: NestedComponent): { type: string; props: Record<string, unknown> } {
    const { zones, ...rest } = component;

    // If this component has zones, flatten them
    if (zones) {
      const componentId = component.props.id as string;

      for (const [zoneName, zoneComponents] of Object.entries(zones)) {
        const zoneKey = `${componentId}:${zoneName}`;
        flatZones[zoneKey] = [];

        for (const childComponent of zoneComponents) {
          // Recursively process the child
          const flatChild = processComponent(childComponent);
          flatZones[zoneKey].push(flatChild);
        }
      }
    }

    // Return the component without its zones property
    return rest as { type: string; props: Record<string, unknown> };
  }

  // Process each top-level component
  for (const component of components) {
    const flatComponent = processComponent(component);
    flatContent.push(flatComponent);
  }

  return { content: flatContent, zones: flatZones };
}
