/**
 * Theme Extractor
 *
 * Extracts fonts and color theme information from layout.tsx and globals.css.
 * Parses Google Font imports and CSS custom property definitions.
 */

export interface ThemeInfo {
  fonts: {
    serif?: string;
    sans?: string;
    mono?: string;
  };
  colors: Record<string, string>;
}

/**
 * Extract theme information from layout and CSS files.
 */
export function extractTheme(
  globalsCss: { content: string } | null,
  layoutFile: { content: string } | null
): ThemeInfo {
  const theme: ThemeInfo = {
    fonts: {},
    colors: {},
  };

  if (layoutFile) {
    extractFonts(layoutFile.content, theme);
  }

  if (globalsCss) {
    extractColors(globalsCss.content, theme);
  }

  return theme;
}

/**
 * Extract Google Font information from layout.tsx.
 *
 * Patterns:
 * - import { Playfair_Display, Lato } from "next/font/google"
 * - const serif = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" })
 */
function extractFonts(layoutSource: string, theme: ThemeInfo) {
  // Find next/font/google imports
  const importMatch = layoutSource.match(
    /import\s+\{([^}]+)\}\s+from\s+["']next\/font\/google["']/
  );
  if (!importMatch) return;

  const importedFonts = importMatch[1]
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);

  // Find font instantiation patterns:
  // const serif = Playfair_Display({ ... variable: "--font-serif" })
  // const lato = Lato({ ... variable: "--font-lato" })
  for (const fontName of importedFonts) {
    // Match: const varName = FontName({ ... variable: "--font-xxx" ... })
    const instantiationRegex = new RegExp(
      `const\\s+(\\w+)\\s*=\\s*${escapeRegex(fontName)}\\s*\\(\\s*\\{([^}]*)\\}`,
      "s"
    );
    const match = layoutSource.match(instantiationRegex);
    if (!match) continue;

    const varName = match[1];
    const configBody = match[2];

    // Extract CSS variable name
    const variableMatch = configBody.match(/variable:\s*["']([^"']+)["']/);
    const cssVariable = variableMatch ? variableMatch[1] : null;

    // Convert underscore font names to display names: Playfair_Display → Playfair Display
    const displayName = fontName.replace(/_/g, " ");

    // Determine font category from variable name or common heuristics
    const category = detectFontCategory(varName, cssVariable, displayName);
    if (category) {
      theme.fonts[category] = displayName;
    }
  }
}

/**
 * Detect font category (serif, sans, mono) from variable name or font name.
 */
function detectFontCategory(
  varName: string,
  cssVariable: string | null,
  displayName: string
): "serif" | "sans" | "mono" | null {
  const lowerVar = varName.toLowerCase();
  const lowerCss = (cssVariable || "").toLowerCase();
  const lowerDisplay = displayName.toLowerCase();

  // Check variable names
  if (lowerVar.includes("serif") || lowerCss.includes("serif")) return "serif";
  if (lowerVar.includes("sans") || lowerCss.includes("sans")) return "sans";
  if (lowerVar.includes("mono") || lowerCss.includes("mono")) return "mono";
  if (lowerVar.includes("heading") || lowerVar.includes("display") || lowerVar.includes("title")) return "serif";
  if (lowerVar.includes("body") || lowerVar.includes("text") || lowerVar.includes("content")) return "sans";

  // Well-known serif fonts
  const serifFonts = [
    "playfair", "merriweather", "lora", "crimson", "garamond",
    "cormorant", "libre baskerville", "pt serif", "bitter",
    "source serif", "noto serif", "eb garamond", "spectral",
  ];
  if (serifFonts.some((f) => lowerDisplay.includes(f))) return "serif";

  // Well-known mono fonts
  const monoFonts = [
    "fira code", "jetbrains", "source code", "roboto mono",
    "ibm plex mono", "space mono", "ubuntu mono", "inconsolata",
  ];
  if (monoFonts.some((f) => lowerDisplay.includes(f))) return "mono";

  // Default to sans for common sans-serif fonts
  const sansFonts = [
    "inter", "lato", "roboto", "open sans", "montserrat", "poppins",
    "nunito", "raleway", "work sans", "dm sans", "plus jakarta",
    "manrope", "outfit", "geist", "sora", "lexend",
  ];
  if (sansFonts.some((f) => lowerDisplay.includes(f))) return "sans";

  return null;
}

/**
 * Extract CSS custom property colors from globals.css.
 *
 * Pattern: :root { --variable: value; }
 * Handles HSL triplets like: --primary: 16 30% 22%
 */
function extractColors(cssSource: string, theme: ThemeInfo) {
  // Match :root block (handle both :root and .dark variants)
  const rootBlockRegex = /:root\s*\{([^}]+)\}/g;
  let match;

  while ((match = rootBlockRegex.exec(cssSource)) !== null) {
    const block = match[1];
    parseColorBlock(block, theme);
  }

  // Also check for @layer base { :root { ... } } pattern
  const layerMatch = cssSource.match(
    /@layer\s+base\s*\{[\s\S]*?:root\s*\{([^}]+)\}/
  );
  if (layerMatch) {
    parseColorBlock(layerMatch[1], theme);
  }
}

function parseColorBlock(block: string, theme: ThemeInfo) {
  // Match --variable: value lines
  const varRegex = /--([a-zA-Z][\w-]*)\s*:\s*([^;]+);/g;
  let match;

  while ((match = varRegex.exec(block)) !== null) {
    const [, name, rawValue] = match;
    const value = rawValue.trim();

    // Skip non-color variables (spacing, radius, etc.)
    if (isColorVariable(name)) {
      theme.colors[name] = normalizeColorValue(value);
    }
  }
}

/**
 * Determine if a CSS variable name is likely a color.
 */
function isColorVariable(name: string): boolean {
  const colorNames = [
    "background", "foreground",
    "primary", "primary-foreground",
    "secondary", "secondary-foreground",
    "muted", "muted-foreground",
    "accent", "accent-foreground",
    "destructive", "destructive-foreground",
    "card", "card-foreground",
    "popover", "popover-foreground",
    "border", "input", "ring",
    "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
    "sidebar-background", "sidebar-foreground",
    "sidebar-primary", "sidebar-primary-foreground",
    "sidebar-accent", "sidebar-accent-foreground",
    "sidebar-border", "sidebar-ring",
  ];

  return colorNames.includes(name) || name.endsWith("-foreground") || name.endsWith("-background");
}

/**
 * Normalize color values.
 * Converts HSL triplets (16 30% 22%) to hsl(16, 30%, 22%).
 * Passes through hex, rgb(), hsl() as-is.
 */
function normalizeColorValue(value: string): string {
  // Already in function form
  if (value.startsWith("hsl(") || value.startsWith("rgb(") || value.startsWith("#") || value.startsWith("oklch(")) {
    return value;
  }

  // HSL triplet without function wrapper: "16 30% 22%"
  const hslTriplet = value.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?%)\s+(\d+(?:\.\d+)?%)$/);
  if (hslTriplet) {
    return `hsl(${hslTriplet[1]}, ${hslTriplet[2]}, ${hslTriplet[3]})`;
  }

  // OKLCH triplet without function wrapper
  const oklchTriplet = value.match(/^(\d+(?:\.\d+)?(?:%)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/);
  if (oklchTriplet) {
    return `oklch(${oklchTriplet[1]} ${oklchTriplet[2]} ${oklchTriplet[3]})`;
  }

  return value;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
