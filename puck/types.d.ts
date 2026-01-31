/**
 * Puck Type Extensions
 *
 * Extends @puckeditor/core types to include our custom `ai` property
 * for AI-assisted page building.
 *
 * Note: ComponentConfig is a generic type in Puck, so we extend
 * ComponentConfigExtensions which is the interface that ComponentConfig
 * picks up properties from.
 */

import "@puckeditor/core";

declare module "@puckeditor/core" {
  interface ComponentConfigExtensions {
    /**
     * AI instructions for this component.
     * Helps the AI understand how and when to use the component.
     */
    ai?: {
      /** Instructions for the AI on how to use this component */
      instructions?: string;
      /** Whether AI should avoid using this component */
      hidden?: boolean;
      /** Suggested use cases */
      useCases?: string[];
      /** Related components AI might want to use together */
      relatedComponents?: string[];
    };
  }
}
