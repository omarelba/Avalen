// The weekly training template, weekday nutrition and the empty starting plan.
import test from "node:test";
import assert from "node:assert/strict";
import { WEEKDAYS, weekdayIndex, emptyProgram, hasProgram, programWeek, scheduleFromWeek, defaultWeek, nutritionPlanFor, hasNutrition, weekNutrition, blankPlan, programTemplateFrom, applyProgramTemplate, nutritionTemplateFrom, nutritionFromTemplate } from "../src/avalen/plan-week.js";
import { programError } from "../src/avalen/validation.js";
import { targetsFor } from "../src/avalen/nutrition-model.js";
import { newClient } from "../src/avalen/seed.js";

const workout = (id) => ({ id, name: id, cover: 0, minutes: 45, exercises: [{ id: `${id}-x`, name: "Squat", sets: 3, reps: 8, weight: 60, rest: 90, rpe: 8, rir: 2 }] });
const MONDAY = "2026-11-16";

test("weekdays run Monday to Sunday", () => {
  assert.equal(WEEKDAYS.length, 7);
  assert.equal(weekdayIndex("2026-11-16"), 0, "Monday");
  assert.equal(weekdayIndex("2026-11-21"), 5, "Saturday");
  assert.equal(weekdayIndex("2026-11-22"), 6, "Sunday");
});

test("a new client starts with no programme, no schedule, no nutrition and no habits", () => {
  const client = blankPlan(newClient("Maya", "maya@test.app"), MONDAY);
  assert.equal(hasProgram(client), false);
  assert.deepEqual(client.schedule, []);
  assert.equal(client.nutrition, null);
  assert.deepEqual(client.habits, []);
  assert.equal(hasNutrition(client), false);
  assert.deepEqual(targetsFor(client, MONDAY), { kcal: 0, p: 0, c: 0, f: 0 }, "no targets to measure a day against");
  assert.deepEqual(emptyProgram().week, [null, null, null, null, null, null, null]);
});

test("saving a weekly programme schedules its workouts on the chosen weekdays for its whole length", () => {
  const client = blankPlan(newClient("Maya", "maya@test.app", "c1"), MONDAY);
  const program = { ...emptyProgram(), name: "Strength", weeks: 2, days: [workout("upper"), workout("lower")], week: ["upper", "lower", null, "upper", null, "lower", null] };
  const { schedule, start, programEnd } = scheduleFromWeek(client, program, [], MONDAY);
  assert.equal(start, MONDAY);
  assert.equal(programEnd, "2026-11-29", "two weeks, ending on the second Sunday");
  assert.deepEqual(schedule.map((s) => `${s.date}:${s.dayId}`), [
    "2026-11-16:upper", "2026-11-17:lower", "2026-11-19:upper", "2026-11-21:lower",
    "2026-11-23:upper", "2026-11-24:lower", "2026-11-26:upper", "2026-11-28:lower",
  ]);
});

test("changing the week keeps past days and completed workouts, and keeps the programme's start", () => {
  const client = newClient("Maya", "maya@test.app", "c1");
  client.program = { ...client.program, weeks: 4, days: [workout("upper"), workout("lower")], start: "2026-11-02" };
  client.programEnd = "2026-11-29";
  client.schedule = [{ date: "2026-11-10", dayId: "upper" }, { date: "2026-11-18", dayId: "upper" }, { date: "2026-11-20", dayId: "lower" }];
  const sessions = [{ clientId: "c1", date: "2026-11-18" }];
  const program = { ...client.program, week: [null, null, null, null, "upper", null, null] };
  const { schedule, start, programEnd } = scheduleFromWeek(client, program, sessions, "2026-11-18");
  assert.equal(start, "2026-11-02", "editing mid-programme doesn't restart it");
  assert.equal(programEnd, "2026-11-29");
  assert.deepEqual(schedule.map((s) => `${s.date}:${s.dayId}`), ["2026-11-10:upper", "2026-11-18:upper", "2026-11-20:upper", "2026-11-27:upper"], "the past and the completed day stay; Fridays follow the new week");
});

test("an existing client's week is read from their coming schedule, and templates default to four days", () => {
  const client = newClient("Maya", "maya@test.app", "c1");
  client.program = { ...client.program, days: [workout("upper"), workout("lower")] };
  delete client.program.week;
  client.schedule = [{ date: "2026-11-16", dayId: "upper" }, { date: "2026-11-18", dayId: "lower" }];
  assert.deepEqual(programWeek(client, MONDAY), ["upper", null, "lower", null, null, null, null]);
  assert.deepEqual(defaultWeek({ days: [workout("a"), workout("b")] }), ["a", "b", null, "a", null, "b", null]);
});

test("the programme check requires a valid week with at least one workout day", () => {
  const program = { name: "Strength", weeks: 4, days: [workout("upper")], week: ["upper", null, null, null, null, null, null] };
  assert.equal(programError(program), "");
  assert.match(programError({ ...program, week: [null, null, null, null, null, null, null] }), /at least one day/);
  assert.match(programError({ ...program, week: ["gone", null, null, null, null, null, null] }), /workout or a rest day/);
  assert.match(programError({ ...program, week: ["upper"] }), /workout or a rest day/);
  assert.equal(programError({ name: "Strength", weeks: 4, days: [workout("upper")] }), "", "older programmes without a week still pass");
});

