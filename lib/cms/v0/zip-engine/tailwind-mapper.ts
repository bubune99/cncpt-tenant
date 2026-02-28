/**
 * Tailwind CSS → Puck Props Mapper
 *
 * Deterministic rules engine that converts Tailwind class arrays
 * into Puck component prop objects. Pure function, no side effects.
 */

export interface TailwindProps {
  // Layout detection
  display?: "flex" | "grid" | "block" | "none";
  flexDirection?: "row" | "column" | "row-reverse" | "column-reverse";
  gridColumns?: number;

  // Spacing
  padding?: string;
  paddingTop?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  paddingRight?: string;
  gap?: string;
  margin?: string;
  marginTop?: string;
  marginBottom?: string;

  // Typography
  fontSize?: string;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
  textTransform?: string;
  letterSpacing?: string;
  lineHeight?: string;
  fontFamily?: "serif" | "sans" | "mono";

  // Colors
  color?: string;
  backgroundColor?: string;
  borderColor?: string;

  // Sizing
  width?: string;
  maxWidth?: string;
  minHeight?: string;
  height?: string;

  // Border
  borderRadius?: string;
  borderWidth?: string;

  // Flex/Grid alignment
  alignItems?: string;
  justifyContent?: string;
  alignSelf?: string;

  // Display
  overflow?: string;

  // Responsive prefixes collected but not mapped
  responsiveClasses?: Record<string, string[]>;

  // Unrecognized classes for debugging
  unmappedClasses: string[];
}

// Tailwind spacing scale: class value → px
const SPACING_SCALE: Record<string, string> = {
  "0": "0px",
  "0.5": "2px",
  "1": "4px",
  "1.5": "6px",
  "2": "8px",
  "2.5": "10px",
  "3": "12px",
  "3.5": "14px",
  "4": "16px",
  "5": "20px",
  "6": "24px",
  "7": "28px",
  "8": "32px",
  "9": "36px",
  "10": "40px",
  "11": "44px",
  "12": "48px",
  "14": "56px",
  "16": "64px",
  "20": "80px",
  "24": "96px",
  "28": "112px",
  "32": "128px",
  "36": "144px",
  "40": "160px",
  "44": "176px",
  "48": "192px",
  "52": "208px",
  "56": "224px",
  "60": "240px",
  "64": "256px",
  "72": "288px",
  "80": "320px",
  "96": "384px",
};

// Font size mapping
const FONT_SIZE_MAP: Record<string, string> = {
  "text-xs": "12px",
  "text-sm": "14px",
  "text-base": "16px",
  "text-lg": "18px",
  "text-xl": "20px",
  "text-2xl": "24px",
  "text-3xl": "30px",
  "text-4xl": "36px",
  "text-5xl": "48px",
  "text-6xl": "60px",
  "text-7xl": "72px",
  "text-8xl": "96px",
  "text-9xl": "128px",
};

// Font weight mapping
const FONT_WEIGHT_MAP: Record<string, string> = {
  "font-thin": "100",
  "font-extralight": "200",
  "font-light": "300",
  "font-normal": "400",
  "font-medium": "500",
  "font-semibold": "600",
  "font-bold": "bold",
  "font-extrabold": "800",
  "font-black": "900",
};

// Max width mapping
const MAX_WIDTH_MAP: Record<string, string> = {
  "max-w-xs": "320px",
  "max-w-sm": "384px",
  "max-w-md": "448px",
  "max-w-lg": "512px",
  "max-w-xl": "576px",
  "max-w-2xl": "672px",
  "max-w-3xl": "768px",
  "max-w-4xl": "896px",
  "max-w-5xl": "1024px",
  "max-w-6xl": "1152px",
  "max-w-7xl": "1280px",
  "max-w-full": "100%",
  "max-w-screen-sm": "640px",
  "max-w-screen-md": "768px",
  "max-w-screen-lg": "1024px",
  "max-w-screen-xl": "1280px",
  "max-w-screen-2xl": "1536px",
  "max-w-prose": "65ch",
};

