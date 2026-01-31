import { Data } from "@puckeditor/core";
import { BrandPreset } from "./types";
import { NestedComponent } from "../templates/types";

type ComponentContent = Data["content"][number];

/**
 * Applies a brand preset to a template structure (nested format)
 * Transforms component props based on preset values
 */
export function applyPresetToTemplate(
  template: NestedComponent[],
  preset: BrandPreset
): NestedComponent[] {
  return template.map((component) => applyPresetToNestedComponent(component, preset));
}

function applyPresetToNestedComponent(
  component: NestedComponent,
  preset: BrandPreset
): NestedComponent {
  const newComponent: NestedComponent = {
    type: component.type,
    props: { ...component.props }
  };

  // Apply preset based on component type
  switch (component.type) {
    case "Section":
      newComponent.props = applySectionPreset(component.props, preset);
      break;
    case "Container":
      newComponent.props = applyContainerPreset(component.props, preset);
      break;
    case "Heading":
      newComponent.props = applyHeadingPreset(component.props, preset);
      break;
    case "Text":
      newComponent.props = applyTextPreset(component.props, preset);
      break;
    case "Button":
      newComponent.props = applyButtonPreset(component.props, preset);
      break;
    case "Grid":
      newComponent.props = applyGridPreset(component.props, preset);
      break;
    case "Columns":
      newComponent.props = applyColumnsPreset(component.props, preset);
      break;
    case "Row":
    case "Flex":
      newComponent.props = applyFlexPreset(component.props, preset);
      break;
  }

  // Recursively apply preset to nested zones
  if (component.zones) {
    const newZones: Record<string, NestedComponent[]> = {};
    for (const [zoneName, zoneContent] of Object.entries(component.zones)) {
      newZones[zoneName] = zoneContent.map((child) =>
        applyPresetToNestedComponent(child, preset)
      );
    }
    newComponent.zones = newZones;
  }

  return newComponent;
}

/**
 * Applies a brand preset to flat page content (Puck Data format)
 */
export function applyPresetToFlatContent(
  content: Data["content"],
  preset: BrandPreset
): Data["content"] {
  return content.map((component) => applyPresetToComponent(component, preset));
}

function applyPresetToComponent(
  component: ComponentContent,
  preset: BrandPreset
): ComponentContent {
  const newComponent = { ...component };

  // Apply preset based on component type
  switch (component.type) {
    case "Section":
      newComponent.props = applySectionPreset(component.props, preset);
      break;
    case "Container":
      newComponent.props = applyContainerPreset(component.props, preset);
      break;
    case "Heading":
      newComponent.props = applyHeadingPreset(component.props, preset);
      break;
    case "Text":
      newComponent.props = applyTextPreset(component.props, preset);
      break;
    case "Button":
      newComponent.props = applyButtonPreset(component.props, preset);
      break;
    case "Grid":
      newComponent.props = applyGridPreset(component.props, preset);
      break;
    case "Columns":
      newComponent.props = applyColumnsPreset(component.props, preset);
      break;
    case "Row":
    case "Flex":
      newComponent.props = applyFlexPreset(component.props, preset);
      break;
  }

  return newComponent;
}

// Component-specific preset applications
function applySectionPreset(props: Record<string, unknown>, preset: BrandPreset) {
  const bgColor = props.backgroundColor as string;

  // Detect if it's a dark section or light section and apply appropriate colors
  const isDark = isColorDark(bgColor);

  return {
    ...props,
    backgroundColor: isDark ? preset.colors.backgroundDark : preset.colors.backgroundAlt,
    paddingTop: preset.spacing.sectionPaddingY,
    paddingBottom: preset.spacing.sectionPaddingY,
    paddingLeft: preset.spacing.sectionPaddingX,
    paddingRight: preset.spacing.sectionPaddingX,
    maxWidth: preset.spacing.containerMaxWidth,
  };
}

function applyContainerPreset(props: Record<string, unknown>, preset: BrandPreset) {
  const hasBg = props.backgroundColor && props.backgroundColor !== "transparent";

  return {
    ...props,
    maxWidth: preset.spacing.containerMaxWidth,
    padding: preset.spacing.cardPadding,
    backgroundColor: hasBg ? preset.colors.backgroundAlt : "transparent",
    borderRadius: preset.borders.cardRadius,
    boxShadow: hasBg ? preset.shadows.card : "none",
  };
}

