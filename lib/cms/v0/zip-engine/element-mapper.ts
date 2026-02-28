/**
 * Element Mapper
 *
 * Maps ParsedElement trees (from the AST parser) to Puck component JSON.
 * Uses the Tailwind mapper for style extraction and ThemeInfo for colors/fonts.
 */

import type { ParsedElement, ParsedSection, DataArray } from "./ast-parser";
import { mapTailwindClasses, type TailwindProps } from "./tailwind-mapper";
import type { ThemeInfo } from "./theme-extractor";

// Puck component instance in the content array
export interface PuckComponent {
  type: string;
  props: Record<string, unknown>;
}

// Puck content format (what gets stored in templates)
export interface PuckContent {
  root: { props: Record<string, unknown> };
  content: PuckComponent[];
}

// Decomposed section with metadata
export interface DecomposedSection {
  name: string;
  type: "header" | "footer" | "hero" | "section";
  componentCount: number;
  content: PuckContent;
  sourceFile: string;
}

let componentIdCounter = 0;

function nextId(): string {
  return `zip-${++componentIdCounter}`;
}

/**
 * Reset the ID counter (call before processing a new ZIP).
 */
export function resetIdCounter() {
  componentIdCounter = 0;
}

/**
 * Map a parsed section to Puck components.
 */
export function mapSectionToComponents(
  section: ParsedSection,
  theme: ThemeInfo,
  sourceFile: string
): DecomposedSection {
  resetIdCounter();

  const sectionType = section.sectionType === "unknown" ? "section" : section.sectionType;

  let components: PuckComponent[];

  switch (sectionType) {
    case "header":
      components = mapHeaderSection(section, theme);
      break;
    case "footer":
      components = mapFooterSection(section, theme);
      break;
    default:
      components = mapGenericSection(section, theme);
      break;
  }

  return {
    name: section.name,
    type: sectionType,
    componentCount: countComponents(components),
    content: {
      root: { props: { title: section.name } },
      content: components,
    },
    sourceFile,
  };
}

/**
 * Map a header/navigation section to Puck Header component.
 */
function mapHeaderSection(
  section: ParsedSection,
  theme: ThemeInfo
): PuckComponent[] {
  const root = section.rootElement;
  if (!root) return [createDefaultHeader()];

  const tw = mapTailwindClasses(root.classes);

  // Collect all link-like elements and text/button elements
  const navLinks: PuckComponent[] = [];
  const ctaButtons: PuckComponent[] = [];
  let logoText = "";

  function collectHeaderChildren(el: ParsedElement) {
    for (const child of el.children) {
      // Logo/brand text — usually first text or heading
      if (!logoText && (child.tag === "h1" || child.tag === "h2" || child.tag === "span" || child.tag === "p" || child.tag === "div")) {
        if (child.textContent && !child.textContent.startsWith("{")) {
          logoText = child.textContent;
          continue;
        }
      }

      // Anchor tags → NavLinks or Buttons
      if (child.tag === "a") {
        const childTw = mapTailwindClasses(child.classes);
        const isButton = hasButtonClasses(child.classes);

        if (isButton) {
          ctaButtons.push(createButton(child, childTw, theme));
        } else {
          navLinks.push(createNavLink(child, childTw));
        }
        continue;
      }

      // Button tags
      if (child.tag === "button") {
        const childTw = mapTailwindClasses(child.classes);
        ctaButtons.push(createButton(child, childTw, theme));
        continue;
      }

      // Check data array maps for nav links
      if (child.mapSource && child.mapItemTemplate) {
        const dataArray = section.dataArrays.find(
          (d) => d.name === child.mapSource
        );
        if (dataArray) {
          for (const item of dataArray.items) {
            navLinks.push({
              type: "NavLink",
              props: {
                label: String(item.label || item.name || item.title || "Link"),
                href: String(item.href || item.url || item.link || "#"),
              },
            });
          }
          continue;
        }
      }

      // Recurse into containers
      if (!child.isComponent) {
        collectHeaderChildren(child);
      }
    }
  }

  collectHeaderChildren(root);

  // Also check root-level data arrays with nav-like names
  if (navLinks.length === 0) {
    for (const arr of section.dataArrays) {
      const lowerName = arr.name.toLowerCase();
      if (lowerName.includes("nav") || lowerName.includes("link") || lowerName.includes("menu") || lowerName.includes("item")) {
        for (const item of arr.items) {
          navLinks.push({
            type: "NavLink",
            props: {
              label: String(item.label || item.name || item.title || "Link"),
              href: String(item.href || item.url || item.link || "#"),
            },
          });
        }
      }
    }
  }

  return [
    {
      type: "Header",
      props: {
        logo: {
          type: "text" as const,
          text: logoText || "Logo",
          fontSize: "24px",
          fontWeight: "bold",
        },
        background: {
          type: "solid" as const,
          color: tw.backgroundColor || "#ffffff",
        },
        textColor: tw.color || "#1a1a1a",
        height: tw.height || "70px",
        paddingX: tw.paddingLeft || tw.paddingRight || "24px",
        maxWidth: tw.maxWidth || "1200px",
        sticky: true,
        shadow: "sm" as const,
        layout: "3-column" as const,
        columnGap: tw.gap || "24px",
        verticalAlign: "center" as const,
        leftColumnWidth: "auto",
        centerColumnWidth: "1fr",
        rightColumnWidth: "auto",
        leftContent: navLinks,
        centerContent: [],
        rightContent: ctaButtons,
      },
    },
  ];
}

