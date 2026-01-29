import { z } from "zod";

// Schema for adding a new component to the page
export const addComponentSchema = z.object({
  componentType: z
    .string()
    .describe("The type of component to add (e.g., 'Section', 'Heading', 'Button')"),
  props: z
    .record(z.string(), z.any())
    .optional()
    .describe("Optional props to set on the component"),
  parentId: z
    .string()
    .optional()
    .describe("ID of the parent component to add this component into. If not provided, adds to root content."),
  position: z
    .enum(["start", "end"])
    .optional()
    .default("end")
    .describe("Where to insert the component: 'start' or 'end' of the parent's content"),
});

// Schema for editing an existing component's props
export const editComponentSchema = z.object({
  componentId: z
    .string()
    .describe("The ID of the component to edit"),
  props: z
    .record(z.string(), z.any())
    .describe("The props to update on the component (will be merged with existing props)"),
});

// Schema for removing a component
export const removeComponentSchema = z.object({
  componentId: z
    .string()
    .describe("The ID of the component to remove"),
});

// Schema for moving a component
export const moveComponentSchema = z.object({
  componentId: z
    .string()
    .describe("The ID of the component to move"),
  targetParentId: z
    .string()
    .optional()
    .describe("The ID of the new parent component. If not provided, moves to root content."),
  position: z
    .union([z.literal("start"), z.literal("end"), z.number()])
    .optional()
    .default("end")
    .describe("Position in the target: 'start', 'end', or a specific index number"),
});

// Schema for duplicating a component
export const duplicateComponentSchema = z.object({
  componentId: z
    .string()
    .describe("The ID of the component to duplicate"),
  insertAfter: z
    .boolean()
    .optional()
    .default(true)
    .describe("If true, insert the duplicate after the original. If false, insert at the end of the parent."),
});

// Schema for getting current page state (no params needed, but we define it for consistency)
export const getPageStateSchema = z.object({
  includeFullTree: z
    .boolean()
    .optional()
    .default(false)
    .describe("If true, returns the complete component tree. If false, returns a summary."),
});

// Schema for generating a full layout section
export const generateLayoutSchema = z.object({
  layoutType: z
    .enum([
      "hero-split",
      "hero-centered",
      "features-grid",
      "pricing-table",
      "testimonials",
      "cta-section",
      "custom",
    ])
    .describe("The type of layout section to generate"),
  customPrompt: z
    .string()
    .optional()
    .describe("Custom prompt for the 'custom' layout type, describing what to generate"),
  replaceAll: z
    .boolean()
    .optional()
    .default(false)
    .describe("If true, replace all existing content. If false, append to existing content."),
});

// Schema for selecting/highlighting a component in the editor
export const selectComponentSchema = z.object({
  componentId: z
    .string()
    .describe("The ID of the component to select and highlight in the editor"),
});

// Schema for searching available images
export const searchImagesSchema = z.object({
  category: z
    .enum(["heroes", "features", "team", "products", "backgrounds"])
    .optional()
    .describe("Filter images by category"),
  search: z
    .string()
    .optional()
    .describe("Search term to filter images by name or tags"),
});

// Schema for getting component help documentation
export const getComponentHelpSchema = z.object({
  componentType: z
    .string()
    .describe("The component type to get help for (e.g., 'Heading', 'Section', 'Grid')"),
});

// Export type helpers
export type AddComponentInput = z.infer<typeof addComponentSchema>;
export type EditComponentInput = z.infer<typeof editComponentSchema>;
export type RemoveComponentInput = z.infer<typeof removeComponentSchema>;
export type MoveComponentInput = z.infer<typeof moveComponentSchema>;
export type DuplicateComponentInput = z.infer<typeof duplicateComponentSchema>;
export type GetPageStateInput = z.infer<typeof getPageStateSchema>;
export type GenerateLayoutInput = z.infer<typeof generateLayoutSchema>;
export type SelectComponentInput = z.infer<typeof selectComponentSchema>;
export type SearchImagesInput = z.infer<typeof searchImagesSchema>;
export type GetComponentHelpInput = z.infer<typeof getComponentHelpSchema>;