// Border radius mapping
const BORDER_RADIUS_MAP: Record<string, string> = {
  "rounded-none": "0px",
  "rounded-sm": "2px",
  "rounded": "4px",
  "rounded-md": "6px",
  "rounded-lg": "8px",
  "rounded-xl": "12px",
  "rounded-2xl": "16px",
  "rounded-3xl": "24px",
  "rounded-full": "9999px",
};

// Tailwind color palette (common shades)
const TAILWIND_COLORS: Record<string, Record<string, string>> = {
  slate: {
    "50": "#f8fafc", "100": "#f1f5f9", "200": "#e2e8f0", "300": "#cbd5e1",
    "400": "#94a3b8", "500": "#64748b", "600": "#475569", "700": "#334155",
    "800": "#1e293b", "900": "#0f172a", "950": "#020617",
  },
  gray: {
    "50": "#f9fafb", "100": "#f3f4f6", "200": "#e5e7eb", "300": "#d1d5db",
    "400": "#9ca3af", "500": "#6b7280", "600": "#4b5563", "700": "#374151",
    "800": "#1f2937", "900": "#111827", "950": "#030712",
  },
  zinc: {
    "50": "#fafafa", "100": "#f4f4f5", "200": "#e4e4e7", "300": "#d4d4d8",
    "400": "#a1a1aa", "500": "#71717a", "600": "#52525b", "700": "#3f3f46",
    "800": "#27272a", "900": "#18181b", "950": "#09090b",
  },
  neutral: {
    "50": "#fafafa", "100": "#f5f5f5", "200": "#e5e5e5", "300": "#d4d4d4",
    "400": "#a3a3a3", "500": "#737373", "600": "#525252", "700": "#404040",
    "800": "#262626", "900": "#171717", "950": "#0a0a0a",
  },
  stone: {
    "50": "#fafaf9", "100": "#f5f5f4", "200": "#e7e5e3", "300": "#d6d3d1",
    "400": "#a8a29e", "500": "#78716c", "600": "#57534e", "700": "#44403c",
    "800": "#292524", "900": "#1c1917", "950": "#0c0a09",
  },
  red: {
    "50": "#fef2f2", "100": "#fee2e2", "200": "#fecaca", "300": "#fca5a5",
    "400": "#f87171", "500": "#ef4444", "600": "#dc2626", "700": "#b91c1c",
    "800": "#991b1b", "900": "#7f1d1d", "950": "#450a0a",
  },
  orange: {
    "50": "#fff7ed", "100": "#ffedd5", "200": "#fed7aa", "300": "#fdba74",
    "400": "#fb923c", "500": "#f97316", "600": "#ea580c", "700": "#c2410c",
    "800": "#9a3412", "900": "#7c2d12", "950": "#431407",
  },
  amber: {
    "50": "#fffbeb", "100": "#fef3c7", "200": "#fde68a", "300": "#fcd34d",
    "400": "#fbbf24", "500": "#f59e0b", "600": "#d97706", "700": "#b45309",
    "800": "#92400e", "900": "#78350f", "950": "#451a03",
  },
  yellow: {
    "50": "#fefce8", "100": "#fef9c3", "200": "#fef08a", "300": "#fde047",
    "400": "#facc15", "500": "#eab308", "600": "#ca8a04", "700": "#a16207",
    "800": "#854d0e", "900": "#713f12", "950": "#422006",
  },
  green: {
    "50": "#f0fdf4", "100": "#dcfce7", "200": "#bbf7d0", "300": "#86efac",
    "400": "#4ade80", "500": "#22c55e", "600": "#16a34a", "700": "#15803d",
    "800": "#166534", "900": "#14532d", "950": "#052e16",
  },
  emerald: {
    "50": "#ecfdf5", "100": "#d1fae5", "200": "#a7f3d0", "300": "#6ee7b7",
    "400": "#34d399", "500": "#10b981", "600": "#059669", "700": "#047857",
    "800": "#065f46", "900": "#064e3b", "950": "#022c22",
  },
  teal: {
    "50": "#f0fdfa", "100": "#ccfbf1", "200": "#99f6e4", "300": "#5eead4",
    "400": "#2dd4bf", "500": "#14b8a6", "600": "#0d9488", "700": "#0f766e",
    "800": "#115e59", "900": "#134e4a", "950": "#042f2e",
  },
  cyan: {
    "50": "#ecfeff", "100": "#cffafe", "200": "#a5f3fc", "300": "#67e8f9",
    "400": "#22d3ee", "500": "#06b6d4", "600": "#0891b2", "700": "#0e7490",
    "800": "#155e75", "900": "#164e63", "950": "#083344",
  },
  sky: {
    "50": "#f0f9ff", "100": "#e0f2fe", "200": "#bae6fd", "300": "#7dd3fc",
    "400": "#38bdf8", "500": "#0ea5e9", "600": "#0284c7", "700": "#0369a1",
    "800": "#075985", "900": "#0c4a6e", "950": "#082f49",
  },
  blue: {
    "50": "#eff6ff", "100": "#dbeafe", "200": "#bfdbfe", "300": "#93c5fd",
    "400": "#60a5fa", "500": "#3b82f6", "600": "#2563eb", "700": "#1d4ed8",
    "800": "#1e40af", "900": "#1e3a8a", "950": "#172554",
  },
  indigo: {
    "50": "#eef2ff", "100": "#e0e7ff", "200": "#c7d2fe", "300": "#a5b4fc",
    "400": "#818cf8", "500": "#6366f1", "600": "#4f46e5", "700": "#4338ca",
    "800": "#3730a3", "900": "#312e81", "950": "#1e1b4b",
  },
  violet: {
    "50": "#f5f3ff", "100": "#ede9fe", "200": "#ddd6fe", "300": "#c4b5fd",
    "400": "#a78bfa", "500": "#8b5cf6", "600": "#7c3aed", "700": "#6d28d9",
    "800": "#5b21b6", "900": "#4c1d95", "950": "#2e1065",
  },
  purple: {
    "50": "#faf5ff", "100": "#f3e8ff", "200": "#e9d5ff", "300": "#d8b4fe",
    "400": "#c084fc", "500": "#a855f7", "600": "#9333ea", "700": "#7e22ce",
    "800": "#6b21a8", "900": "#581c87", "950": "#3b0764",
  },
  fuchsia: {
    "50": "#fdf4ff", "100": "#fae8ff", "200": "#f5d0fe", "300": "#f0abfc",
    "400": "#e879f9", "500": "#d946ef", "600": "#c026d3", "700": "#a21caf",
    "800": "#86198f", "900": "#701a75", "950": "#4a044e",
  },
  pink: {
    "50": "#fdf2f8", "100": "#fce7f3", "200": "#fbcfe8", "300": "#f9a8d4",
    "400": "#f472b6", "500": "#ec4899", "600": "#db2777", "700": "#be185d",
    "800": "#9d174d", "900": "#831843", "950": "#500724",
  },
  rose: {
    "50": "#fff1f2", "100": "#ffe4e6", "200": "#fecdd3", "300": "#fda4af",
    "400": "#fb7185", "500": "#f43f5e", "600": "#e11d48", "700": "#be123c",
    "800": "#9f1239", "900": "#881337", "950": "#4c0519",
  },
};