/**
 * Map a footer section to Puck Footer component.
 */
function mapFooterSection(
  section: ParsedSection,
  theme: ThemeInfo
): PuckComponent[] {
  const root = section.rootElement;
  if (!root) return [createDefaultFooter()];

  const tw = mapTailwindClasses(root.classes);

  // Find column groups in the footer
  const columns: PuckComponent[][] = [];
  const socialLinks: PuckComponent[] = [];

  function collectFooterChildren(el: ParsedElement, depth: number) {
    // Look for grid/flex containers that represent column groups
    const elTw = mapTailwindClasses(el.classes);

    // If this is a grid or flex with multiple children, treat children as columns
    if (
      (elTw.display === "grid" || elTw.display === "flex") &&
      el.children.length >= 2 &&
      depth < 3
    ) {
      for (const child of el.children) {
        const columnContent = extractColumnContent(child, section.dataArrays);
        if (columnContent.length > 0) {
          columns.push(columnContent);
        }
      }
      return;
    }

    // Check for social links
    for (const child of el.children) {
      if (child.tag === "a" && hasSocialIndicator(child)) {
        const platform = detectSocialPlatform(child);
        if (platform) {
          socialLinks.push({
            type: "SocialLink",
            props: {
              platform,
              url: child.attributes.href || "#",
            },
          });
          continue;
        }
      }

      collectFooterChildren(child, depth + 1);
    }
  }

  collectFooterChildren(root, 0);

  // Build column slots
  const columnSlots: Record<string, PuckComponent[]> = {};
  const count = Math.min(columns.length, 4);
  for (let i = 0; i < count; i++) {
    columnSlots[`column${i + 1}`] = columns[i];
  }

  return [
    {
      type: "Footer",
      props: {
        background: {
          type: "solid" as const,
          color: tw.backgroundColor || "#1e293b",
        },
        textColor: tw.color || "#e2e8f0",
        paddingTop: tw.paddingTop || "64px",
        paddingBottom: tw.paddingBottom || "32px",
        paddingX: tw.paddingLeft || "24px",
        maxWidth: tw.maxWidth || "1200px",
        columnsCount: String(Math.max(count, 2)) as "2" | "3" | "4",
        columnsLayout: "equal" as const,
        columnGap: tw.gap || "48px",
        rowGap: "32px",
        mobileStack: true,
        mobileBreakpoint: "768px",
        showDivider: true,
        dividerColor: "rgba(255,255,255,0.1)",
        copyright: {
          show: true,
          text: `\u00A9 ${new Date().getFullYear()} Your Company. All rights reserved.`,
          align: "center" as const,
        },
        ...columnSlots,
        bottomContent: socialLinks,
      },
    },
  ];
}

/**
 * Map a generic section (hero, about, features, etc.) to Puck components.
 */
