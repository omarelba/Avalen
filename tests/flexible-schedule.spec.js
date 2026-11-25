import { test, expect } from '@playwright/test';

// Clients aren't held to the original calendar: a future or missed workout can be done
// today, two days can swap and a workout can move to any free day. Only dates change;
// the coach's exercises, sets and reps stay exactly as prescribed.
const nav = (page, name) => page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name, exact: true });
const state = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('avalen.workspace.v1')));
const key = (offset) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

async function demoWith(page, schedule) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore demo', exact: true }).click();
  await expect(nav(page, 'Home')).toBeVisible();
  await page.evaluate(([rows, from]) => {
    const d = JSON.parse(localStorage.getItem('avalen.workspace.v1'));
    const c = d.clients.find((x) => x.id === d.activeClientId);
    c.schedule = rows.map(([date, i]) => ({ date, dayId: c.program.days[i].id }));
    delete c.scheduleRules;
    d.sessions = d.sessions.filter((s) => s.clientId !== c.id || s.date < from);
    delete d.drafts[c.id];
    localStorage.setItem('avalen.workspace.v1', JSON.stringify(d));
  }, [schedule, key(-3)]);
  await page.reload();
  await expect(nav(page, 'Home')).toBeVisible();
}
const program = async (page) => { const d = await state(page); return d.clients.find((c) => c.id === d.activeClientId).program; };
const scheduleOf = async (page) => { const d = await state(page); return d.clients.find((c) => c.id === d.activeClientId).schedule; };

test('on a rest day, the next workout can be done today and starts straight away', async ({ page }) => {
  await demoWith(page, [[key(2), 1], [key(4), 2]]);
  const before = await program(page);
  await nav(page, 'Train').click();
  const next = page.getByRole('region', { name: 'Next workout' });
  await expect(next).toContainText(before.days[1].name);
  await next.getByRole('button', { name: 'Do it today' }).click();
  await expect(page.getByRole('dialog', { name: before.days[1].name })).toBeVisible();
  expect(await scheduleOf(page)).toEqual([{ date: key(0), dayId: before.days[1].id }, { date: key(4), dayId: before.days[2].id }]);
  expect(await program(page)).toEqual(before);
});

test('a future workout swaps with today’s, and any workout can move to a free day', async ({ page }) => {
  await demoWith(page, [[key(0), 0], [key(1), 1]]);
  const before = await program(page);
  await nav(page, 'Train').click();
  const tomorrow = new Date(`${key(1)}T12:00:00`).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });
  await page.locator('.calendar').getByRole('button', { name: tomorrow, exact: true }).click();
  await page.getByRole('button', { name: 'Do it today' }).click();
  await expect(page.getByRole('dialog', { name: before.days[1].name })).toBeVisible();
  expect(await scheduleOf(page)).toEqual([{ date: key(0), dayId: before.days[1].id }, { date: key(1), dayId: before.days[0].id }]);
  await page.getByRole('button', { name: 'Pause & close' }).click();

  await page.locator('.calendar').getByRole('button', { name: tomorrow, exact: true }).click();
  await page.getByRole('button', { name: 'Move to another day' }).click();
  const sheet = page.getByRole('dialog', { name: `Move ${before.days[0].name}` });
  await sheet.getByRole('radio').filter({ hasText: 'Free' }).first().click();
  await sheet.getByRole('button', { name: 'Move workout' }).click();
  await expect(sheet).toHaveCount(0);
  const after = await scheduleOf(page);
  expect(after.find((s) => s.dayId === before.days[0].id).date > key(1)).toBe(true);
  expect(await program(page)).toEqual(before);
});

test('a missed workout can be rescheduled into today', async ({ page }) => {
  await demoWith(page, [[key(-2), 2], [key(3), 0]]);
  const before = await program(page);
  await nav(page, 'Train').click();
  const missed = new Date(`${key(-2)}T12:00:00`).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });
  await page.locator('.calendar').getByRole('button', { name: missed, exact: true }).click();
  await page.getByRole('button', { name: 'Do this workout today' }).click();
  await expect(page.getByRole('dialog', { name: before.days[2].name })).toBeVisible();
  expect((await scheduleOf(page))[0]).toEqual({ date: key(0), dayId: before.days[2].id });
});
