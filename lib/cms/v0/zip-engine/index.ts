/**
 * v0 ZIP Import Engine
 *
 * Pipeline orchestrator that converts v0.dev ZIP exports into
 * editor-compatible JSON templates. Deterministic, no AI required.
 *
 * Pipeline: ZIP → Extract → Parse → Theme → Map → Assemble
 */

export { extractZip, extractProjectTitle } from "./extractor";
export type { ExtractedFile, ExtractedProject } from "./extractor";

export { parseSection } from "./ast-parser";
export type { ParsedSection, ParsedElement, DataArray } from "./ast-parser";

export { extractTheme } from "./theme-extractor";
export type { ThemeInfo } from "./theme-extractor";

export { mapTailwindClasses } from "./tailwind-mapper";
export type { TailwindProps } from "./tailwind-mapper";

export { mapSectionToComponents, resetIdCounter } from "./element-mapper";
export type { EditorComponent, EditorContent, DecomposedSection } from "./element-mapper";

export {
  assembleResult,
  buildTemplatePaylod,
  buildPageTemplatePayload,
  getImportOrder,
} from "./template-assembler";
export type { ZipImportResult } from "./template-assembler";

import { extractZip, extractProjectTitle } from "./extractor";
import { parseSection } from "./ast-parser";
import { extractTheme } from "./theme-extractor";
import { mapSectionToComponents, resetIdCounter } from "./element-mapper";
import { assembleResult, getImportOrder } from "./template-assembler";
import type { DecomposedSection } from "./element-mapper";
import type { ZipImportResult } from "./template-assembler";

/**
 * Process a v0 ZIP file end-to-end.
 *
 * @param buffer - ZIP file contents as a Buffer
 * @param zipFilename - Original filename for title extraction
 * @returns Decomposed sections and full page template
 */
export async function processV0Zip(
  buffer: Buffer,
  zipFilename: string = "v0-project.zip"
): Promise<ZipImportResult> {
  resetIdCounter();

  // Step 1: Extract files from ZIP
  const project = extractZip(buffer);

  // Step 2: Extract theme (fonts + colors)
  const theme = extractTheme(project.globalsCss, project.layoutFile);

  // Step 3: Parse and map each section component
  const sections: DecomposedSection[] = [];

  for (const file of project.sectionFiles) {
    try {
      const parsed = parseSection(file.content, file.path);
      const mapped = mapSectionToComponents(parsed, theme, file.path);
      sections.push(mapped);
    } catch (err) {
      console.warn(`[v0-zip] Failed to parse ${file.path}:`, err);
      // Skip files that fail to parse — don't block the whole import
    }
  }

  // Step 4: Sort sections by page.tsx import order
  if (project.pageFile) {
    const order = getImportOrder(project.pageFile.content);
    if (order.length > 0) {
      sections.sort((a, b) => {
        const aIdx = order.findIndex(
          (name) => name.toLowerCase() === a.name.toLowerCase()
        );
        const bIdx = order.findIndex(
          (name) => name.toLowerCase() === b.name.toLowerCase()
        );
        // Unknown sections go to the end
        const aPos = aIdx === -1 ? 999 : aIdx;
        const bPos = bIdx === -1 ? 999 : bIdx;
        return aPos - bPos;
      });
    }
  }

  // Step 5: Determine page title
  const pageTitle = extractProjectTitle(
    zipFilename,
    project.pageFile?.content || null
  );

  // Step 6: Assemble result
  return assembleResult(sections, theme, pageTitle);
}