// Special color keywords
const SPECIAL_COLORS: Record<string, string> = {
  "white": "#ffffff",
  "black": "#000000",
  "transparent": "transparent",
  "current": "currentColor",
};

// CSS variable-based theme colors (shadcn/v0 pattern)
const THEME_COLOR_MAP: Record<string, string> = {
  "background": "var(--background)",
  "foreground": "var(--foreground)",
  "primary": "var(--primary)",
  "primary-foreground": "var(--primary-foreground)",
  "secondary": "var(--secondary)",
  "secondary-foreground": "var(--secondary-foreground)",
  "muted": "var(--muted)",
  "muted-foreground": "var(--muted-foreground)",
  "accent": "var(--accent)",
  "accent-foreground": "var(--accent-foreground)",
  "destructive": "var(--destructive)",
  "destructive-foreground": "var(--destructive-foreground)",
  "border": "var(--border)",
  "input": "var(--input)",
  "ring": "var(--ring)",
  "card": "var(--card)",
  "card-foreground": "var(--card-foreground)",
  "popover": "var(--popover)",
  "popover-foreground": "var(--popover-foreground)",
};

function resolveSpacing(value: string): string | undefined {
  return SPACING_SCALE[value];
}

function resolveColor(colorName: string): string | undefined {
  // Check special colors
  if (SPECIAL_COLORS[colorName]) return SPECIAL_COLORS[colorName];

  // Check theme/CSS variable colors
  if (THEME_COLOR_MAP[colorName]) return THEME_COLOR_MAP[colorName];

  // Check palette: color-shade pattern
  const match = colorName.match(/^(\w+)-(\d+)$/);
  if (match) {
    const [, name, shade] = match;
    if (TAILWIND_COLORS[name]?.[shade]) {
      return TAILWIND_COLORS[name][shade];
    }
  }

  // v4 opacity syntax: color-shade/opacity
  const opacityMatch = colorName.match(/^(\w+)-(\d+)\/(\d+)$/);
  if (opacityMatch) {
    const [, name, shade, opacity] = opacityMatch;
    const hex = TAILWIND_COLORS[name]?.[shade];
    if (hex) {
      const alpha = parseInt(opacity) / 100;
      return hexToRgba(hex, alpha);
    }
  }

  return undefined;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Parse Tailwind classes into structured props.
 */
export function mapTailwindClasses(classes: string[]): TailwindProps {
  const props: TailwindProps = {
    unmappedClasses: [],
    responsiveClasses: {},
  };

  for (const cls of classes) {
    // Handle responsive prefixes — collect but don't map
    const responsiveMatch = cls.match(/^(sm|md|lg|xl|2xl):(.+)$/);
    if (responsiveMatch) {
      const [, breakpoint, innerClass] = responsiveMatch;
      if (!props.responsiveClasses![breakpoint]) {
        props.responsiveClasses![breakpoint] = [];
      }
      props.responsiveClasses![breakpoint].push(innerClass);
      continue;
    }

    // Handle dark: and hover: prefixes — skip
    if (cls.startsWith("dark:") || cls.startsWith("hover:") || cls.startsWith("focus:") || cls.startsWith("active:") || cls.startsWith("group-hover:")) {
      continue;
    }

    // Handle arbitrary values: class-[value]
    const arbitraryMatch = cls.match(/^(\w[\w-]*)-\[(.+)\]$/);
    if (arbitraryMatch) {
      const [, prefix, value] = arbitraryMatch;
      if (mapArbitraryValue(props, prefix, value)) continue;
    }

    if (mapLayoutClass(props, cls)) continue;
    if (mapSpacingClass(props, cls)) continue;
    if (mapTypographyClass(props, cls)) continue;
    if (mapColorClass(props, cls)) continue;
    if (mapSizingClass(props, cls)) continue;
    if (mapBorderClass(props, cls)) continue;
    if (mapAlignmentClass(props, cls)) continue;
    if (mapDisplayClass(props, cls)) continue;

    // Unrecognized — collect for debugging
    props.unmappedClasses.push(cls);
  }

  return props;
}

function mapArbitraryValue(props: TailwindProps, prefix: string, value: string): boolean {
  switch (prefix) {
    case "text":
      if (value.startsWith("hsl") || value.startsWith("#") || value.startsWith("rgb")) {
        props.color = value;
      } else {
        props.fontSize = value;
      }
      return true;
    case "bg":
      props.backgroundColor = value;
      return true;
    case "p":
      props.padding = value;
      return true;
    case "pt":
      props.paddingTop = value;
      return true;
    case "pb":
      props.paddingBottom = value;
      return true;
    case "pl":
      props.paddingLeft = value;
      return true;
    case "pr":
      props.paddingRight = value;
      return true;
    case "px":
      props.paddingLeft = value;
      props.paddingRight = value;
      return true;
    case "py":
      props.paddingTop = value;
      props.paddingBottom = value;
      return true;
    case "gap":
      props.gap = value;
      return true;
    case "max-w":
      props.maxWidth = value;
      return true;
    case "min-h":
      props.minHeight = value;
      return true;
    case "w":
      props.width = value;
      return true;
    case "h":
      props.height = value;
      return true;
    case "rounded":
      props.borderRadius = value;
      return true;
    case "border":
      if (value.startsWith("hsl") || value.startsWith("#") || value.startsWith("rgb")) {
        props.borderColor = value;
      } else {
        props.borderWidth = value;
      }
      return true;
    default:
      return false;
  }
}

function mapLayoutClass(props: TailwindProps, cls: string): boolean {
  switch (cls) {
    case "flex":
      props.display = "flex";
      return true;
    case "inline-flex":
      props.display = "flex";
      return true;
    case "grid":
      props.display = "grid";
      return true;
    case "block":
      props.display = "block";
      return true;
    case "flex-col":
      props.flexDirection = "column";
      return true;
    case "flex-row":
      props.flexDirection = "row";
      return true;
    case "flex-col-reverse":
      props.flexDirection = "column-reverse";
      return true;
    case "flex-row-reverse":
      props.flexDirection = "row-reverse";
      return true;
    default:
      break;
  }

  // grid-cols-{n}
  const gridColsMatch = cls.match(/^grid-cols-(\d+)$/);
  if (gridColsMatch) {
    props.display = "grid";
    props.gridColumns = parseInt(gridColsMatch[1]);
    return true;
  }

  return false;
}

function mapSpacingClass(props: TailwindProps, cls: string): boolean {
  // Padding: p-{n}, px-{n}, py-{n}, pt/pb/pl/pr-{n}
  const paddingMatch = cls.match(/^(p|px|py|pt|pb|pl|pr)-(\d+\.?\d*|auto)$/);
  if (paddingMatch) {
    const [, dir, val] = paddingMatch;
    const px = resolveSpacing(val);
    if (!px) return false;
    switch (dir) {
      case "p":
        props.padding = px;
        return true;
      case "px":
        props.paddingLeft = px;
        props.paddingRight = px;
        return true;
      case "py":
        props.paddingTop = px;
        props.paddingBottom = px;
        return true;
      case "pt":
        props.paddingTop = px;
        return true;
      case "pb":
        props.paddingBottom = px;
        return true;
      case "pl":
        props.paddingLeft = px;
        return true;
      case "pr":
        props.paddingRight = px;
        return true;
    }
  }

  // Gap: gap-{n}
  const gapMatch = cls.match(/^gap-(\d+\.?\d*)$/);
  if (gapMatch) {
    const px = resolveSpacing(gapMatch[1]);
    if (px) {
      props.gap = px;
      return true;
    }
  }

  // gap-x and gap-y — map to gap (simplification)
  const gapDirMatch = cls.match(/^gap-[xy]-(\d+\.?\d*)$/);
  if (gapDirMatch) {
    const px = resolveSpacing(gapDirMatch[1]);
    if (px) {
      props.gap = px;
      return true;
    }
  }

  // space-x-{n}, space-y-{n} — approximate as gap
  const spaceMatch = cls.match(/^space-[xy]-(\d+\.?\d*)$/);
  if (spaceMatch) {
    const px = resolveSpacing(spaceMatch[1]);
    if (px) {
      props.gap = px;
      return true;
    }
  }

  // Margin: m-{n}, mx-{n}, my-{n}, mt/mb/ml/mr-{n}
  const marginMatch = cls.match(/^(m|mx|my|mt|mb|ml|mr)-(\d+\.?\d*|auto)$/);
  if (marginMatch) {
    const [, dir, val] = marginMatch;
    if (val === "auto") {
      props.margin = "auto";
      return true;
    }
    const px = resolveSpacing(val);
    if (px) {
      if (dir === "m") props.margin = px;
      else if (dir === "mx") props.margin = `0 ${px}`;
      else if (dir === "my") props.margin = `${px} 0`;
      else if (dir === "mt") props.marginTop = px;
      else if (dir === "mb") props.marginBottom = px;
      return true;
    }
  }

  return false;
}

function mapTypographyClass(props: TailwindProps, cls: string): boolean {
  // Font size
  if (FONT_SIZE_MAP[cls]) {
    props.fontSize = FONT_SIZE_MAP[cls];
    return true;
  }

  // Font weight
  if (FONT_WEIGHT_MAP[cls]) {
    props.fontWeight = FONT_WEIGHT_MAP[cls];
    return true;
  }

  // Text alignment
  switch (cls) {
    case "text-center":
      props.textAlign = "center";
      return true;
    case "text-left":
      props.textAlign = "left";
      return true;
    case "text-right":
      props.textAlign = "right";
      return true;
  }

  // Text transform
  if (cls === "uppercase") { props.textTransform = "uppercase"; return true; }
  if (cls === "lowercase") { props.textTransform = "lowercase"; return true; }
  if (cls === "capitalize") { props.textTransform = "capitalize"; return true; }

  // Letter spacing
  switch (cls) {
    case "tracking-tighter":
      props.letterSpacing = "-0.05em";
      return true;
    case "tracking-tight":
      props.letterSpacing = "-0.025em";
      return true;
    case "tracking-normal":
      props.letterSpacing = "0em";
      return true;
    case "tracking-wide":
      props.letterSpacing = "0.025em";
      return true;
    case "tracking-wider":
      props.letterSpacing = "0.05em";
      return true;
    case "tracking-widest":
      props.letterSpacing = "0.1em";
      return true;
  }

  // Line height
  switch (cls) {
    case "leading-none":
      props.lineHeight = "1";
      return true;
    case "leading-tight":
      props.lineHeight = "1.25";
      return true;
    case "leading-snug":
      props.lineHeight = "1.375";
      return true;
    case "leading-normal":
      props.lineHeight = "1.5";
      return true;
    case "leading-relaxed":
      props.lineHeight = "1.625";
      return true;
    case "leading-loose":
      props.lineHeight = "2";
      return true;
  }

  // Font family
  if (cls === "font-serif") { props.fontFamily = "serif"; return true; }
  if (cls === "font-sans") { props.fontFamily = "sans"; return true; }
  if (cls === "font-mono") { props.fontFamily = "mono"; return true; }

  return false;
}

function mapColorClass(props: TailwindProps, cls: string): boolean {
  // Text colors: text-{color}
  const textColorMatch = cls.match(/^text-([\w-]+(?:\/\d+)?)$/);
  if (textColorMatch && !FONT_SIZE_MAP[cls] && cls !== "text-center" && cls !== "text-left" && cls !== "text-right") {
    const color = resolveColor(textColorMatch[1]);
    if (color) {
      props.color = color;
      return true;
    }
  }

  // Background colors: bg-{color}
  const bgColorMatch = cls.match(/^bg-([\w-]+(?:\/\d+)?)$/);
  if (bgColorMatch) {
    const color = resolveColor(bgColorMatch[1]);
    if (color) {
      props.backgroundColor = color;
      return true;
    }
  }

  // Border colors: border-{color}
  const borderColorMatch = cls.match(/^border-([\w-]+(?:\/\d+)?)$/);
  if (borderColorMatch && cls !== "border" && !cls.match(/^border-\d/)) {
    const color = resolveColor(borderColorMatch[1]);
    if (color) {
      props.borderColor = color;
      return true;
    }
  }

  return false;
}

function mapSizingClass(props: TailwindProps, cls: string): boolean {
  // Width
  if (cls === "w-full") { props.width = "100%"; return true; }
  if (cls === "w-auto") { props.width = "auto"; return true; }
  if (cls === "w-screen") { props.width = "100vw"; return true; }
  const wMatch = cls.match(/^w-(\d+\.?\d*)$/);
  if (wMatch) {
    const px = resolveSpacing(wMatch[1]);
    if (px) { props.width = px; return true; }
  }
  // w-1/2, w-1/3, etc.
  const wFracMatch = cls.match(/^w-(\d+)\/(\d+)$/);
  if (wFracMatch) {
    const pct = (parseInt(wFracMatch[1]) / parseInt(wFracMatch[2])) * 100;
    props.width = `${pct.toFixed(4).replace(/\.?0+$/, "")}%`;
    return true;
  }

  // Max width
  if (MAX_WIDTH_MAP[cls]) {
    props.maxWidth = MAX_WIDTH_MAP[cls];
    return true;
  }

  // Min height
  if (cls === "min-h-screen") { props.minHeight = "100vh"; return true; }
  if (cls === "min-h-full") { props.minHeight = "100%"; return true; }
  const minHMatch = cls.match(/^min-h-(\d+\.?\d*)$/);
  if (minHMatch) {
    const px = resolveSpacing(minHMatch[1]);
    if (px) { props.minHeight = px; return true; }
  }

  // Height
  if (cls === "h-full") { props.height = "100%"; return true; }
  if (cls === "h-screen") { props.height = "100vh"; return true; }
  if (cls === "h-auto") { props.height = "auto"; return true; }
  const hMatch = cls.match(/^h-(\d+\.?\d*)$/);
  if (hMatch) {
    const px = resolveSpacing(hMatch[1]);
    if (px) { props.height = px; return true; }
  }

  return false;
}

function mapBorderClass(props: TailwindProps, cls: string): boolean {
  // Border radius
  if (BORDER_RADIUS_MAP[cls]) {
    props.borderRadius = BORDER_RADIUS_MAP[cls];
    return true;
  }

  // Border width
  if (cls === "border") { props.borderWidth = "1px"; return true; }
  const borderMatch = cls.match(/^border-(\d+)$/);
  if (borderMatch) {
    props.borderWidth = `${borderMatch[1]}px`;
    return true;
  }

  return false;
}

function mapAlignmentClass(props: TailwindProps, cls: string): boolean {
  // align-items
  switch (cls) {
    case "items-center":
      props.alignItems = "center";
      return true;
    case "items-start":
      props.alignItems = "flex-start";
      return true;
    case "items-end":
      props.alignItems = "flex-end";
      return true;
    case "items-stretch":
      props.alignItems = "stretch";
      return true;
    case "items-baseline":
      props.alignItems = "baseline";
      return true;
  }

  // justify-content
  switch (cls) {
    case "justify-center":
      props.justifyContent = "center";
      return true;
    case "justify-between":
      props.justifyContent = "space-between";
      return true;
    case "justify-start":
      props.justifyContent = "flex-start";
      return true;
    case "justify-end":
      props.justifyContent = "flex-end";
      return true;
    case "justify-around":
      props.justifyContent = "space-around";
      return true;
    case "justify-evenly":
      props.justifyContent = "space-evenly";
      return true;
  }

  // align-self
  switch (cls) {
    case "self-center":
      props.alignSelf = "center";
      return true;
    case "self-start":
      props.alignSelf = "flex-start";
      return true;
    case "self-end":
      props.alignSelf = "flex-end";
      return true;
    case "self-stretch":
      props.alignSelf = "stretch";
      return true;
  }

  return false;
}

function mapDisplayClass(props: TailwindProps, cls: string): boolean {
  if (cls === "hidden") { props.display = "none"; return true; }
  if (cls === "overflow-hidden") { props.overflow = "hidden"; return true; }
  if (cls === "overflow-auto") { props.overflow = "auto"; return true; }
  if (cls === "overflow-scroll") { props.overflow = "scroll"; return true; }

  // Flex shrink/grow — recognized but not mapped to specific prop
  if (cls === "flex-1" || cls === "flex-grow" || cls === "flex-shrink-0" || cls === "flex-shrink" || cls === "flex-grow-0" || cls === "flex-none") {
    return true; // recognized, no specific Puck prop
  }

  // Container class
  if (cls === "container") {
    props.maxWidth = "1280px";
    props.margin = "0 auto";
    return true;
  }

  // Relative/absolute positioning — recognized, not mapped
  if (cls === "relative" || cls === "absolute" || cls === "fixed" || cls === "sticky") {
    return true;
  }

  // Z-index — recognized, not mapped
  if (cls.startsWith("z-")) return true;

  // Transition/animation — recognized, not mapped
  if (cls.startsWith("transition") || cls.startsWith("duration-") || cls.startsWith("ease-") || cls.startsWith("delay-") || cls.startsWith("animate-")) {
    return true;
  }

  // Opacity — recognized, not mapped
  if (cls.startsWith("opacity-")) return true;

  // Cursor — recognized, not mapped
  if (cls.startsWith("cursor-")) return true;

  // Object fit — recognized
  if (cls === "object-cover" || cls === "object-contain" || cls === "object-fill" || cls === "object-none" || cls === "object-center") {
    return true;
  }

  // Whitespace/truncate — recognized, not mapped
  if (cls.startsWith("whitespace-") || cls === "truncate" || cls === "line-clamp-1" || cls === "line-clamp-2" || cls === "line-clamp-3") {
    return true;
  }

  // List styling
  if (cls.startsWith("list-")) return true;

  // Flex wrap
  if (cls === "flex-wrap") return true;
  if (cls === "flex-nowrap") return true;

  // Aspect ratio
  if (cls.startsWith("aspect-")) return true;

  // Inset positioning
  if (cls.startsWith("inset-") || cls.startsWith("top-") || cls.startsWith("bottom-") || cls.startsWith("left-") || cls.startsWith("right-")) {
    return true;
  }

  // Shadow
  if (cls.startsWith("shadow")) return true;

  // Ring
  if (cls.startsWith("ring")) return true;

  // Outline
  if (cls.startsWith("outline")) return true;

  // Placeholder
  if (cls.startsWith("placeholder")) return true;

  // Selection
  if (cls.startsWith("selection:")) return true;

  // Decoration
  if (cls === "underline" || cls === "no-underline" || cls === "line-through" || cls.startsWith("decoration-")) return true;

  // Scroll
  if (cls.startsWith("scroll-") || cls.startsWith("snap-") || cls === "overflow-x-auto" || cls === "overflow-y-auto") return true;

  // Transform
  if (cls.startsWith("translate-") || cls.startsWith("rotate-") || cls.startsWith("scale-") || cls.startsWith("skew-") || cls === "transform") return true;

  // Pointer events
  if (cls.startsWith("pointer-events-")) return true;

  // Select
  if (cls.startsWith("select-")) return true;

  // Resize
  if (cls.startsWith("resize")) return true;

  // Fill/stroke (SVG)
  if (cls.startsWith("fill-") || cls.startsWith("stroke-")) return true;

  // Backdrop
  if (cls.startsWith("backdrop-")) return true;

  // Divide
  if (cls.startsWith("divide-")) return true;

  // Table
  if (cls.startsWith("table-") || cls === "table") return true;

  // Columns
  if (cls.startsWith("columns-")) return true;

  // Break
  if (cls.startsWith("break-")) return true;

  // Hyphens
  if (cls.startsWith("hyphens-")) return true;

  // Content
  if (cls.startsWith("content-")) return true;

  // Place
  if (cls.startsWith("place-")) return true;

  // Order
  if (cls.startsWith("order-")) return true;

  // Col/row span
  if (cls.startsWith("col-") || cls.startsWith("row-")) return true;

  // Isolation
  if (cls === "isolate" || cls === "isolation-auto") return true;

  // Mix blend
  if (cls.startsWith("mix-blend-")) return true;

  // Background attachment/clip/origin/position/repeat/size
  if (cls.startsWith("bg-") && !cls.match(/^bg-[\w]+-\d/)) {
    if (cls === "bg-cover" || cls === "bg-contain" || cls === "bg-center" || cls === "bg-no-repeat" || cls === "bg-fixed" || cls === "bg-scroll" || cls === "bg-clip-text") {
      return true;
    }
  }

  // Gradient
  if (cls.startsWith("from-") || cls.startsWith("via-") || cls.startsWith("to-") || cls === "bg-gradient-to-r" || cls === "bg-gradient-to-l" || cls === "bg-gradient-to-t" || cls === "bg-gradient-to-b" || cls === "bg-gradient-to-br" || cls === "bg-gradient-to-bl" || cls === "bg-gradient-to-tr" || cls === "bg-gradient-to-tl") {
    return true;
  }

  // Will change
  if (cls.startsWith("will-change-")) return true;

  // Touch action
  if (cls.startsWith("touch-")) return true;

  // Appearance
  if (cls === "appearance-none" || cls === "appearance-auto") return true;

  // Accent color
  if (cls.startsWith("accent-")) return true;

  // Caret
  if (cls.startsWith("caret-")) return true;

  // sr-only
  if (cls === "sr-only" || cls === "not-sr-only") return true;

  return false;
}