function mapGenericSection(
  section: ParsedSection,
  theme: ThemeInfo
): PuckComponent[] {
  const root = section.rootElement;
  if (!root) return [];

  const tw = mapTailwindClasses(root.classes);

  // Build the inner content
  const innerContent = mapElementToComponents(root, section.dataArrays, theme, 0);

  // Wrap in Section > Container
  return [
    {
      type: "Section",
      props: {
        slotDirection: "vertical",
        slotGap: "0px",
        slotAlign: "stretch",
        background: buildBackground(tw),
        paddingTop: tw.paddingTop || "48px",
        paddingBottom: tw.paddingBottom || "48px",
        paddingLeft: tw.paddingLeft || "24px",
        paddingRight: tw.paddingRight || "24px",
        maxWidth: tw.maxWidth || "1200px",
        fullWidth: false,
        minHeight: tw.minHeight || "",
        content: [
          {
            type: "Container",
            props: {
              slotDirection: "vertical",
              slotGap: tw.gap || "24px",
              slotAlign: mapAlignToSlot(tw.alignItems),
              maxWidth: "1200px",
              padding: "0px",
              content: innerContent,
            },
          },
        ],
      },
    },
  ];
}

/**
 * Recursively map a ParsedElement to Puck component(s).
 */
function mapElementToComponents(
  el: ParsedElement,
  dataArrays: DataArray[],
  theme: ThemeInfo,
  depth: number
): PuckComponent[] {
  // Skip SVG elements
  if (el.tag === "svg" || el.tag === "path" || el.tag === "circle" || el.tag === "rect") {
    return [];
  }

  // Skip form elements
  if (el.tag === "input" || el.tag === "textarea" || el.tag === "select" || el.tag === "label") {
    return [];
  }

  // Skip script/style
  if (el.tag === "script" || el.tag === "style") return [];

  // Handle Fragment — just map children
  if (el.tag === "Fragment") {
    return el.children.flatMap((c) =>
      mapElementToComponents(c, dataArrays, theme, depth)
    );
  }

  // Handle .map() patterns — expand data arrays
  if (el.mapSource && el.mapItemTemplate) {
    const dataArray = dataArrays.find((d) => d.name === el.mapSource);
    if (dataArray) {
      return expandDataArray(dataArray, el.mapItemTemplate, theme, depth);
    }
  }

  const tw = mapTailwindClasses(el.classes);

  // Map specific HTML tags to Puck components
  switch (el.tag) {
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return [createHeading(el, tw)];

    case "p":
      return [createText(el, tw)];

    case "span":
      // If span has only text and no structural role, make it Text
      if (el.textContent && el.children.length === 0) {
        return [createText(el, tw)];
      }
      // Otherwise, treat as container
      break;

    case "a":
      if (hasButtonClasses(el.classes)) {
        return [createButton(el, tw, theme)];
      }
      return [createButton(el, tw, theme, "link")];

    case "button":
      return [createButton(el, tw, theme)];

    case "img":
    case "Image":
      return [createImage(el, tw)];

    case "hr":
      return [{ type: "Spacer", props: { height: "32px", showDivider: true, dividerColor: tw.borderColor || "#e5e7eb" } }];

    case "form":
      // Wrap form children in a Container
      return mapContainerElement(el, tw, dataArrays, theme, depth);

    case "section":
    case "article":
    case "aside":
    case "main":
      // Map as a section with appropriate styling
      return mapContainerElement(el, tw, dataArrays, theme, depth);
  }

  // PascalCase component references (local imports) — skip or map as container
  if (el.isComponent) {
    // Try to map known component names
    if (el.tag === "Image" || el.tag === "NextImage") {
      return [createImage(el, tw)];
    }
    // Unknown components — skip
    return [];
  }

  // div, nav, header, footer, etc. — map based on classes
  return mapDivElement(el, tw, dataArrays, theme, depth);
}

/**
 * Map a div (or similar block element) based on its Tailwind classes.
 */
function mapDivElement(
  el: ParsedElement,
  tw: TailwindProps,
  dataArrays: DataArray[],
  theme: ThemeInfo,
  depth: number
): PuckComponent[] {
  const children = el.children.flatMap((c) =>
    mapElementToComponents(c, dataArrays, theme, depth + 1)
  );

  // If no children and only text, create a Text component
  if (children.length === 0 && el.textContent) {
    return [createText(el, tw)];
  }

  // Empty div — skip
  if (children.length === 0 && !el.textContent) {
    return [];
  }

  // Grid layout
  if (tw.display === "grid" && tw.gridColumns) {
    return [createGrid(tw, children)];
  }

  // Flex layout
  if (tw.display === "flex") {
    return [createFlex(tw, children)];
  }

  // Max-width container
  if (tw.maxWidth && !tw.display) {
    return [createContainer(tw, children)];
  }

  // If it has text and children, add text as a Text component before children
  if (el.textContent && children.length > 0) {
    const textComp = createText(el, tw);
    return [createContainer(tw, [textComp, ...children])];
  }

  // Single child — don't wrap unnecessarily
  if (children.length === 1 && !tw.backgroundColor && !tw.padding && !tw.borderRadius) {
    return children;
  }

  // Default: wrap in a Container
  return [createContainer(tw, children)];
}

