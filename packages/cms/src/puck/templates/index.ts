export * from "./types";
export * from "./marketing";

import { marketingTemplates } from "./marketing";

// All available templates
export const allTemplates = {
  ...marketingTemplates,
};

// Get templates by category
export function getTemplatesByCategory(category: string) {
  return Object.values(allTemplates).filter(t => t.category === category);
}

// Get all template categories
export function getTemplateCategories() {
  const categories = new Set(Object.values(allTemplates).map(t => t.category));
  return Array.from(categories);
}
