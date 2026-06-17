import { test, expect } from '@playwright/test';

/**
 * Admin chrome E2E — verifies the annotation-driven chrome fixes on the shared
 * AdminShell, against the read-only demo admin (no auth, no relay).
 *
 * Each assertion maps to a specific user annotation so a green run proves the
 * fix actually shipped to the deployed surface.
 */

test.describe('admin chrome (demo)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    // AdminShell mounts client-side; wait for the atlas root to appear.
    await page.locator('.atlas .sidebar').first().waitFor({ timeout: 20_000 });
  });

  test('#10 sidebar nav items no longer show 01–08 number prefixes', async ({ page }) => {
    // The numbered <span class="n"> was removed from section links. The Inbox
    // quick-link keeps its ✦ glyph (separate .inbox-link), so scope to .nav.
    await expect(page.locator('.atlas .sidebar .nav a .n')).toHaveCount(0);
  });

  test('#11 sidebar no longer renders the Today/date meta block', async ({ page }) => {
    await expect(page.locator('.atlas .sidebar > .meta')).toHaveCount(0);
  });

  test('#8 topbar exposes a light/dark theme toggle that actually flips the theme', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /switch to (dark|light) mode/i });
    await expect(toggle).toBeVisible();

    const htmlEl = page.locator('html');
    const before = (await htmlEl.getAttribute('class')) || '';
    await toggle.click();
    await expect
      .poll(async () => ((await htmlEl.getAttribute('class')) || '') !== before)
      .toBe(true);
  });

  test('#5 sidebar account initials render as a circle', async ({ page }) => {
    const initials = page.locator('.atlas .sidebar .acct .initials').first();
    await expect(initials).toBeVisible();
    const radius = await initials.evaluate(
      (el) => getComputedStyle(el as HTMLElement).borderRadius,
    );
    // 50% resolves to half the box (30px → 15px) at runtime.
    expect(radius).toMatch(/^(15px|50%)/);
  });
});