test("nutrition targets follow the weekday, and older single plans apply every day", () => {
  const day = (kcal) => ({ kcal, p: 150, c: 200, f: 70, meals: [] });
  const client = { nutrition: { mode: "Flexible", days: [day(2600), day(2200), day(2600), day(2200), day(2600), day(2800), day(2000)] } };
  assert.equal(nutritionPlanFor(client, "2026-11-16").kcal, 2600, "Monday");
  assert.equal(nutritionPlanFor(client, "2026-11-17").kcal, 2200, "Tuesday");
  assert.equal(nutritionPlanFor(client, "2026-11-22").kcal, 2000, "Sunday");
  assert.deepEqual(targetsFor(client, "2026-11-21"), { kcal: 2800, p: 150, c: 200, f: 70 });
  const single = { nutrition: { mode: "Structured", kcal: 2500, p: 180, c: 280, f: 75, meals: [{ name: "Lunch" }] } };
  assert.equal(nutritionPlanFor(single, "2026-11-22").kcal, 2500);
  const week = weekNutrition(single);
  assert.equal(week.days.length, 7);
  assert.ok(week.days.every((d) => d.kcal === 2500 && d.meals.length === 1), "the editor starts from the single plan on every day");
  assert.deepEqual(weekNutrition({ nutrition: null }).days[0], { kcal: "", p: "", c: "", f: "", meals: [] });
  const partial = { nutrition: { mode: "Flexible", days: [day(2600), null, null, null, null, null, null] } };
  assert.equal(nutritionPlanFor(partial, "2026-11-17"), null, "an unset weekday has no targets");
});

test("a client's programme saved as a template is a separate copy with its week and no start date", () => {
  const program = { ...emptyProgram(), name: "Strength", weeks: 8, days: [workout("upper"), workout("lower")], week: ["upper", null, "lower", null, null, null, null], start: "2026-11-02" };
  const template = programTemplateFrom(program, "  Strength · 2 days  ");
  assert.notEqual(template.id, program.id);
  assert.equal(template.name, "Strength · 2 days");
  assert.equal(template.start, undefined);
  assert.deepEqual(template.week, program.week);
  template.days[0].exercises[0].sets = 9;
  assert.equal(program.days[0].exercises[0].sets, 3, "editing the template doesn't change the client's programme");
  const older = programTemplateFrom({ ...program, week: undefined });
  assert.equal(older.name, "Strength", "without a name it keeps the programme's");
  assert.deepEqual(older.week, ["upper", "lower", null, "upper", null, "lower", null], "an older programme gets the default week");
});

test("using a template gives the client their own copy from today, keeping past and completed days", () => {
  const template = { id: "tpl", name: "Hypertrophy", phase: "Build", weeks: 2, progression: "", days: [workout("push"), workout("pull")], week: [null, "push", null, "pull", null, null, null] };
  const client = newClient("Maya", "maya@test.app", "c1");
  client.program = { ...client.program, days: [workout("old")], start: "2026-10-01" };
  client.schedule = [{ date: "2026-11-10", dayId: "old" }, { date: "2026-11-18", dayId: "old" }, { date: "2026-11-20", dayId: "old" }];
  const data = { clients: [client], sessions: [{ clientId: "c1", date: "2026-11-18" }] };
  applyProgramTemplate(data, "c1", template, "2026-11-18");
  assert.notEqual(client.program.id, "tpl");
  assert.equal(client.program.name, "Hypertrophy");
  assert.equal(client.program.start, "2026-11-18", "a template starts today rather than continuing the old programme");
  assert.equal(client.programEnd, "2026-12-01");
  assert.deepEqual(client.schedule.map((s) => `${s.date}:${s.dayId}`), [
    "2026-11-10:old", "2026-11-18:old", "2026-11-19:pull", "2026-11-24:push", "2026-11-26:pull", "2026-12-01:push",
  ], "the past day and the completed Wednesday stay; Tuesdays and Thursdays follow the template");
  client.program.days[0].exercises[0].sets = 9;
  assert.equal(template.days[0].exercises[0].sets, 3, "adjusting the client's copy leaves the template alone");
  assert.equal(programError(client.program), "");
});

test("nutrition templates copy the week both ways without sharing it", () => {
  const day = (kcal) => ({ kcal, p: 150, c: 200, f: 70, meals: [{ name: "Lunch", foods: [] }] });
  const plan = { mode: "Structured", days: [day(2600), day(2200), day(2600), day(2200), day(2600), day(2800), day(2000)] };
  const template = nutritionTemplateFrom(plan, " Cut · 4 days ");
  assert.equal(template.name, "Cut · 4 days");
  assert.equal(template.mode, "Structured");
  assert.ok(template.id);
  template.days[0].kcal = 1;
  assert.equal(plan.days[0].kcal, 2600);
  const copy = nutritionFromTemplate(template);
  assert.deepEqual(Object.keys(copy).sort(), ["days", "mode"], "the client's plan carries no template id or name");
  copy.days[1].meals[0].name = "Changed";
  assert.equal(template.days[1].meals[0].name, "Lunch");
  assert.equal(nutritionPlanFor({ nutrition: copy }, "2026-11-21").kcal, 2800);
});
