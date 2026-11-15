// New clients start with nothing planned; the coach plans a week of training and
// nutrition for each weekday. Against the real server and database.
import test from "node:test";
import assert from "node:assert/strict";
import { workspaceChanges } from "../src/avalen/ecosystem/changes.js";
import { scheduleFromWeek, applyProgramTemplate, nutritionFromTemplate } from "../src/avalen/plan-week.js";
import { fixture } from "./helpers/service.js";

const today = new Date().toISOString().slice(0, 10);
async function save(f, account, edit) {
  const seen = await f.call("/api/workspace", { account });
  const next = structuredClone(seen.data);
  edit(next);
  return f.call("/api/workspace", { method: "PATCH", account, body: { revision: seen.revision, changes: workspaceChanges(seen.data, next) } });
}
async function newClient(f) {
  const { code } = await f.call("/api/coach-code", { account: f.coach });
  return f.call("/api/signup/client", { method: "POST", body: { name: "Maya Chen", email: "maya@test.app", password: "client-password-123", code } });
}
const workout = (id, name) => ({ id, name, cover: 0, minutes: 45, exercises: [{ id: `${id}-x`, name: "Back squat", sets: 3, reps: 8, weight: 60, rest: 90, rpe: 8, rir: 2 }] });
const day = (kcal) => ({ kcal, p: 160, c: Math.round((kcal - 160 * 4 - 70 * 9) / 4), f: 70, meals: [] });
// The next date (from today) that falls on the given weekday, Monday = 0.
const next = (weekday) => {
  for (let i = 0; i < 7; i++) {
    const d = new Date(`${today}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i);
    if ((d.getUTCDay() + 6) % 7 === weekday) return d.toISOString().slice(0, 10);
  }
};

test("a client who signs up starts with no programme, nutrition or habits, and can still log food", async () => {
  const f = await fixture({ plannedFirstClient: false });
  try {
    assert.equal(f.coach.data.clients[0].nutrition, null, "the owner's first client starts empty too");
    const client = await newClient(f);
    assert.equal(client.status, 200);
    const mine = client.data.clients[0];
    assert.deepEqual(mine.program.days, []);
    assert.deepEqual(mine.schedule, []);
    assert.equal(mine.nutrition, null);
    assert.deepEqual(mine.habits, []);
    const logged = await save(f, client, (d) => d.foodLogs.push({ id: "oats", clientId: mine.id, date: today, name: "Oats", kcal: 300 }));
    assert.equal(logged.status, 200, logged.error);
    const dayRow = (await f.call("/api/workspace", { account: client })).data.nutritionDays?.find((r) => r.date === today);
    if (dayRow) assert.deepEqual(dayRow.target, { kcal: 0, p: 0, c: 0, f: 0 }, "no targets to measure against yet");
  } finally {
    await f.close();
  }
});

test("the coach plans a training week; the client gets workouts on those weekdays only", async () => {
  const f = await fixture({ plannedFirstClient: false });
  try {
    const client = await newClient(f);
    const id = client.user.clientId;
    const saved = await save(f, f.coach, (d) => {
      const c = d.clients.find((x) => x.id === id);
      const program = { id: "p1", name: "Strength", phase: "Build", weeks: 4, progression: "", days: [workout("upper", "Upper Body A"), workout("lower", "Lower Body A")], week: ["upper", null, "lower", null, "upper", null, null] };
      const { schedule, start, programEnd } = scheduleFromWeek(c, program, d.sessions, today);
      Object.assign(c, { program: { ...program, start }, schedule, programEnd });
    });
    assert.equal(saved.status, 200, saved.error);
    const view = (await f.call("/api/workspace", { account: client })).data.clients[0];
    assert.deepEqual(view.program.week, ["upper", null, "lower", null, "upper", null, null]);
    assert.equal(view.schedule.length, 12, "three workouts a week for four weeks");
    assert.ok(view.schedule.every((s) => [0, 2, 4].includes((new Date(`${s.date}T12:00:00Z`).getUTCDay() + 6) % 7)), "only Mondays, Wednesdays and Fridays");

    const badWeek = await save(f, f.coach, (d) => (d.clients.find((x) => x.id === id).program.week = ["missing", null, null, null, null, null, null]));
    assert.equal(badWeek.status, 400, "a week naming a workout that doesn't exist is refused");
    const allRest = await save(f, f.coach, (d) => (d.clients.find((x) => x.id === id).program.week = [null, null, null, null, null, null, null]));
    assert.equal(allRest.status, 400, "a week with no workout day is refused");
  } finally {
    await f.close();
  }
});

test("nutrition targets follow the weekday: a Monday is measured against Monday's plan", async () => {
  const f = await fixture({ plannedFirstClient: false });
  try {
    const client = await newClient(f);
    const id = client.user.clientId;
    const plan = { mode: "Flexible", days: [day(2600), day(2200), day(2600), day(2200), day(2600), day(2800), day(2000)] };
    assert.equal((await save(f, f.coach, (d) => (d.clients.find((x) => x.id === id).nutrition = plan))).status, 200);
    const monday = next(0), tuesday = next(1);
    const log = (date, entryId, target) => save(f, client, (d) => {
      d.foodLogs.push({ id: entryId, clientId: id, date, name: "Oats", kcal: 300 });
      d.nutritionDays ??= [];
      d.nutritionDays.push({ clientId: id, date, target, complete: false });
    });
    const mondayTarget = { kcal: 2600, p: 160, c: day(2600).c, f: 70 };
    assert.equal((await log(monday, "mon", mondayTarget)).status, 200, "Monday's targets are accepted for a Monday");
    assert.equal((await log(tuesday, "tue", mondayTarget)).status, 403, "but not for a Tuesday: the client can't choose their targets");
    assert.equal((await log(tuesday, "tue2", { kcal: 2200, p: 160, c: day(2200).c, f: 70 })).status, 200);
    const rows = (await f.call("/api/workspace", { account: f.coach })).data.nutritionDays.filter((r) => r.clientId === id);
    assert.equal(rows.find((r) => r.date === monday).target.kcal, 2600);
    assert.equal(rows.find((r) => r.date === tuesday).target.kcal, 2200);
  } finally {
    await f.close();
  }
});

test("a coach's training and nutrition templates are saved, used for a client, and never sent to clients", async () => {
  const f = await fixture({ plannedFirstClient: false });
  try {
    const client = await newClient(f);
    const id = client.user.clientId;
    const program = { id: "tpl-strength", name: "Strength template", phase: "Build", weeks: 4, progression: "", days: [workout("upper", "Upper Body A")], week: ["upper", null, null, "upper", null, null, null] };
    const nutrition = { id: "tpl-cut", name: "Cut", mode: "Flexible", days: [2400, 2400, 2400, 2400, 2400, 2700, 2200].map(day) };
    const saved = await save(f, f.coach, (d) => { d.templates.push(program); d.nutritionTemplates.push(nutrition); });
    assert.equal(saved.status, 200, saved.error);
    const coachView = (await f.call("/api/workspace", { account: f.coach })).data;
    assert.ok(coachView.templates.some((p) => p.id === "tpl-strength"));
    assert.deepEqual(coachView.nutritionTemplates.map((n) => n.id), ["tpl-cut"]);

    const used = await save(f, f.coach, (d) => {
      applyProgramTemplate(d, id, d.templates.find((p) => p.id === "tpl-strength"), today);
      d.clients.find((c) => c.id === id).nutrition = nutritionFromTemplate(d.nutritionTemplates[0]);
    });
    assert.equal(used.status, 200, used.error);

    const clientView = (await f.call("/api/workspace", { account: client })).data;
    assert.deepEqual(clientView.templates, [], "clients don't see the coach's programme templates");
    assert.deepEqual(clientView.nutritionTemplates, [], "or nutrition templates");
    const mine = clientView.clients[0];
    assert.equal(mine.program.name, "Strength template");
    assert.notEqual(mine.program.id, "tpl-strength", "the client has their own copy");
    assert.equal(mine.schedule.length, 8, "two workouts a week for four weeks");
    assert.deepEqual(mine.nutrition.days.map((d) => d.kcal), [2400, 2400, 2400, 2400, 2400, 2700, 2200]);

    const sneaky = await save(f, client, (d) => d.nutritionTemplates.push({ id: "x", name: "Mine", mode: "Flexible", days: [] }));
    assert.ok([400, 403].includes(sneaky.status), "a client can't write the coach's templates");
    assert.deepEqual((await f.call("/api/workspace", { account: f.coach })).data.nutritionTemplates.map((n) => n.id), ["tpl-cut"]);

    const removed = await save(f, f.coach, (d) => (d.nutritionTemplates = []));
    assert.equal(removed.status, 200, removed.error);
    assert.deepEqual((await f.call("/api/workspace", { account: f.coach })).data.nutritionTemplates, []);
    assert.equal((await f.call("/api/workspace", { account: client })).data.clients[0].nutrition.days[0].kcal, 2400, "deleting a template leaves clients' plans as they are");
  } finally {
    await f.close();
  }
});
