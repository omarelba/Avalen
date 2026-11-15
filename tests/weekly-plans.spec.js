import { test, expect } from "@playwright/test";
import { fixture } from "./helpers/service.js";

// New clients start with nothing planned; the coach plans a training week and nutrition
// for each weekday; sign-up asks for the password twice.
const nav = (page, name) => page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name, exact: true });
const state = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("avalen.workspace.v1")));
const weekday = (date) => (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7;

async function demoCoach(page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore demo", exact: true }).click();
  await expect(nav(page, "Home")).toBeVisible();
  await page.getByLabel("Workspace role").selectOption("coach");
}
async function newClientAsCoach(page, { demo = true } = {}) {
  if (demo) await demoCoach(page);
  await nav(page, "Clients").click();
  await page.getByRole("button", { name: "Add client", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Add a client" });
  await dialog.getByLabel("Full name").fill("Nour Adel");
  await dialog.getByLabel("Email").fill("nour@example.com");
  await dialog.getByRole("button", { name: "Create client", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  return (await state(page)).clients.find((c) => c.name === "Nour Adel");
}

test("a coach builds a new client's training week from nothing", async ({ page }) => {
  const added = await newClientAsCoach(page);
  expect(added.program.days).toEqual([]);
  expect(added.nutrition).toBeNull();
  expect(added.habits).toEqual([]);

  await page.getByRole("tab", { name: "Plan", exact: true }).click();
  await expect(page.getByRole("heading", { name: "No programme yet" })).toBeVisible();
  await page.getByRole("button", { name: "Create programme" }).click();
  const builder = page.getByRole("dialog", { name: "Programme builder" });
  await builder.getByLabel("Programme name").fill("Strength foundations");
  await expect(builder.getByLabel("Monday")).toBeDisabled();
  await builder.getByRole("button", { name: "+ Add workout" }).click();
  await builder.getByLabel("Workout name").fill("Upper Body A");
  await builder.locator(".exercise-library button").first().click();
  await builder.getByLabel("Monday").selectOption({ label: "Upper Body A" });
  await builder.getByLabel("Thursday").selectOption({ label: "Upper Body A" });
  await builder.getByLabel("Reason for change (saved to client timeline)").fill("First programme");
  await builder.getByRole("button", { name: "Save programme", exact: true }).click();
  await expect(builder).toHaveCount(0);

  const week = page.getByRole("region", { name: "Weekly schedule" });
  await expect(week.locator("li").nth(0)).toContainText("MondayUpper Body A");
  await expect(week.locator("li").nth(1)).toContainText("TuesdayRest day");
  await expect(week.locator("li").nth(3)).toContainText("ThursdayUpper Body A");
  const client = (await state(page)).clients.find((c) => c.name === "Nour Adel");
  expect(client.program.week.filter(Boolean)).toHaveLength(2);
  expect(client.schedule.length).toBeGreaterThan(20);
  expect(client.schedule.every((s) => [0, 3].includes(weekday(s.date)))).toBe(true);
});

test("a coach sets nutrition for each weekday, copying one day to the rest", async ({ page }) => {
  await newClientAsCoach(page);
  await page.getByRole("tab", { name: "Nutrition", exact: true }).click();
  await page.getByRole("tab", { name: /^Mon/ }).click();
  await expect(page.getByRole("heading", { name: "Monday" })).toBeVisible();

  await page.getByLabel("Calories", { exact: true }).fill("2600");
  await page.getByLabel("Protein (g)").fill("170");
  await page.getByLabel("Carbs (g)").fill("300");
  await page.getByLabel("Fat (g)").fill("75");
  await page.getByLabel("Why are you making this change?").fill("First plan");
  // Saving with only Monday filled in: the editor moves to the first empty day and says so.
  await page.getByRole("button", { name: "Save nutrition plan" }).click();
  await expect(page.getByText("Set calories, protein, carbs and fat for Tuesday.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tuesday" })).toBeVisible();
  expect((await state(page)).clients.find((c) => c.name === "Nour Adel").nutrition).toBeNull();
  await page.getByRole("tab", { name: /^Mon/ }).click();
  await page.getByRole("button", { name: "Copy this day to every day" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Monday copied to every day." })).toBeVisible();
  await page.getByRole("tab", { name: /^Sat/ }).click();
  await page.getByLabel("Calories", { exact: true }).fill("2900");
  await page.getByRole("button", { name: "Save nutrition plan" }).click();
  await expect(page.getByText("Updated. The client’s targets now reflect this plan.")).toBeVisible();

  const { nutrition } = (await state(page)).clients.find((c) => c.name === "Nour Adel");
  expect(nutrition.days.map((d) => d.kcal)).toEqual([2600, 2600, 2600, 2600, 2600, 2900, 2600]);
  expect(nutrition.days[0]).toMatchObject({ p: 170, c: 300, f: 75 });
});

test("signing up asks for the password twice, and a new client is told their plan is coming", async ({ page }) => {
  const service = await fixture({ plannedFirstClient: false });
  try {
    const { code } = await service.call("/api/coach-code", { account: service.coach });
    await page.goto(`${service.base}/?connected=1`);
    await page.getByRole("button", { name: /I have a coach code/ }).click();
    await page.getByLabel("Coach code").fill(code);
    await page.getByLabel("Your name").fill("Maya Chen");
    await page.getByLabel("Email", { exact: true }).fill("maya@test.app");
    await page.getByLabel("Password", { exact: true }).fill("client-password-123");
    await page.getByLabel("Confirm password").fill("client-password-124");
    await page.getByRole("button", { name: "Join your coach", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("The passwords don’t match");
    await expect(page.getByLabel("Password", { exact: true })).toHaveValue("client-password-123");
    expect((await service.db.get("SELECT COUNT(*) AS n FROM users WHERE email='maya@test.app'")).n == 0).toBe(true);

    await page.getByLabel("Confirm password").fill("client-password-123");
    await page.getByRole("button", { name: "Join your coach", exact: true }).click();
    await expect(page.getByRole("button", { name: "Account", exact: true })).toBeVisible();
    await page.evaluate(() => { sessionStorage.setItem("avalen.editorial.splash", "seen"); sessionStorage.removeItem("avalen.intake.open"); });
    await page.reload();
    await expect(page.getByRole("heading", { name: "Your coach is preparing your plan." })).toBeVisible();
    const nutrition = page.getByRole("region", { name: "Today’s nutrition" });
    await nutrition.scrollIntoViewIfNeeded();
    await expect(nutrition.getByText("Your coach hasn’t set your nutrition targets yet. You can still log what you eat.")).toBeVisible();
  } finally {
    await service.close();
  }
});

test("a coach saves a client's programme as a template, starts a new client from it, then deletes the template", async ({ page }) => {
  await demoCoach(page);
  await nav(page, "Clients").click();
  await page.locator(".client-card").filter({ hasText: "Jordan Williams" }).click();
  await page.getByRole("tab", { name: "Plan", exact: true }).click();
  await page.getByRole("button", { name: "Save as template", exact: true }).click();
  await expect(page.getByText("Saved to your templates. Use it for any client from their Plan tab or from Programs.")).toBeVisible();
  const { templates, clients } = await state(page);
  const jordan = clients.find((c) => c.name === "Jordan Williams");
  expect(templates).toHaveLength(1);
  expect(templates[0]).toMatchObject({ name: jordan.program.name, weeks: jordan.program.weeks });
  expect(templates[0].id).not.toBe(jordan.program.id);

  await newClientAsCoach(page, { demo: false });
  await page.getByRole("tab", { name: "Plan", exact: true }).click();
  await expect(page.getByLabel("Start from a template")).toContainText(templates[0].name);
  await page.getByRole("button", { name: "Use this template", exact: true }).click();
  await expect(page.getByText(`Nour now follows “${templates[0].name}”, starting today.`)).toBeVisible();
  await expect(page.getByRole("region", { name: "Weekly schedule" })).toBeVisible();
  let nour = (await state(page)).clients.find((c) => c.name === "Nour Adel");
  expect(nour.program.name).toBe(templates[0].name);
  expect(nour.program.id).not.toBe(templates[0].id);
  expect(nour.schedule.length).toBeGreaterThan(0);

  await nav(page, "Programs").click();
  const card = page.locator(".card").filter({ hasText: templates[0].name }).filter({ has: page.getByRole("button", { name: "Assign" }) });
  await card.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(card.getByText("Delete this template?")).toBeVisible();
  await card.getByRole("button", { name: "Keep", exact: true }).click();
  expect((await state(page)).templates).toHaveLength(1);
  await card.getByRole("button", { name: "Delete", exact: true }).click();
  await card.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your coaching method, repeatable." })).toBeVisible();
  const after = await state(page);
  expect(after.templates).toEqual([]);
  nour = after.clients.find((c) => c.name === "Nour Adel");
  expect(nour.program.name).toBe(templates[0].name);
});

test("a coach builds a weekly nutrition template in Programs and loads it for a client", async ({ page }) => {
  await newClientAsCoach(page);
  await nav(page, "Programs").click();
  await page.getByRole("tab", { name: "Nutrition", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Reusable nutrition plans." })).toBeVisible();
  await page.getByRole("button", { name: "Create nutrition template" }).first().click();
  const editor = page.getByRole("dialog", { name: "Nutrition template" });
  await editor.getByLabel("Template name").fill("Cut · 4 days");
  await editor.getByLabel("Calories", { exact: true }).fill("2400");
  await editor.getByLabel("Protein (g)").fill("180");
  await editor.getByLabel("Carbs (g)").fill("240");
  await editor.getByLabel("Fat (g)").fill("70");
  await editor.getByRole("button", { name: "Copy this day to every day" }).click();
  await editor.getByRole("tab", { name: /^Sat/ }).click();
  await editor.getByLabel("Calories", { exact: true }).fill("2700");
  await editor.getByRole("button", { name: "Save template", exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(page.getByText("2,400–2,700 kcal across the week")).toBeVisible();
  const [template] = (await state(page)).nutritionTemplates;
  expect(template.name).toBe("Cut · 4 days");
  expect(template.days.map((d) => d.kcal)).toEqual([2400, 2400, 2400, 2400, 2400, 2700, 2400]);

  await nav(page, "Clients").click();
  await page.locator(".client-card").filter({ hasText: "Nour Adel" }).click();
  await page.getByRole("tab", { name: "Nutrition", exact: true }).click();
  await page.getByLabel("Start from a template").selectOption({ label: "Cut · 4 days" });
  await page.getByRole("button", { name: "Load template", exact: true }).click();
  await expect(page.getByText("“Cut · 4 days” loaded. Adjust anything for this client, then save.")).toBeVisible();
  expect((await state(page)).clients.find((c) => c.name === "Nour Adel").nutrition, "loading alone saves nothing").toBeNull();
  await page.getByLabel("Why are you making this change?").fill("Starting from the cut template");
  await page.getByRole("button", { name: "Save nutrition plan" }).click();
  await expect(page.getByText("Updated. The client’s targets now reflect this plan.")).toBeVisible();
  const { nutrition } = (await state(page)).clients.find((c) => c.name === "Nour Adel");
  expect(nutrition.days.map((d) => d.kcal)).toEqual([2400, 2400, 2400, 2400, 2400, 2700, 2400]);
  expect(nutrition.days[0]).toMatchObject({ p: 180, c: 240, f: 70 });

  await page.getByLabel("Save this plan as a template").fill("Nour's cut");
  await page.getByRole("button", { name: "Save as template", exact: true }).click();
  await expect(page.getByText("Saved “Nour's cut” to your nutrition templates.")).toBeVisible();
  expect((await state(page)).nutritionTemplates.map((n) => n.name)).toEqual(["Cut · 4 days", "Nour's cut"]);
});

test("a coach adds a client with a training and a nutrition template in one step", async ({ page }) => {
  await demoCoach(page);
  await nav(page, "Clients").click();
  await page.locator(".client-card").filter({ hasText: "Jordan Williams" }).click();
  await page.getByRole("tab", { name: "Plan", exact: true }).click();
  await page.getByRole("button", { name: "Save as template", exact: true }).click();
  await expect(page.getByText("Saved to your templates.", { exact: false })).toBeVisible();
  await nav(page, "Programs").click();
  await page.getByRole("tab", { name: "Nutrition", exact: true }).click();
  await page.getByRole("button", { name: "Create nutrition template" }).first().click();
  const editor = page.getByRole("dialog", { name: "Nutrition template" });
  await editor.getByLabel("Template name").fill("Cut · 4 days");
  await editor.getByLabel("Calories", { exact: true }).fill("2300");
  await editor.getByLabel("Protein (g)").fill("170");
  await editor.getByLabel("Carbs (g)").fill("230");
  await editor.getByLabel("Fat (g)").fill("70");
  await editor.getByRole("button", { name: "Copy this day to every day" }).click();
  await editor.getByRole("button", { name: "Save template", exact: true }).click();
  await expect(editor).toHaveCount(0);
  const { templates } = await state(page);

  await nav(page, "Clients").click();
  await page.getByRole("button", { name: "Add client", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Add a client" });
  await dialog.getByLabel("Full name").fill("Nour Adel");
  await dialog.getByLabel("Email").fill("nour@example.com");
  await expect(dialog.getByLabel("Training programme")).toHaveValue("");
  await dialog.getByLabel("Training programme").selectOption({ label: `${templates[0].name} · ${templates[0].weeks} weeks` });
  await dialog.getByLabel("Nutrition plan").selectOption({ label: "Cut · 4 days" });
  await dialog.getByRole("button", { name: "Create client", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Weekly schedule" })).toBeVisible();

  const nour = (await state(page)).clients.find((c) => c.name === "Nour Adel");
  expect(nour.program.name).toBe(templates[0].name);
  expect(nour.program.id).not.toBe(templates[0].id);
  expect(nour.schedule.length).toBeGreaterThan(0);
  expect(nour.nutrition.days.map((d) => d.kcal)).toEqual([2300, 2300, 2300, 2300, 2300, 2300, 2300]);
  const timeline = (await state(page)).timeline.filter((e) => e.clientId === nour.id).map((e) => e.title);
  expect(timeline).toEqual(expect.arrayContaining(["Programme assigned", "Nutrition adjusted"]));
});

test("reason chips fill the reason for a plan change, which stays editable", async ({ page }) => {
  await newClientAsCoach(page);
  await page.getByRole("tab", { name: "Nutrition", exact: true }).click();
  await page.getByLabel("Calories", { exact: true }).fill("2400");
  await page.getByLabel("Protein (g)").fill("160");
  await page.getByLabel("Carbs (g)").fill("260");
  await page.getByLabel("Fat (g)").fill("70");
  await page.getByRole("button", { name: "Copy this day to every day" }).click();
  const chips = page.getByRole("group", { name: "Common reasons" });
  await chips.getByRole("button", { name: "First plan" }).click();
  await expect(chips.getByRole("button", { name: "First plan" })).toHaveAttribute("aria-pressed", "true");
  const reason = page.getByLabel("Why are you making this change?");
  await expect(reason).toHaveValue("First plan");
  await reason.fill("First plan after the intake call");
  await expect(chips.getByRole("button", { name: "First plan" })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Save nutrition plan" }).click();
  await expect(page.getByText("Updated. The client’s targets now reflect this plan.")).toBeVisible();
  const nour = (await state(page)).clients.find((c) => c.name === "Nour Adel");
  const entry = (await state(page)).timeline.find((e) => e.clientId === nour.id && e.title === "Nutrition adjusted");
  expect(entry.detail).toContain("First plan after the intake call");
});

test("the programme builder loads 24 exercises first; Show all and search list the whole library", async ({ page }) => {
  await demoCoach(page);
  await nav(page, "Clients").click();
  await page.locator(".client-card").filter({ hasText: "Jordan Williams" }).click();
  await page.getByRole("tab", { name: "Plan", exact: true }).click();
  await page.getByRole("button", { name: /Edit programme/ }).first().click();
  const builder = page.getByRole("dialog", { name: "Programme builder" });
  const items = builder.locator(".exercise-library > button:not(.exercise-library-more)");
  await expect(items).toHaveCount(24);
  const total = Number((await builder.locator(".exercise-library-count").innerText()).match(/\d+/)[0]);
  expect(total).toBeGreaterThan(24);
  await builder.getByRole("button", { name: `Show all ${total} exercises` }).click();
  await expect(items).toHaveCount(total);
  await builder.getByLabel("Search exercise library").fill("squat");
  await expect(builder.getByRole("button", { name: /Show all/ })).toHaveCount(0);
  expect(await items.count()).toBe(Number((await builder.locator(".exercise-library-count").innerText()).match(/\d+/)[0]));
  await builder.getByLabel("Search exercise library").fill("");
  await expect(items).toHaveCount(24);
});