function mapContainerElement(
  el: ParsedElement,
  tw: TailwindProps,
  dataArrays: DataArray[],
  theme: ThemeInfo,
  depth: number
): PuckComponent[] {
  const children = el.children.flatMap((c) =>
    mapElementToComponents(c, dataArrays, theme, depth + 1)
  );

  if (children.length === 0 && el.textContent) {
    return [createText(el, tw)];
  }

  return [createContainer(tw, children)];
}

/**
 * Expand a data array into repeated Puck components.
 */
function expandDataArray(
  dataArray: DataArray,
  template: ParsedElement,
  theme: ThemeInfo,
  depth: number
): PuckComponent[] {
  const components: PuckComponent[] = [];

  for (const item of dataArray.items) {
    // Create a component from the template, substituting data values
    const comp = mapTemplateWithData(template, item, theme, depth);
    if (comp) components.push(comp);
  }

  return components;
}

/**
 * Map a template element with data values substituted.
 */
function mapTemplateWithData(
  template: ParsedElement,
  data: Record<string, unknown>,
  theme: ThemeInfo,
  depth: number
): PuckComponent | null {
  const tw = mapTailwindClasses(template.classes);

  // Build children recursively
  const children: PuckComponent[] = [];

  for (const child of template.children) {
    if (child.tag === "svg" || child.tag === "path") continue;

    const childTw = mapTailwindClasses(child.classes);

    switch (child.tag) {
      case "h1": case "h2": case "h3": case "h4": case "h5": case "h6": {
        const text = resolveDataText(child.textContent, data);
        children.push({
          type: "Heading",
          props: {
            text: text || "Heading",
            level: child.tag as "h1" | "h2" | "h3" | "h4" | "h5" | "h6",
            align: childTw.textAlign || "left",
            color: childTw.color || "#1a1a1a",
            ...(childTw.fontSize ? { fontSize: childTw.fontSize } : {}),
          },
        });
        break;
      }

      case "p": case "span": {
        const text = resolveDataText(child.textContent, data);
        if (text) {
          children.push({
            type: "Text",
            props: {
              text,
              align: childTw.textAlign || "left",
              color: childTw.color || "#374151",
              size: mapFontSizeToTextSize(childTw.fontSize),
            },
          });
        }
        break;
      }

      case "img": case "Image": {
        const src = resolveDataValue(child.attributes.src, data) || "";
        children.push({
          type: "Image",
          props: {
            src: String(src),
            alt: resolveDataValue(child.attributes.alt, data) as string || "",
            aspectRatio: "auto",
            objectFit: "cover",
            borderRadius: childTw.borderRadius || "0px",
            maxWidth: "100%",
            align: "center",
          },
        });
        break;
      }

      case "a": case "button": {
        const label = resolveDataText(child.textContent, data) || "Click";
        children.push({
          type: "Button",
          props: {
            text: label,
            href: (resolveDataValue(child.attributes.href, data) as string) || "#",
            variant: hasButtonClasses(child.classes) ? "primary" : "outline",
            size: "medium",
            align: "left",
          },
        });
        break;
      }

      default: {
        // Recurse for container elements
        const inner = mapTemplateWithData(child, data, theme, depth + 1);
        if (inner) children.push(inner);
      }
    }
  }

  // If only text, return a simple component
  if (children.length === 0 && template.textContent) {
    const text = resolveDataText(template.textContent, data);
    return {
      type: "Text",
      props: {
        text: text || "",
        align: tw.textAlign || "left",
        color: tw.color || "#374151",
        size: "base",
      },
    };
  }

  if (children.length === 0) return null;

  // Wrap in Container
  return {
    type: "Container",
    props: {
      slotDirection: tw.flexDirection === "row" ? "horizontal" : "vertical",
      slotGap: tw.gap || "16px",
      slotAlign: "stretch",
      maxWidth: tw.maxWidth || "100%",
      padding: tw.padding || "24px",
      background: buildBackground(tw),
      borderRadius: tw.borderRadius || "8px",
      boxShadow: "none",
      content: children,
    },
  };
}

