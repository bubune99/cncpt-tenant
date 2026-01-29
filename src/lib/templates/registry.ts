/**
 * Template Registry
 *
 * Manages template plugins and provides unified access to all templates
 */

import {
  TemplateRegistry,
  TemplatePlugin,
  SeedTemplate,
  TemplateCategory,
} from "./types";

class TemplateRegistryImpl implements TemplateRegistry {
  private plugins: Map<string, TemplatePlugin> = new Map();

  /**
   * Register a template plugin
   */
  register(plugin: TemplatePlugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Template plugin '${plugin.id}' is already registered. Replacing...`);
    }
    this.plugins.set(plugin.id, plugin);
    console.log(`Template plugin '${plugin.id}' registered`);
  }

  /**
   * Unregister a plugin
   */
  unregister(pluginId: string): void {
    if (this.plugins.delete(pluginId)) {
      console.log(`Template plugin '${pluginId}' unregistered`);
    }
  }

  /**
   * Get all templates from all plugins
   */
  async getAllTemplates(): Promise<SeedTemplate[]> {
    const allTemplates: SeedTemplate[] = [];

    for (const plugin of this.plugins.values()) {
      try {
        const templates = await plugin.getTemplates();
        allTemplates.push(...templates);
      } catch (error) {
        console.error(`Failed to get templates from plugin '${plugin.id}':`, error);
      }
    }

    // Sort by featured first, then by name
    return allTemplates.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: TemplateCategory): Promise<SeedTemplate[]> {
    const allTemplates = await this.getAllTemplates();
    return allTemplates.filter((t) => t.category === category);
  }

  /**
   * Get a specific template by ID
   */
  async getTemplate(id: string): Promise<SeedTemplate | null> {
    for (const plugin of this.plugins.values()) {
      try {
        if (await plugin.hasTemplate(id)) {
          return await plugin.getTemplate(id);
        }
      } catch (error) {
        console.error(`Error checking template '${id}' in plugin '${plugin.id}':`, error);
      }
    }
    return null;
  }

  /**
   * Search templates by query
   */
  async searchTemplates(query: string): Promise<SeedTemplate[]> {
    const allTemplates = await this.getAllTemplates();
    const lowerQuery = query.toLowerCase();

    return allTemplates.filter(
      (t) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get list of registered plugins
   */
  getPlugins(): TemplatePlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Check if a plugin is registered
   */
  hasPlugin(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }
}

// Singleton instance
let registryInstance: TemplateRegistryImpl | null = null;

/**
 * Get the template registry instance
 */
export function getTemplateRegistry(): TemplateRegistry {
  if (!registryInstance) {
    registryInstance = new TemplateRegistryImpl();
  }
  return registryInstance;
}

/**
 * Register a template plugin
 */
export function registerTemplatePlugin(plugin: TemplatePlugin): void {
  getTemplateRegistry().register(plugin);
}

/**
 * Unregister a template plugin
 */
export function unregisterTemplatePlugin(pluginId: string): void {
  getTemplateRegistry().unregister(pluginId);
}

export default getTemplateRegistry;
