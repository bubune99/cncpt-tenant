/**
 * VMCP Permissions System
 *
 * Controls whether the AI can autonomously create/modify tools
 * or must request approval via AI SDK v6's native needsApproval.
 */

import { prisma } from '../db';

export type VmcpPermissionMode = 'ask' | 'autonomous';

export interface VmcpSettings {
  mode: VmcpPermissionMode;
}

// Default settings - require permission (ask mode)
export const DEFAULT_VMCP_SETTINGS: VmcpSettings = {
  mode: 'ask',
};

/**
 * Get VMCP settings from database
 */
export async function getVmcpSettings(): Promise<VmcpSettings> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'vmcp_settings' },
    });

    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value);
        return {
          ...DEFAULT_VMCP_SETTINGS,
          ...parsed,
        };
      } catch {
        // Invalid JSON, return defaults
      }
    }
  } catch (error) {
    console.warn('[VMCP] Failed to load settings:', error);
  }

  return DEFAULT_VMCP_SETTINGS;
}

/**
 * Update VMCP settings
 */
export async function updateVmcpSettings(
  settings: Partial<VmcpSettings>
): Promise<VmcpSettings> {
  const current = await getVmcpSettings();
  const updated = { ...current, ...settings };

  await prisma.setting.upsert({
    where: { key: 'vmcp_settings' },
    update: { value: JSON.stringify(updated) },
    create: {
      key: 'vmcp_settings',
      value: JSON.stringify(updated),
      group: 'ai',
    },
  });

  return updated;
}

/**
 * Check if autonomous mode is enabled
 */
export async function isAutonomousMode(): Promise<boolean> {
  const settings = await getVmcpSettings();
  return settings.mode === 'autonomous';
}

/**
 * Enable autonomous mode
 */
export async function enableAutonomousMode(): Promise<void> {
  await updateVmcpSettings({ mode: 'autonomous' });
  console.log('[VMCP] Autonomous mode enabled');
}

/**
 * Disable autonomous mode (require approvals)
 */
export async function disableAutonomousMode(): Promise<void> {
  await updateVmcpSettings({ mode: 'ask' });
  console.log('[VMCP] Permission mode enabled');
}