function resolveDataText(
  text: string | null,
  data: Record<string, unknown>
): string | null {
  if (!text) return null;

  // Replace {variableName} or {item.prop} with data values
  return text.replace(/\{([^}]+)\}/g, (match, key) => {
    // item.prop or just prop
    const prop = key.split(".").pop() || key;
    const val = data[prop];
    if (val !== undefined && val !== null) return String(val);
    return match;
  });
}

function resolveDataValue(
  value: string | undefined,
  data: Record<string, unknown>
): unknown {
  if (!value) return undefined;
  // {item.src} pattern
  const match = value.match(/^\{([^}]+)\}$/);
  if (match) {
    const prop = match[1].split(".").pop() || match[1];
    return data[prop];
  }
  return value;
}

// ========== Component Creators ==========

function createHeading(el: ParsedElement, tw: TailwindProps): PuckComponent {
  const level = el.tag as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  const text = el.textContent || getDeepText(el) || "Heading";

  return {
    type: "Heading",
    props: {
      text,
      level,
      align: tw.textAlign || "left",
      color: tw.color || "#1a1a1a",
      ...(tw.fontSize ? { fontSize: tw.fontSize } : {}),
    },
  };
}

function createText(el: ParsedElement, tw: TailwindProps): PuckComponent {
  const text = el.textContent || getDeepText(el) || "Text content";

  return {
    type: "Text",
    props: {
      text,
      align: tw.textAlign || "left",
      color: tw.color || "#374151",
      size: mapFontSizeToTextSize(tw.fontSize),
    },
  };
}

function createButton(
  el: ParsedElement,
  tw: TailwindProps,
  theme: ThemeInfo,
  forceVariant?: "primary" | "secondary" | "outline" | "link"
): PuckComponent {
  const label = el.textContent || getDeepText(el) || "Button";

  let variant: "primary" | "secondary" | "outline" = "primary";
  if (forceVariant === "link") {
    variant = "outline";
  } else if (forceVariant) {
    variant = forceVariant;
  } else {
    variant = detectButtonVariant(el.classes);
  }

  return {
    type: "Button",
    props: {
      text: label,
      href: el.attributes.href || "#",
      variant,
      size: detectButtonSize(tw),
      align: tw.textAlign || "left",
    },
  };
}

function createImage(el: ParsedElement, tw: TailwindProps): PuckComponent {
  return {
    type: "Image",
    props: {
      src: el.attributes.src || "",
      alt: el.attributes.alt || "",
      aspectRatio: "auto",
      objectFit: el.classes.includes("object-contain") ? "contain" : "cover",
      borderRadius: tw.borderRadius || "0px",
      maxWidth: tw.maxWidth || "100%",
      align: "center",
    },
  };
}

function createNavLink(el: ParsedElement, tw: TailwindProps): PuckComponent {
  return {
    type: "NavLink",
    props: {
      label: el.textContent || getDeepText(el) || "Link",
      href: el.attributes.href || "#",
    },
  };
}

function createGrid(tw: TailwindProps, children: PuckComponent[]): PuckComponent {
  // Distribute children into column slots
  const cols = tw.gridColumns || 3;
  const columnSlots: Record<string, PuckComponent[]> = {};

  for (let i = 0; i < Math.min(cols, 6); i++) {
    columnSlots[`column${i}`] = [];
  }

  children.forEach((child, idx) => {
    const colIdx = idx % cols;
    if (colIdx < 6) {
      columnSlots[`column${colIdx}`].push(child);
    }
  });

  return {
    type: "Grid",
    props: {
      columns: Math.min(cols, 6),
      gap: tw.gap || "24px",
      alignItems: tw.alignItems || "stretch",
      justifyItems: "stretch",
      ...columnSlots,
    },
  };
}

function createFlex(tw: TailwindProps, children: PuckComponent[]): PuckComponent {
  return {
    type: "Flex",
    props: {
      direction: tw.flexDirection || "row",
      justifyContent: tw.justifyContent || "flex-start",
      alignItems: tw.alignItems || "stretch",
      gap: tw.gap || "16px",
      wrap: "wrap",
      content: children,
    },
  };
}

