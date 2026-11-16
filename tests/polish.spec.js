import { test, expect } from "@playwright/test";

// Press-and-hold steppers and the finish celebration.
const nav = (page, name) => page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name, exact: true });
async function startWorkout(page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore demo", exact: true }).click();
  await expect(nav(page, "Home")).toBeVisible();
  await page.getByRole("button", { name: "View Upper Body A", exact: true }).click();
  await page.getByRole("button", { name: "Begin Workout" }).click();
}

test("a tap steps weight once; holding repeats and speeds up; it stops at the limit", async ({ page }) => {
  await startWorkout(page);
  const weight = page.getByRole("spinbutton", { name: "Weight (kg)", exact: true });
  const plus = page.getByRole("button", { name: "Increase Weight (kg)" });
  const start = Number(await weight.inputValue());
  await plus.click();
  await expect(weight).toHaveValue(String(start + 2.5));

  const box = await plus.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1500);
  await page.mouse.up();
  // Let a step that fired just before release finish rendering, then the value must stay put.
  await page.waitForTimeout(300);
  const held = Number(await weight.inputValue());
  expect(held - (start + 2.5)).toBeGreaterThanOrEqual(2.5 * 6);
  await page.waitForTimeout(500);
  expect(Number(await weight.inputValue())).toBe(held);

  await weight.fill("2.5");
  const minus = page.getByRole("button", { name: "Decrease Weight (kg)" });
  const mbox = await minus.boundingBox();
  await page.mouse.move(mbox.x + mbox.width / 2, mbox.y + mbox.height / 2);
  await page.mouse.down(); await page.waitForTimeout(900); await page.mouse.up();
  await expect(weight).toHaveValue("0");
});

test("finishing a workout shows the confetti once, and not with Reduce Motion on", async ({ page, browser }) => {
  await startWorkout(page);
  await page.getByRole("button", { name: "Log set 1", exact: true }).click();
  await page.getByRole("button", { name: "Finish session early" }).click();
  await page.getByRole("button", { name: "Finish & see results" }).click();
  await expect(page.getByRole("heading", { name: "You put in the work." })).toBeVisible();
  await expect(page.locator("canvas.confetti-burst")).toHaveCount(1);
  await expect(page.locator("canvas.confetti-burst")).toBeHidden({ timeout: 3000 });

  const calm = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
  const p2 = await calm.newPage();
  await startWorkout(p2);
  await p2.getByRole("button", { name: "Log set 1", exact: true }).click();
  await p2.getByRole("button", { name: "Finish session early" }).click();
  await p2.getByRole("button", { name: "Finish & see results" }).click();
  await expect(p2.getByRole("heading", { name: "You put in the work." })).toBeVisible();
  await expect(p2.locator("canvas.confetti-burst")).toHaveCount(0);
  await calm.close();
});
