import { test, expect } from "@playwright/test";
import { toLastStep } from "./helpers/checkin-flow.js";

// The check-in asks one question at a time. A measurement can be chosen on the wheel
// (including tenths) or typed; nothing is filled in until the person chooses. Sending
// shows a confirmation once the check-in is saved.
const state = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("avalen.workspace.v1")));

test("weight is chosen on the wheel with decimals, steps move forward and back, and sending confirms", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore demo", exact: true }).click();
  await page.goto("/#/client/coach?tab=Check-in");
  await page.getByRole("button", { name: /Start check-in|Edit today’s check-in/ }).click();
  const dialog = page.getByRole("dialog", { name: "Your check-in" });
  const weight = dialog.getByLabel("Weight (kg)", { exact: true });
  await expect(weight).toHaveValue("");
  await expect(dialog.getByRole("progressbar", { name: "Check-in progress" })).toHaveAttribute("aria-valuenow", "1");
  await expect(dialog.getByRole("button", { name: "Continue" })).toBeDisabled();

  const whole = dialog.getByRole("spinbutton", { name: "Weight, whole number" });
  const tenths = dialog.getByRole("spinbutton", { name: "Weight, tenths" });
  await whole.focus();
  await whole.press("ArrowDown");
  await tenths.focus();
  await tenths.press("ArrowDown");
  await tenths.press("ArrowDown");
  await expect(weight).toHaveValue(/^\d+\.2$/);
  const chosen = Number(await weight.inputValue());

  await dialog.getByRole("button", { name: "Continue" }).click();
  await expect(dialog.getByRole("progressbar", { name: "Check-in progress" })).toHaveAttribute("aria-valuenow", "2");
  await dialog.getByRole("button", { name: "Back" }).click();
  await expect(weight).toHaveValue(String(chosen));

  await toLastStep(page);
  const before = (await state(page)).checkins.length;
  await dialog.getByRole("button", { name: "Send check-in" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Check-in sent" })).toBeVisible();
  await expect(dialog).toHaveCount(0);
  const after = await state(page);
  expect(after.checkins.length).toBe(before + 1);
  expect(after.checkins.at(-1).answers.weight).toBe(chosen);
  await page.locator(".checkin-sent").getByRole("button", { name: "Done" }).click();
  await expect(page.locator(".checkin-sent")).toHaveCount(0);
});
