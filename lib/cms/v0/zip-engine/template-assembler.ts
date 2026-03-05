/**
 * Template Assembler
 *
 * Assembles decomposed sections into editor template format,
 * ready for storage via the Template API.
 */

import type { DecomposedSection, EditorContent, EditorComponent } from "./element-mapper";
import type { ThemeInfo } from "./theme-extractor";

export interface ZipImportResult {
  sections: DecomposedSection[];
  fullPage: EditorContent;
  theme: ThemeInfo;
  pageTitle: string;
}

/**
 * Assemble the final import result from decomposed sections.
 */
export function assembleResult(
  sections: DecomposedSection[],
  theme: ThemeInfo,
  pageTitle: string
): ZipImportResult {
  // Build full page content from all sections
  const fullPage = buildFullPage(sections, pageTitle);

  return {
    sections,
    fullPage,
    theme,
    pageTitle,
  };
}

/**
 * Build a full page EditorContent from all sections combined.
 */
function buildFullPage(
  sections: DecomposedSection[],
  pageTitle: string
): EditorContent {
  const allContent: EditorComponent[] = [];

  for (const section of sections) {
    // Flatten section content into the page
    allContent.push(...section.content.content);
  }

  return {
    root: { props: { title: pageTitle } },
    content: allContent,
  };
}

/**
 * Build a template creation payload for a single section.
 */
export function buildTemplatePaylod(
  section: DecomposedSection,
  compatibleConfigs: string[] = ["pages", "blog"]
): {
  name: string;
  description: string;
  type: "SECTION" | "PAGE";
  compatibleConfigs: string[];
  content: EditorContent;
  category: string;
  tags: string[];
} {
  return {
    name: section.name,
    description: `Imported from v0 ZIP — ${section.type} section with ${section.componentCount} components`,
    type: "SECTION",
    compatibleConfigs,
    content: section.content,
    category: mapSectionTypeToCategory(section.type),
    tags: ["v0-import", section.type],
  };
}

/**
 * Build a template creation payload for the full page.
 */
export function buildPageTemplatePayload(
  sections: DecomposedSection[],
  pageTitle: string,
  compatibleConfigs: string[] = ["pages"]
): {
  name: string;
  description: string;
  type: "SECTION" | "PAGE";
  compatibleConfigs: string[];
  content: EditorContent;
  category: string;
  tags: string[];
} {
  const fullPage = buildFullPage(sections, pageTitle);

  return {
    name: pageTitle,
    description: `Full page imported from v0 ZIP — ${sections.length} sections, ${sections.reduce((sum, s) => sum + s.componentCount, 0)} components total`,
    type: "PAGE",
    compatibleConfigs,
    content: fullPage,
    category: "Full Pages",
    tags: ["v0-import", "full-page"],
  };
}

function mapSectionTypeToCategory(type: DecomposedSection["type"]): string {
  switch (type) {
    case "header":
      return "Headers";
    case "footer":
      return "Footers";
    case "hero":
      return "Hero Sections";
    case "section":
      return "Content Sections";
    default:
      return "Other";
  }
}

/**
 * Determine section order from page.tsx import order.
 *
 * v0 page.tsx typically has imports in the order components appear:
 * import Navigation from "./components/navigation"
 * import Hero from "./components/hero"
 * import About from "./components/about"
 * ...
 *
 * Returns an array of component names in import order.
 */
export function getImportOrder(pageContent: string | null): string[] {
  if (!pageContent) return [];

  const order: string[] = [];

  // Match import statements to get order
  const importRegex = /import\s+(\w+)\s+from\s+["']\.?\/?(?:\.\/)?(?:components\/)?([^"']+)["']/g;
  let match;

  while ((match = importRegex.exec(pageContent)) !== null) {
    order.push(match[1]); // Component name
  }

  // Also try matching JSX usage order as fallback
  if (order.length === 0) {
    const jsxRegex = /<(\w+)\s*\/?\s*>/g;
    while ((match = jsxRegex.exec(pageContent)) !== null) {
      const tag = match[1];
      if (/^[A-Z]/.test(tag) && !order.includes(tag)) {
        order.push(tag);
      }
    }
  }

  return order;
}
