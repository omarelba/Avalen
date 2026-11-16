import { test, expect } from '@playwright/test';

// Wearables are on hold during the pilot (src/avalen/features.js). With the switch off,
// as in every deployed build, no screen, widget, help page or privacy text mentions
// them, on the web or in the iPhone app. The demo workspace has sample wearable
// readings, so anything that leaked through would show here.
const nav = (page, name) => page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name, exact: true });
const WEARABLE_WORDS = /wearable|WHOOP|Apple Health|Health Connect|Google Health|Fitbit|Pixel Watch|Oura|Connected devices|Sleep & recovery|Last night|Client recovery|Low recovery|HRV|Strain/i;

async function demo(page, { role = 'client', iPhone = false } = {}) {
  if (iPhone) await page.addInitScript(() => { window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'ios' }; });
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore demo', exact: true }).click();
  await expect(nav(page, 'Home')).toBeVisible();
  if (role === 'coach') await page.getByLabel('Workspace role').selectOption('coach');
}
const noWearables = async (page) => expect(page.locator('main')).not.toContainText(WEARABLE_WORDS);

for (const iPhone of [false, true]) {
  test(`client ${iPhone ? 'iPhone app' : 'web'}: no wearable readings, settings or home widget`, async ({ page }) => {
    await demo(page, { iPhone });
    await expect(page.locator('.wearable-home-connect, .wearable-card')).toHaveCount(0);
    await noWearables(page);

    await page.getByRole('button', { name: 'Customise home' }).click();
    const editor = page.getByRole('dialog', { name: 'Customise home' });
    await expect(editor).toContainText('Live recovery'); // muscle recovery from training stays
    await expect(editor).not.toContainText(WEARABLE_WORDS);
    await editor.getByRole('button', { name: 'Close dialog', exact: true }).click();

    await nav(page, 'More').click();
    await expect(page.getByRole('heading', { name: 'Appearance', exact: true })).toBeVisible();
    await expect(page.locator('.settings-disclosure > summary').filter({ hasText: /Connected devices|Sleep & recovery/ })).toHaveCount(0);
    await noWearables(page);
  });

  test(`coach ${iPhone ? 'iPhone app' : 'web'}: no recovery flags, client readouts or wearable cards`, async ({ page }) => {
    await demo(page, { role: 'coach', iPhone });
    await expect(page.locator('.review-queue')).toBeVisible();
    await expect(page.locator('.coach-recovery-widget')).toHaveCount(0);
    await noWearables(page);

    await page.getByRole('button', { name: 'Customise home' }).click();
    await expect(page.getByRole('dialog', { name: 'Customise home' })).not.toContainText(WEARABLE_WORDS);
    await page.getByRole('dialog', { name: 'Customise home' }).getByRole('button', { name: 'Close dialog', exact: true }).click();

    await nav(page, 'Clients').click();
    await expect(page.locator('.client-card').first()).toBeVisible();
    await expect(page.locator('.client-wearable')).toHaveCount(0);
    await noWearables(page);

    await page.locator('.client-card').filter({ hasText: 'Sophie Williams' }).click();
    await expect(page.getByRole('region', { name: 'Sleep and recovery' })).toHaveCount(0);
    await noWearables(page);
  });
}

test('help and privacy pages do not mention wearables', async ({ page }) => {
  for (const path of ['/support.html', '/privacy.html']) {
    await page.goto(path);
    await expect(page.locator('body')).not.toContainText(WEARABLE_WORDS);
  }
});
