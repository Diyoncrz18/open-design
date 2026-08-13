import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { T } from '@/timeouts';

/**
 * Home's inline scenario rail — the "Start from a template… / …or create a
 * blank project" row, its `home-hero-type-tabs` container, the
 * `home-hero-rail-<chipId>` cards and the "More" shortcuts menu — was removed
 * in the #5517 alignment. Choosing a project-type template is now a
 * composer-footer control: `home-hero-template-trigger` opens a radial menu
 * (`home-hero-template-menu`) whose ring segments are the templates
 * (`home-hero-template-wedge-<chipId>`).
 *
 * These helpers are the single place e2e encodes that entry point, so the next
 * time the picker's shape changes only this file moves.
 */

/** Open the radial template menu (idempotent). Returns the menu locator. */
export async function openHomeTemplateMenu(page: Page): Promise<Locator> {
  const menu = page.getByTestId('home-hero-template-menu');
  if ((await menu.count()) > 0) return menu;
  await page.getByTestId('home-hero-template-trigger').click();
  await expect(menu).toBeVisible();
  return menu;
}

/**
 * Wait for a fresh Home composer to finish binding its default deck route.
 * Until the catalog-backed binding settles, production intentionally keeps
 * Send disabled so an empty composer cannot submit through an indeterminate
 * route. The selected deck label is the user-visible readiness signal.
 */
export async function waitForDefaultHomeRoute(page: Page): Promise<void> {
  await expect(page.getByTestId('home-hero-template-trigger')).toContainText(
    /Slide deck|幻灯片|投影片/i,
    { timeout: T.long },
  );
  await expect(page.getByTestId('home-hero-submit')).toBeEnabled({ timeout: T.long });
}

/**
 * Select a template by `HomeHeroChip` id (see
 * `apps/web/src/components/home-hero/chips.ts`) — `deck`, `prototype`,
 * `wireframe`, `mobile`, `document`, `web-clone`, `webgl`, `hyperframes`,
 * `live-artifact`, `image`, `video`, `audio`.
 *
 * Only `apply-scenario` chips are offered as wedges. The action chips that used
 * to share the rail moved to their own surfaces and are NOT reachable here:
 * Brand Kit → the composer design-system picker's Create button
 * (`project-ds-picker-create`), plugin authoring → the Extensions page
 * (`plugins-create-button`), Figma import → the composer plus menu.
 */
export async function pickHomeTemplate(page: Page, chipId: string): Promise<void> {
  await openHomeTemplateMenu(page);
  const wedge = page.getByTestId(`home-hero-template-wedge-${chipId}`);
  await expect(wedge).toBeVisible();
  await wedge.click();
  // Confirming a row closes the menu and puts the chosen label on the pill —
  // clearing a type was removed, so the label is the observable "it is set".
  await expect(page.getByTestId('home-hero-template-menu')).toHaveCount(0);
  await expect(page.getByTestId('home-hero-template-picker')).toHaveClass(/has-selection/);
}
