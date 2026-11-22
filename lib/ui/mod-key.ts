/**
 * Shortcut labels: "Ctrl K" everywhere, "⌘K" only on a Mac. The page first draws "Ctrl" (the server cannot
 * know the platform) and switches after it loads. Check: lib/ui/mod-key.assert.ts
 */

export function isMacPlatform(platform: string): boolean {
  return /Mac|iPhone|iPad|iPod/i.test(platform)
}

export function shortcutLabel(key: string, mac: boolean): string {
  return mac ? `⌘${key}` : `Ctrl ${key}`
}
