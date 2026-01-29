import { BrandPreset } from "./types";

// Modern Blue - Clean SaaS style
export const modernBlue: BrandPreset = {
  id: "modern-blue",
  name: "Modern Blue",
  description: "Clean, professional SaaS aesthetic",

  colors: {
    primary: "#3b82f6",
    primaryHover: "#2563eb",
    secondary: "#6b7280",
    secondaryHover: "#4b5563",
    accent: "#8b5cf6",

    background: "#ffffff",
    backgroundAlt: "#f8fafc",
    backgroundDark: "#1e293b",

    text: "#1e293b",
    textMuted: "#64748b",
    textOnPrimary: "#ffffff",
    textOnDark: "#f1f5f9",

    border: "#e2e8f0",
    borderLight: "#f1f5f9",
    shadow: "rgba(0,0,0,0.1)",
  },

  typography: {
    headingFont: "system-ui, -apple-system, sans-serif",
    bodyFont: "system-ui, -apple-system, sans-serif",
    h1Size: "48px",
    h2Size: "36px",
    h3Size: "24px",
    h4Size: "20px",
    bodySize: "16px",
    smallSize: "14px",
    headingWeight: "700",
    bodyWeight: "400",
    boldWeight: "600",
    headingLineHeight: "1.2",
    bodyLineHeight: "1.6",
  },

  spacing: {
    sectionPaddingY: "80px",
    sectionPaddingX: "24px",
    containerMaxWidth: "1200px",
    elementGap: "24px",
    cardPadding: "24px",
  },

  borders: {
    radius: "8px",
    radiusLg: "16px",
    radiusFull: "9999px",
    buttonRadius: "8px",
    cardRadius: "12px",
  },

  shadows: {
    small: "0 1px 2px rgba(0,0,0,0.05)",
    medium: "0 4px 6px rgba(0,0,0,0.07)",
    large: "0 10px 25px rgba(0,0,0,0.1)",
    card: "0 1px 3px rgba(0,0,0,0.1)",
  },

  buttons: {
    primaryBg: "#3b82f6",
    primaryText: "#ffffff",
    primaryHoverBg: "#2563eb",
    secondaryBg: "#f1f5f9",
    secondaryText: "#475569",
    outlineBorder: "#3b82f6",
    outlineText: "#3b82f6",
  },
};

// Dark Elegance - Premium dark theme
export const darkElegance: BrandPreset = {
  id: "dark-elegance",
  name: "Dark Elegance",
  description: "Sophisticated dark premium theme",

  colors: {
    primary: "#a78bfa",
    primaryHover: "#8b5cf6",
    secondary: "#6b7280",
    secondaryHover: "#9ca3af",
    accent: "#f472b6",

    background: "#0f0f0f",
    backgroundAlt: "#1a1a1a",
    backgroundDark: "#000000",

    text: "#f5f5f5",
    textMuted: "#a3a3a3",
    textOnPrimary: "#000000",
    textOnDark: "#ffffff",

    border: "#2a2a2a",
    borderLight: "#3a3a3a",
    shadow: "rgba(0,0,0,0.5)",
  },

  typography: {
    headingFont: "system-ui, -apple-system, sans-serif",
    bodyFont: "system-ui, -apple-system, sans-serif",
    h1Size: "56px",
    h2Size: "40px",
    h3Size: "28px",
    h4Size: "20px",
    bodySize: "16px",
    smallSize: "14px",
    headingWeight: "600",
    bodyWeight: "400",
    boldWeight: "500",
    headingLineHeight: "1.1",
    bodyLineHeight: "1.7",
  },

  spacing: {
    sectionPaddingY: "100px",
    sectionPaddingX: "32px",
    containerMaxWidth: "1100px",
    elementGap: "32px",
    cardPadding: "32px",
  },

  borders: {
    radius: "12px",
    radiusLg: "20px",
    radiusFull: "9999px",
    buttonRadius: "8px",
    cardRadius: "16px",
  },

  shadows: {
    small: "0 2px 4px rgba(0,0,0,0.3)",
    medium: "0 8px 16px rgba(0,0,0,0.4)",
    large: "0 16px 32px rgba(0,0,0,0.5)",
    card: "0 4px 12px rgba(0,0,0,0.4)",
  },

  buttons: {
    primaryBg: "#a78bfa",
    primaryText: "#0f0f0f",
    primaryHoverBg: "#8b5cf6",
    secondaryBg: "#2a2a2a",
    secondaryText: "#f5f5f5",
    outlineBorder: "#a78bfa",
    outlineText: "#a78bfa",
  },
};