function applyHeadingPreset(props: Record<string, unknown>, preset: BrandPreset) {
  const level = props.level as string;
  const currentColor = props.color as string;
  const isOnDark = isColorLight(currentColor);

  // Get appropriate font size based on heading level
  const sizeMap: Record<string, string> = {
    h1: preset.typography.h1Size,
    h2: preset.typography.h2Size,
    h3: preset.typography.h3Size,
    h4: preset.typography.h4Size,
    h5: preset.typography.h4Size,
    h6: preset.typography.smallSize,
  };

  return {
    ...props,
    fontSize: sizeMap[level] || preset.typography.h2Size,
    fontWeight: preset.typography.headingWeight,
    color: isOnDark ? preset.colors.textOnDark : preset.colors.text,
    lineHeight: preset.typography.headingLineHeight,
  };
}

function applyTextPreset(props: Record<string, unknown>, preset: BrandPreset) {
  const currentColor = props.color as string;
  const isOnDark = isColorLight(currentColor);
  const isMuted = currentColor?.includes("9ca3af") || currentColor?.includes("6b7280");

  return {
    ...props,
    fontSize: preset.typography.bodySize,
    fontWeight: preset.typography.bodyWeight,
    color: isOnDark
      ? (isMuted ? preset.colors.textMuted : preset.colors.textOnDark)
      : (isMuted ? preset.colors.textMuted : preset.colors.text),
    lineHeight: preset.typography.bodyLineHeight,
  };
}

function applyButtonPreset(props: Record<string, unknown>, preset: BrandPreset) {
  const variant = props.variant as string;

  let buttonStyles: Record<string, string> = {};

  switch (variant) {
    case "primary":
      buttonStyles = {
        backgroundColor: preset.buttons.primaryBg,
        textColor: preset.buttons.primaryText,
      };
      break;
    case "secondary":
      buttonStyles = {
        backgroundColor: preset.buttons.secondaryBg,
        textColor: preset.buttons.secondaryText,
      };
      break;
    case "outline":
      buttonStyles = {
        backgroundColor: "transparent",
        textColor: preset.buttons.outlineText,
      };
      break;
    case "ghost":
      buttonStyles = {
        backgroundColor: "transparent",
        textColor: preset.buttons.outlineText,
      };
      break;
  }

  return {
    ...props,
    ...buttonStyles,
    borderRadius: preset.borders.buttonRadius,
  };
}

function applyGridPreset(props: Record<string, unknown>, preset: BrandPreset) {
  return {
    ...props,
    gap: preset.spacing.elementGap,
  };
}

function applyColumnsPreset(props: Record<string, unknown>, preset: BrandPreset) {
  return {
    ...props,
    gap: preset.spacing.elementGap,
  };
}

function applyFlexPreset(props: Record<string, unknown>, preset: BrandPreset) {
  return {
    ...props,
    gap: preset.spacing.elementGap,
  };
}

// Utility functions for color detection
function isColorDark(color: string): boolean {
  if (!color) return false;

  // Check for common dark color patterns
  if (color.includes("#1") || color.includes("#0") || color.includes("#2")) {
    const hex = color.replace("#", "");
    if (hex.length >= 2) {
      const r = parseInt(hex.slice(0, 2), 16);
      return r < 80;
    }
  }

  // Check for rgba with dark values
  if (color.includes("rgb")) {
    const match = color.match(/(\d+)/g);
    if (match && match.length >= 3) {
      const [r, g, b] = match.map(Number);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance < 0.5;
    }
  }

  return false;
}

function isColorLight(color: string): boolean {
  if (!color) return false;

  // Check for white/light colors
  if (color.includes("#f") || color.includes("#e") || color.includes("#d") || color.includes("#fff") || color.includes("#FFF")) {
    return true;
  }

  if (color.includes("rgb")) {
    const match = color.match(/(\d+)/g);
    if (match && match.length >= 3) {
      const [r, g, b] = match.map(Number);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.7;
    }
  }

  return false;
}

/**
 * Apply preset to existing page content (flat Puck Data format)
 */
export function applyPresetToPage(
  pageData: Data,
  preset: BrandPreset
): Data {
  return {
    ...pageData,
    content: applyPresetToFlatContent(pageData.content, preset),
  };
}