function createContainer(tw: TailwindProps, children: PuckComponent[]): PuckComponent {
  return {
    type: "Container",
    props: {
      slotDirection: tw.flexDirection === "row" || tw.display === "flex" ? "horizontal" : "vertical",
      slotGap: tw.gap || "16px",
      slotAlign: mapAlignToSlot(tw.alignItems),
      maxWidth: tw.maxWidth || "100%",
      padding: tw.padding || "0px",
      background: buildBackground(tw),
      borderRadius: tw.borderRadius || "0px",
      boxShadow: "none",
      content: children,
    },
  };
}

function createDefaultHeader(): PuckComponent {
  return {
    type: "Header",
    props: {
      logo: { type: "text", text: "Logo", fontSize: "24px", fontWeight: "bold" },
      background: { type: "solid", color: "#ffffff" },
      textColor: "#1a1a1a",
      height: "70px",
      paddingX: "24px",
      maxWidth: "1200px",
      sticky: true,
      shadow: "sm",
      layout: "3-column",
      columnGap: "24px",
      verticalAlign: "center",
      leftColumnWidth: "auto",
      centerColumnWidth: "1fr",
      rightColumnWidth: "auto",
      leftContent: [],
      centerContent: [],
      rightContent: [],
    },
  };
}

function createDefaultFooter(): PuckComponent {
  return {
    type: "Footer",
    props: {
      background: { type: "solid", color: "#1e293b" },
      textColor: "#e2e8f0",
      paddingTop: "64px",
      paddingBottom: "32px",
      paddingX: "24px",
      maxWidth: "1200px",
      columnsCount: "4",
      columnsLayout: "equal",
      columnGap: "48px",
      rowGap: "32px",
      mobileStack: true,
      mobileBreakpoint: "768px",
      showDivider: true,
      dividerColor: "rgba(255,255,255,0.1)",
      copyright: {
        show: true,
        text: `\u00A9 ${new Date().getFullYear()} Your Company. All rights reserved.`,
        align: "center",
      },
      column1: [],
      column2: [],
      column3: [],
      column4: [],
      bottomContent: [],
    },
  };
}

// ========== Helpers ==========

function getDeepText(el: ParsedElement): string {
  const parts: string[] = [];
  if (el.textContent) parts.push(el.textContent);
  for (const child of el.children) {
    if (child.textContent) parts.push(child.textContent);
    else parts.push(getDeepText(child));
  }
  return parts.filter(Boolean).join(" ").trim();
}

function hasButtonClasses(classes: string[]): boolean {
  return classes.some(
    (c) =>
      c.includes("btn") ||
      c.includes("button") ||
      c === "bg-primary" ||
      c === "bg-blue-600" ||
      c === "bg-blue-500" ||
      c.match(/^bg-\w+-\d{3,}$/) !== null ||
      c === "rounded-full" ||
      c === "rounded-lg" ||
      (c.includes("px-") && classes.includes("py-2")) ||
      (c.includes("px-") && classes.includes("py-3"))
  );
}

function detectButtonVariant(classes: string[]): "primary" | "secondary" | "outline" {
  const classStr = classes.join(" ");

  if (classStr.includes("outline") || classStr.includes("border") || classStr.includes("ghost")) {
    return "outline";
  }
  if (classStr.includes("secondary") || classStr.includes("bg-gray") || classStr.includes("bg-neutral") || classStr.includes("bg-slate") || classStr.includes("bg-white")) {
    return "secondary";
  }
  return "primary";
}

function detectButtonSize(tw: TailwindProps): "small" | "medium" | "large" {
  const fontSize = tw.fontSize;
  if (fontSize) {
    const px = parseInt(fontSize);
    if (px <= 14) return "small";
    if (px >= 18) return "large";
  }
  return "medium";
}

function mapFontSizeToTextSize(fontSize: string | undefined): "small" | "base" | "large" {
  if (!fontSize) return "base";
  const px = parseInt(fontSize);
  if (px <= 14) return "small";
  if (px >= 20) return "large";
  return "base";
}

function mapAlignToSlot(align: string | undefined): string {
  switch (align) {
    case "center": return "center";
    case "flex-start": return "start";
    case "flex-end": return "end";
    case "stretch": return "stretch";
    case "space-between": return "space-between";
    default: return "stretch";
  }
}

function buildBackground(tw: TailwindProps): Record<string, unknown> {
  if (tw.backgroundColor && tw.backgroundColor !== "transparent") {
    return {
      type: "solid",
      color: tw.backgroundColor,
    };
  }
  return {
    type: "none",
  };
}