// Warm Coral - Friendly, approachable
export const warmCoral: BrandPreset = {
  id: "warm-coral",
  name: "Warm Coral",
  description: "Friendly, approachable warmth",

  colors: {
    primary: "#f97316",
    primaryHover: "#ea580c",
    secondary: "#78716c",
    secondaryHover: "#57534e",
    accent: "#facc15",

    background: "#fffbeb",
    backgroundAlt: "#fef3c7",
    backgroundDark: "#78350f",

    text: "#451a03",
    textMuted: "#92400e",
    textOnPrimary: "#ffffff",
    textOnDark: "#fef3c7",

    border: "#fde68a",
    borderLight: "#fef3c7",
    shadow: "rgba(120,53,15,0.1)",
  },

  typography: {
    headingFont: "Georgia, serif",
    bodyFont: "system-ui, -apple-system, sans-serif",
    h1Size: "44px",
    h2Size: "32px",
    h3Size: "24px",
    h4Size: "18px",
    bodySize: "16px",
    smallSize: "14px",
    headingWeight: "700",
    bodyWeight: "400",
    boldWeight: "600",
    headingLineHeight: "1.3",
    bodyLineHeight: "1.6",
  },

  spacing: {
    sectionPaddingY: "72px",
    sectionPaddingX: "24px",
    containerMaxWidth: "1100px",
    elementGap: "20px",
    cardPadding: "28px",
  },

  borders: {
    radius: "12px",
    radiusLg: "20px",
    radiusFull: "9999px",
    buttonRadius: "24px",
    cardRadius: "16px",
  },

  shadows: {
    small: "0 2px 4px rgba(120,53,15,0.08)",
    medium: "0 6px 12px rgba(120,53,15,0.12)",
    large: "0 12px 24px rgba(120,53,15,0.15)",
    card: "0 4px 8px rgba(120,53,15,0.1)",
  },

  buttons: {
    primaryBg: "#f97316",
    primaryText: "#ffffff",
    primaryHoverBg: "#ea580c",
    secondaryBg: "#fef3c7",
    secondaryText: "#92400e",
    outlineBorder: "#f97316",
    outlineText: "#ea580c",
  },
};

// Forest Green - Natural, sustainable
export const forestGreen: BrandPreset = {
  id: "forest-green",
  name: "Forest Green",
  description: "Natural, eco-friendly aesthetic",

  colors: {
    primary: "#16a34a",
    primaryHover: "#15803d",
    secondary: "#57534e",
    secondaryHover: "#44403c",
    accent: "#84cc16",

    background: "#f0fdf4",
    backgroundAlt: "#dcfce7",
    backgroundDark: "#14532d",

    text: "#14532d",
    textMuted: "#166534",
    textOnPrimary: "#ffffff",
    textOnDark: "#dcfce7",

    border: "#86efac",
    borderLight: "#bbf7d0",
    shadow: "rgba(20,83,45,0.1)",
  },

  typography: {
    headingFont: "system-ui, -apple-system, sans-serif",
    bodyFont: "system-ui, -apple-system, sans-serif",
    h1Size: "48px",
    h2Size: "36px",
    h3Size: "24px",
    h4Size: "20px",
    bodySize: "16px",
    smallSize: "14px",
    headingWeight: "700",
    bodyWeight: "400",
    boldWeight: "600",
    headingLineHeight: "1.2",
    bodyLineHeight: "1.6",
  },

  spacing: {
    sectionPaddingY: "80px",
    sectionPaddingX: "24px",
    containerMaxWidth: "1200px",
    elementGap: "24px",
    cardPadding: "24px",
  },

  borders: {
    radius: "8px",
    radiusLg: "16px",
    radiusFull: "9999px",
    buttonRadius: "8px",
    cardRadius: "12px",
  },

  shadows: {
    small: "0 1px 2px rgba(20,83,45,0.05)",
    medium: "0 4px 6px rgba(20,83,45,0.08)",
    large: "0 10px 20px rgba(20,83,45,0.12)",
    card: "0 2px 4px rgba(20,83,45,0.08)",
  },

  buttons: {
    primaryBg: "#16a34a",
    primaryText: "#ffffff",
    primaryHoverBg: "#15803d",
    secondaryBg: "#dcfce7",
    secondaryText: "#166534",
    outlineBorder: "#16a34a",
    outlineText: "#16a34a",
  },
};

