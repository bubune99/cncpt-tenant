import { VisibilitySettings } from "../fields/ResponsiveVisibility";

// Default visibility - visible on all devices
export const defaultVisibility: VisibilitySettings = {
  mobile: true,
  tablet: true,
  desktop: true,
};

/**
 * Get CSS class names for responsive visibility
 * Returns array of class names to apply to element
 */
export function getVisibilityClasses(visibility?: VisibilitySettings): string[] {
  if (!visibility) return [];

  const classes: string[] = [];

  // Add hide classes for devices where visibility is false
  if (!visibility.mobile) {
    classes.push("hide-on-mobile");
  }
  if (!visibility.tablet) {
    classes.push("hide-on-tablet");
  }
  if (!visibility.desktop) {
    classes.push("hide-on-desktop");
  }

  return classes;
}

/**
 * Get a single class string for responsive visibility
 */
export function getVisibilityClassName(visibility?: VisibilitySettings): string {
  return getVisibilityClasses(visibility).join(" ");
}

/**
 * Check if element should be visible on current device
 * This is useful for SSR/server rendering
 */
export function isVisibleOnDevice(
  visibility: VisibilitySettings | undefined,
  device: "mobile" | "tablet" | "desktop"
): boolean {
  if (!visibility) return true;
  return visibility[device] !== false;
}

/**
 * Breakpoint values for reference
 * Mobile: 0 - 639px
 * Tablet: 640px - 1023px
 * Desktop: 1024px+
 */
export const breakpoints = {
  mobile: { max: 639 },
  tablet: { min: 640, max: 1023 },
  desktop: { min: 1024 },
};