function extractColumnContent(
  el: ParsedElement,
  dataArrays: DataArray[]
): PuckComponent[] {
  const components: PuckComponent[] = [];

  // Find title/heading
  for (const child of el.children) {
    if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(child.tag)) {
      const tw = mapTailwindClasses(child.classes);
      components.push({
        type: "FooterColumn",
        props: {
          title: child.textContent || getDeepText(child) || "Column",
          titleColor: tw.color || "#ffffff",
          titleSize: tw.fontSize || "18px",
          showTitle: true,
          gap: "12px",
          content: extractFooterLinks(el, dataArrays),
        },
      });
      return components;
    }
  }

  // No heading found — check for strong/bold text as title
  for (const child of el.children) {
    if (child.tag === "p" || child.tag === "span" || child.tag === "div") {
      const tw = mapTailwindClasses(child.classes);
      if (tw.fontWeight === "bold" || tw.fontWeight === "600" || child.classes.includes("font-bold") || child.classes.includes("font-semibold")) {
        components.push({
          type: "FooterColumn",
          props: {
            title: child.textContent || getDeepText(child) || "Column",
            titleColor: tw.color || "#ffffff",
            titleSize: tw.fontSize || "18px",
            showTitle: true,
            gap: "12px",
            content: extractFooterLinks(el, dataArrays),
          },
        });
        return components;
      }
    }
  }

  // Fallback: all links as FooterLinks
  const links = extractFooterLinks(el, dataArrays);
  if (links.length > 0) {
    components.push({
      type: "FooterColumn",
      props: {
        title: "Links",
        showTitle: false,
        gap: "12px",
        content: links,
      },
    });
  }

  return components;
}

function extractFooterLinks(
  el: ParsedElement,
  dataArrays: DataArray[]
): PuckComponent[] {
  const links: PuckComponent[] = [];

  function walkForLinks(node: ParsedElement) {
    // Check for .map() data expansion
    if (node.mapSource && node.mapItemTemplate) {
      const arr = dataArrays.find((d) => d.name === node.mapSource);
      if (arr) {
        for (const item of arr.items) {
          links.push({
            type: "FooterLink",
            props: {
              label: String(item.label || item.name || item.title || "Link"),
              href: String(item.href || item.url || item.link || "#"),
            },
          });
        }
        return;
      }
    }

    for (const child of node.children) {
      if (child.tag === "a") {
        links.push({
          type: "FooterLink",
          props: {
            label: child.textContent || getDeepText(child) || "Link",
            href: child.attributes.href || "#",
          },
        });
      } else {
        walkForLinks(child);
      }
    }
  }

  walkForLinks(el);
  return links;
}

function hasSocialIndicator(el: ParsedElement): boolean {
  const href = (el.attributes.href || "").toLowerCase();
  const ariaLabel = (el.attributes["aria-label"] || "").toLowerCase();

  return (
    href.includes("facebook") ||
    href.includes("twitter") ||
    href.includes("instagram") ||
    href.includes("linkedin") ||
    href.includes("youtube") ||
    href.includes("github") ||
    href.includes("tiktok") ||
    ariaLabel.includes("facebook") ||
    ariaLabel.includes("twitter") ||
    ariaLabel.includes("instagram") ||
    ariaLabel.includes("linkedin") ||
    ariaLabel.includes("github") ||
    // Has an SVG child (icon)
    el.children.some((c) => c.tag === "svg")
  );
}

function detectSocialPlatform(el: ParsedElement): string | null {
  const href = (el.attributes.href || "").toLowerCase();
  const ariaLabel = (el.attributes["aria-label"] || "").toLowerCase();
  const combined = href + " " + ariaLabel;

  if (combined.includes("facebook")) return "facebook";
  if (combined.includes("twitter") || combined.includes("x.com")) return "twitter";
  if (combined.includes("instagram")) return "instagram";
  if (combined.includes("linkedin")) return "linkedin";
  if (combined.includes("youtube")) return "youtube";
  if (combined.includes("github")) return "github";
  if (combined.includes("tiktok")) return "tiktok";
  return null;
}

function countComponents(components: PuckComponent[]): number {
  let count = 0;
  for (const comp of components) {
    count++;
    // Count nested content
    for (const [key, value] of Object.entries(comp.props)) {
      if (Array.isArray(value)) {
        count += countComponents(value as PuckComponent[]);
      } else if (key === "content" && Array.isArray(value)) {
        count += countComponents(value as PuckComponent[]);
      }
    }
  }
  return count;
}
