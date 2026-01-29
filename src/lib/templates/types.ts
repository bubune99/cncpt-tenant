/**
 * Template System Types
 *
 * Types for seeded templates and template management
 */

import { ComponentNode } from "../v0-agent/types";

/**
 * A seeded template that comes pre-built with the CMS
 */
export interface SeedTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  thumbnail?: string;

  // The Puck page content
  content: PuckPageContent;

  // Metadata
  author?: string;
  version: string;
  createdAt: string;

  // Feature flags
  isPremium?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
}

/**
 * Template categories
 */
export type TemplateCategory =
  | "landing"
  | "marketing"
  | "saas"
  | "ecommerce"
  | "portfolio"
  | "blog"
  | "pricing"
  | "about"
  | "contact"
  | "coming-soon"
  | "error"
  | "custom";

/**
 * Puck page content structure
 */
export interface PuckPageContent {
  root: {
    props?: Record<string, unknown>;
  };
  content: ComponentNode[];
  zones?: Record<string, ComponentNode[]>;
}

/**
 * Request to create a page from a template
 */
export interface CreatePageFromTemplateRequest {
  templateId: string;
  title: string;
  slug: string;
  description?: string;
  openInEditor?: boolean;
}

/**
 * Result of creating a page from template
 */
export interface CreatePageFromTemplateResult {
  success: boolean;
  page?: {
    id: string;
    title: string;
    slug: string;
    editorUrl: string;
    previewUrl: string;
  };
  error?: string;
}

/**
 * Request to import a v0 component as a page
 */
export interface V0PageImportRequest {
  url: string;
  title: string;
  slug: string;
  description?: string;
  category?: TemplateCategory;
  openInEditor?: boolean;
}

/**
 * Result of v0 page import
 */
export interface V0PageImportResult {
  success: boolean;
  page?: {
    id: string;
    title: string;
    slug: string;
    editorUrl: string;
    previewUrl: string;
  };
  template?: {
    id: string;
    name: string;
  };
  warnings?: string[];
  errors?: string[];
}

/**
 * Template plugin interface
 */
export interface TemplatePlugin {
  id: string;
  name: string;
  description: string;

  // Get all templates from this plugin
  getTemplates(): Promise<SeedTemplate[]>;

  // Get a specific template
  getTemplate(id: string): Promise<SeedTemplate | null>;

  // Check if plugin has a template
  hasTemplate(id: string): Promise<boolean>;
}

/**
 * Template registry for managing multiple template sources
 */
export interface TemplateRegistry {
  // Register a template plugin
  register(plugin: TemplatePlugin): void;

  // Unregister a plugin
  unregister(pluginId: string): void;

  // Get all templates from all plugins
  getAllTemplates(): Promise<SeedTemplate[]>;

  // Get templates by category
  getTemplatesByCategory(category: TemplateCategory): Promise<SeedTemplate[]>;

  // Get a specific template
  getTemplate(id: string): Promise<SeedTemplate | null>;

  // Search templates
  searchTemplates(query: string): Promise<SeedTemplate[]>;
}
