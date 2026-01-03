/**
 * Email Template Renderer
 *
 * Renders email templates with merge tags and provides
 * a unified interface for generating transactional emails.
 */

import { parseMergeTags, MergeTagData } from '../merge-tags';
import { baseTemplate, BaseTemplateOptions, emailComponents } from './base';

export interface StoreConfig {
  name: string;
  url: string;
  supportEmail: string;
  logoUrl?: string;
  brandColor?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
}

export interface RenderOptions {
  /** Store configuration */
  store?: Partial<StoreConfig>;
  /** Additional merge tag data */
  data?: MergeTagData;
}

/**
 * Default store config - can be overridden per-render or via settings
 */
const defaultStoreConfig: StoreConfig = {
  name: 'Our Store',
  url: 'https://example.com',
  supportEmail: 'support@example.com',
};

/**
 * Recursively convert Date objects to ISO strings in data
 */
function sanitizeData(data: unknown): MergeTagData {
  if (data === null || data === undefined) {
    return {};
  }

  if (data instanceof Date) {
    return data.toISOString() as unknown as MergeTagData;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData) as unknown as MergeTagData;
  }

  if (typeof data === 'object') {
    const result: MergeTagData = {};
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Date) {
        result[key] = value.toISOString();
      } else if (Array.isArray(value)) {
        result[key] = value.map(sanitizeData) as MergeTagData[];
      } else if (typeof value === 'object' && value !== null) {
        result[key] = sanitizeData(value);
      } else {
        result[key] = value as string | number | boolean | null | undefined;
      }
    }
    return result;
  }

  return data as unknown as MergeTagData;
}

/**
 * Renders an email template with merge tags
 */
export function renderTemplate(
  template: string,
  data: Record<string, unknown>,
  options: RenderOptions = {}
): string {
  const { store = {} } = options;

  // Merge store config with data
  const dataStore = typeof data.store === 'object' && data.store !== null ? data.store as Record<string, unknown> : {};
  const mergedData: Record<string, unknown> = {
    ...data,
    store: {
      ...defaultStoreConfig,
      ...store,
      ...dataStore,
    },
    currentYear: new Date().getFullYear().toString(),
  };

  // Sanitize data (convert Dates to strings)
  const sanitizedData = sanitizeData(mergedData);

  // Process merge tags
  return parseMergeTags(template, sanitizedData);
}

/**
 * Wraps content in the base email template
 */
export function wrapInBaseTemplate(
  content: string,
  options: Partial<BaseTemplateOptions> & { store?: Partial<StoreConfig> }
): string {
  const store = options.store || {};

  return baseTemplate({
    title: options.title || 'Email from ' + (store.name || defaultStoreConfig.name),
    preheader: options.preheader,
    content,
    footerContent: options.footerContent,
    brandColor: store.brandColor || options.brandColor,
    logoUrl: store.logoUrl || options.logoUrl,
    storeName: store.name || defaultStoreConfig.name,
    storeUrl: store.url || defaultStoreConfig.url,
    supportEmail: store.supportEmail || defaultStoreConfig.supportEmail,
    unsubscribeUrl: options.unsubscribeUrl,
    socialLinks: store.socialLinks || options.socialLinks,
  });
}

/**
 * Complete email rendering: wraps in base template and processes merge tags
 */
export function renderEmail(
  content: string,
  templateOptions: Partial<BaseTemplateOptions>,
  data: Record<string, unknown>,
  renderOptions: RenderOptions = {}
): string {
  const store = renderOptions.store || {};

  // First wrap in base template
  const wrappedHtml = wrapInBaseTemplate(content, {
    ...templateOptions,
    store,
  });

  // Then process merge tags
  return renderTemplate(wrappedHtml, data, renderOptions);
}

/**
 * Generate plain text version from HTML (basic conversion)
 */
export function htmlToPlainText(html: string): string {
  return html
    // Remove style and script tags with content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Convert links to text with URL
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '$2 ($1)')
    // Convert headings to uppercase with newlines
    .replace(/<h[1-6][^>]*>([^<]*)<\/h[1-6]>/gi, '\n\n$1\n')
    // Convert paragraphs and divs to newlines
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    // Convert list items
    .replace(/<li[^>]*>/gi, '\n- ')
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode common HTML entities
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&zwnj;/g, '')
    // Clean up whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .trim();
}

/**
 * Template builder for creating email content
 */
export class EmailTemplateBuilder {
  private content: string[] = [];
  private store: Partial<StoreConfig> = {};

  constructor(store?: Partial<StoreConfig>) {
    if (store) {
      this.store = store;
    }
  }

  /**
   * Add a heading
   */
  heading(text: string, level: 1 | 2 | 3 = 1): this {
    const headingFn = emailComponents.heading[`h${level}`];
    this.content.push(headingFn(text));
    return this;
  }

  /**
   * Add a paragraph
   */
  paragraph(text: string): this {
    this.content.push(emailComponents.paragraph(text));
    return this;
  }

  /**
   * Add muted/secondary text
   */
  muted(text: string): this {
    this.content.push(emailComponents.mutedText(text));
    return this;
  }

  /**
   * Add a primary button
   */
  button(text: string, url: string, color?: string): this {
    this.content.push(emailComponents.button(text, url, color || this.store.brandColor));
    return this;
  }

  /**
   * Add an outline button
   */
  buttonOutline(text: string, url: string, color?: string): this {
    this.content.push(emailComponents.buttonOutline(text, url, color || this.store.brandColor));
    return this;
  }

  /**
   * Add a divider
   */
  divider(): this {
    this.content.push(emailComponents.divider());
    return this;
  }

  /**
   * Add an info box
   */
  info(content: string): this {
    this.content.push(emailComponents.infoBox(content));
    return this;
  }

  /**
   * Add a success box
   */
  success(content: string): this {
    this.content.push(emailComponents.successBox(content));
    return this;
  }

  /**
   * Add a warning box
   */
  warning(content: string): this {
    this.content.push(emailComponents.warningBox(content));
    return this;
  }

  /**
   * Add an image
   */
  image(src: string, alt: string, width?: number, caption?: string): this {
    this.content.push(emailComponents.image(src, alt, width, caption));
    return this;
  }

  /**
   * Add raw HTML
   */
  raw(html: string): this {
    this.content.push(html);
    return this;
  }

  /**
   * Add two-column layout
   */
  twoColumn(left: string, right: string): this {
    this.content.push(emailComponents.twoColumn(left, right));
    return this;
  }

  /**
   * Build the content string
   */
  build(): string {
    return this.content.join('\n');
  }

  /**
   * Build and wrap in base template
   */
  buildWithWrapper(options: Partial<BaseTemplateOptions>): string {
    return wrapInBaseTemplate(this.build(), {
      ...options,
      store: this.store,
    });
  }

  /**
   * Build, wrap, and render with data
   */
  render(
    templateOptions: Partial<BaseTemplateOptions>,
    data: Record<string, unknown>,
    renderOptions?: RenderOptions
  ): string {
    return renderEmail(this.build(), templateOptions, data, {
      ...renderOptions,
      store: { ...this.store, ...renderOptions?.store },
    });
  }
}

/**
 * Create a new template builder
 */
export function createEmailBuilder(store?: Partial<StoreConfig>): EmailTemplateBuilder {
  return new EmailTemplateBuilder(store);
}

// Re-export components for direct use
export { emailComponents };

// Re-export MergeTagData type for consumers
export type { MergeTagData };
