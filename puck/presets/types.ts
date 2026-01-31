export interface BrandPreset {
  id: string;
  name: string;
  description: string;
  isCustom?: boolean;

  colors: {
    // Primary brand colors
    primary: string;
    primaryHover: string;
    secondary: string;
    secondaryHover: string;
    accent: string;

    // Backgrounds
    background: string;
    backgroundAlt: string;
    backgroundDark: string;

    // Text colors
    text: string;
    textMuted: string;
    textOnPrimary: string;
    textOnDark: string;

    // UI colors
    border: string;
    borderLight: string;
    shadow: string;
  };

  typography: {
    headingFont: string;
    bodyFont: string;

    // Font sizes
    h1Size: string;
    h2Size: string;
    h3Size: string;
    h4Size: string;
    bodySize: string;
    smallSize: string;

    // Font weights
    headingWeight: string;
    bodyWeight: string;
    boldWeight: string;

    // Line heights
    headingLineHeight: string;
    bodyLineHeight: string;
  };

  spacing: {
    sectionPaddingY: string;
    sectionPaddingX: string;
    containerMaxWidth: string;
    elementGap: string;
    cardPadding: string;
  };

  borders: {
    radius: string;
    radiusLg: string;
    radiusFull: string;
    buttonRadius: string;
    cardRadius: string;
  };

  shadows: {
    small: string;
    medium: string;
    large: string;
    card: string;
  };

  buttons: {
    primaryBg: string;
    primaryText: string;
    primaryHoverBg: string;
    secondaryBg: string;
    secondaryText: string;
    outlineBorder: string;
    outlineText: string;
  };
}

// Partial preset for overriding specific values
export type PartialPreset = Partial<{
  [K in keyof BrandPreset]: Partial<BrandPreset[K]>;
}>;
