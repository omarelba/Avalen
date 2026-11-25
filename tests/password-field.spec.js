import { test, expect } from "@playwright/test";
import { fixture } from "./helpers/service.js";

// New passwords: at least 8 characters, a show/hide button and a strength meter that
// follows typing (weak, fair, good, strong). A short password says why it can't be used.
test("sign-up shows password strength as you type, can reveal the password, and accepts 8 characters", async ({ page }) => {
  const service = await fixture();
  try {
    await page.goto(`${service.base}/?connected=1`);
    await page.getByRole("button", { name: /I’m a coach/ }).click();
    const password = page.getByLabel("Password", { exact: true });
    await expect(page.getByText("At least 8 characters")).toBeVisible();
    await password.fill("abc");
    await expect(page.locator(".password-strength")).toHaveClass(/is-weak/);
    await expect(page.locator(".password-strength")).toContainText("Weak");
    await password.fill("Fadel2026!");
    await expect(page.locator(".password-strength")).toHaveClass(/is-good/);
    await password.fill("correct horse battery");
    await expect(page.locator(".password-strength")).toContainText("Strong");
    await expect(password).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Show password" }).first().click();
    await expect(password).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Hide password" }).first().click();
    await expect(password).toHaveAttribute("type", "password");

    // Too short: a clear message instead of a silent refusal.
    await password.fill("Ab1!");
    await password.blur();
    await expect(page.getByText("Use at least 8 characters.")).toBeVisible();
  } finally {
    await service.close();
  }
});
