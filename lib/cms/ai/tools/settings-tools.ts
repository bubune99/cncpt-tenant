/**
 * Settings CRUD Tools
 *
 * AI tools for updating site settings, branding, and layout configuration.
 * Uses the existing settings helpers to ensure encryption is handled properly.
 */

import { tool } from 'ai';
import { z } from 'zod';

async function getDb() {
  try {
    const { prisma } = await import('../../db');
    return prisma;
  } catch (error) {
    console.error('[SettingsTools] Failed to import database:', error);
    throw new Error('Database connection unavailable');
  }
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 5000,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

export const updateSettings = tool({
  description: 'Update settings by group. Uses the settings encryption layer for sensitive values. Does NOT support modifying API keys or secrets — only non-sensitive settings.',
  inputSchema: z.object({
    group: z.enum(['general', 'branding', 'store', 'shipping', 'analytics', 'seo']).describe('Settings group to update'),
    values: z.record(z.string(), z.any()).describe('Key-value pairs to update'),
  }),
  execute: async ({ group, values }) => {
    try {
      const { updateSettings: updateSettingsFn } = await import('../../settings');

      await withTimeout(
        updateSettingsFn(group, values),
        8000,
        'Update settings timed out'
      );

      return {
        success: true,
        group,
        updatedKeys: Object.keys(values),
        message: `Updated ${Object.keys(values).length} setting(s) in "${group}" group`,
      };
    } catch (error) {
      console.error('[SettingsTools] updateSettings error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update settings' };
    }
  },
});

export const updateBrandingSettings = tool({
  description: 'Update site branding and theme settings like colors, site name, and logo.',
  inputSchema: z.object({
    siteName: z.string().optional().describe('Site/store name'),
    primaryColor: z.string().optional().describe('Primary brand color (hex, e.g. #3B82F6)'),
    accentColor: z.string().optional().describe('Accent color (hex)'),
    logo: z.string().optional().describe('Logo URL or media ID'),
    favicon: z.string().optional().describe('Favicon URL or media ID'),
    fontFamily: z.string().optional().describe('Primary font family'),
    borderRadius: z.string().optional().describe('Default border radius (e.g. "8px")'),
  }),
  execute: async ({ siteName, primaryColor, accentColor, logo, favicon, fontFamily, borderRadius }) => {
    try {
      const { updateSettings: updateSettingsFn, getBrandingSettings } = await import('../../settings');

      const values: Record<string, any> = {};
      if (siteName !== undefined) values.siteName = siteName;
      if (primaryColor !== undefined) values.primaryColor = primaryColor;
      if (accentColor !== undefined) values.accentColor = accentColor;
      if (logo !== undefined) values.logo = logo;
      if (favicon !== undefined) values.favicon = favicon;
      if (fontFamily !== undefined) values.fontFamily = fontFamily;
      if (borderRadius !== undefined) values.borderRadius = borderRadius;

      if (Object.keys(values).length === 0) {
        return { success: false, error: 'No values provided to update' };
      }

      await withTimeout(
        updateSettingsFn('branding', values),
        8000,
        'Update branding settings timed out'
      );

      // Fetch updated settings to return
      const updated = await getBrandingSettings();

      return {
        success: true,
        updatedKeys: Object.keys(values),
        branding: {
          siteName: updated.siteName,
          primaryColor: updated.primaryColor,
          accentColor: updated.accentColor,
        },
        message: `Branding settings updated: ${Object.keys(values).join(', ')}`,
      };
    } catch (error) {
      console.error('[SettingsTools] updateBrandingSettings error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update branding settings' };
    }
  },
});

export const updateSiteSettings = tool({
  description: 'Update site layout configuration — header, footer, and announcement bar.',
  inputSchema: z.object({
    headerConfig: z.record(z.string(), z.any()).optional().describe('Header layout configuration JSON'),
    footerConfig: z.record(z.string(), z.any()).optional().describe('Footer layout configuration JSON'),
    announcement: z.object({
      enabled: z.boolean().optional(),
      text: z.string().optional(),
      link: z.string().optional(),
      backgroundColor: z.string().optional(),
      textColor: z.string().optional(),
    }).optional().describe('Announcement bar settings'),
  }),
  execute: async ({ headerConfig, footerConfig, announcement }) => {
    try {
      const { updateSettings: updateSettingsFn } = await import('../../settings');

      const values: Record<string, any> = {};
      if (headerConfig !== undefined) values.headerConfig = headerConfig;
      if (footerConfig !== undefined) values.footerConfig = footerConfig;
      if (announcement !== undefined) values.announcement = announcement;

      if (Object.keys(values).length === 0) {
        return { success: false, error: 'No values provided to update' };
      }

      await withTimeout(
        updateSettingsFn('general', values),
        8000,
        'Update site settings timed out'
      );

      return {
        success: true,
        updatedKeys: Object.keys(values),
        message: `Site layout settings updated: ${Object.keys(values).join(', ')}`,
      };
    } catch (error) {
      console.error('[SettingsTools] updateSiteSettings error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update site settings' };
    }
  },
});

export const settingsTools = { updateSettings, updateBrandingSettings, updateSiteSettings };