// Midnight Purple - Creative, modern
export const midnightPurple: BrandPreset = {
  id: "midnight-purple",
  name: "Midnight Purple",
  description: "Creative, modern gradient style",

  colors: {
    primary: "#7c3aed",
    primaryHover: "#6d28d9",
    secondary: "#64748b",
    secondaryHover: "#475569",
    accent: "#ec4899",

    background: "#faf5ff",
    backgroundAlt: "#f3e8ff",
    backgroundDark: "#2e1065",

    text: "#1e1b4b",
    textMuted: "#6366f1",
    textOnPrimary: "#ffffff",
    textOnDark: "#e9d5ff",

    border: "#ddd6fe",
    borderLight: "#ede9fe",
    shadow: "rgba(124,58,237,0.15)",
  },

  typography: {
    headingFont: "system-ui, -apple-system, sans-serif",
    bodyFont: "system-ui, -apple-system, sans-serif",
    h1Size: "52px",
    h2Size: "40px",
    h3Size: "28px",
    h4Size: "20px",
    bodySize: "16px",
    smallSize: "14px",
    headingWeight: "800",
    bodyWeight: "400",
    boldWeight: "600",
    headingLineHeight: "1.1",
    bodyLineHeight: "1.6",
  },

  spacing: {
    sectionPaddingY: "96px",
    sectionPaddingX: "32px",
    containerMaxWidth: "1200px",
    elementGap: "28px",
    cardPadding: "28px",
  },

  borders: {
    radius: "16px",
    radiusLg: "24px",
    radiusFull: "9999px",
    buttonRadius: "12px",
    cardRadius: "20px",
  },

  shadows: {
    small: "0 2px 4px rgba(124,58,237,0.1)",
    medium: "0 8px 16px rgba(124,58,237,0.15)",
    large: "0 16px 32px rgba(124,58,237,0.2)",
    card: "0 4px 12px rgba(124,58,237,0.12)",
  },

  buttons: {
    primaryBg: "#7c3aed",
    primaryText: "#ffffff",
    primaryHoverBg: "#6d28d9",
    secondaryBg: "#ede9fe",
    secondaryText: "#6d28d9",
    outlineBorder: "#7c3aed",
    outlineText: "#7c3aed",
  },
};

// Minimal Mono - Clean, minimalist
export const minimalMono: BrandPreset = {
  id: "minimal-mono",
  name: "Minimal Mono",
  description: "Ultra-clean minimalist design",

  colors: {
    primary: "#171717",
    primaryHover: "#262626",
    secondary: "#737373",
    secondaryHover: "#525252",
    accent: "#171717",

    background: "#ffffff",
    backgroundAlt: "#fafafa",
    backgroundDark: "#171717",

    text: "#171717",
    textMuted: "#737373",
    textOnPrimary: "#ffffff",
    textOnDark: "#fafafa",

    border: "#e5e5e5",
    borderLight: "#f5f5f5",
    shadow: "rgba(0,0,0,0.08)",
  },

  typography: {
    headingFont: "system-ui, -apple-system, sans-serif",
    bodyFont: "system-ui, -apple-system, sans-serif",
    h1Size: "42px",
    h2Size: "32px",
    h3Size: "22px",
    h4Size: "18px",
    bodySize: "15px",
    smallSize: "13px",
    headingWeight: "600",
    bodyWeight: "400",
    boldWeight: "500",
    headingLineHeight: "1.3",
    bodyLineHeight: "1.7",
  },

  spacing: {
    sectionPaddingY: "64px",
    sectionPaddingX: "20px",
    containerMaxWidth: "960px",
    elementGap: "20px",
    cardPadding: "20px",
  },

  borders: {
    radius: "4px",
    radiusLg: "8px",
    radiusFull: "9999px",
    buttonRadius: "4px",
    cardRadius: "6px",
  },

  shadows: {
    small: "0 1px 2px rgba(0,0,0,0.04)",
    medium: "0 2px 4px rgba(0,0,0,0.06)",
    large: "0 4px 8px rgba(0,0,0,0.08)",
    card: "0 1px 2px rgba(0,0,0,0.05)",
  },

  buttons: {
    primaryBg: "#171717",
    primaryText: "#ffffff",
    primaryHoverBg: "#262626",
    secondaryBg: "#f5f5f5",
    secondaryText: "#171717",
    outlineBorder: "#171717",
    outlineText: "#171717",
  },
};

// Export all default presets
export const defaultPresets: BrandPreset[] = [
  modernBlue,
  darkElegance,
  warmCoral,
  forestGreen,
  midnightPurple,
  minimalMono,
];

export const getPresetById = (id: string): BrandPreset | undefined => {
  return defaultPresets.find((p) => p.id === id);
};
