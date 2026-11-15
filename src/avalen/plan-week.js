// A client's week: which workout falls on each weekday, and which nutrition targets apply
// on a given date. Shared by the app and the server.
//
// - program.week holds seven workout ids (or null for a rest day), Monday first. Saving
//   the programme rebuilds the schedule from today to the end of the programme from that
//   week; past days and days with a completed workout are never changed.
// - nutrition.days holds seven plans (targets and meals), Monday first. A client whose
//   coach hasn't set nutrition has nutrition: null. Older single-plan clients keep their
//   one plan for every day.
// - A new client starts with no programme, no nutrition and no habits: the coach sets them.
import { uid } from "./id.js";

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Monday = 0 … Sunday = 6, for a YYYY-MM-DD date (no time zone involved).
export const weekdayIndex = (date) => (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7;
const addDays = (date, n) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const emptyProgram = () => ({ id: uid(), name: "", phase: "", weeks: 12, progression: "", days: [], week: [null, null, null, null, null, null, null] });
export const hasProgram = (client) => Array.isArray(client?.program?.days) && client.program.days.length > 0;

// The week a programme repeats. Programmes saved before the weekly template existed get one
// read from the client's coming schedule, so the coach sees what the client already has.
export function programWeek(client, today) {
  const program = client?.program;
  if (Array.isArray(program?.week) && program.week.length === 7) return program.week.map((id) => (program.days.some((d) => d.id === id) ? id : null));
  const week = [null, null, null, null, null, null, null];
  for (let i = 0; i < 7; i++) {
    const date = addDays(today, i);
    const entry = (client?.schedule || []).find((s) => s.date === date);
    if (entry && program?.days?.some((d) => d.id === entry.dayId)) week[weekdayIndex(date)] = entry.dayId;
  }
  return week;
}

// When a programme runs: its saved start, or one worked out from the current end date,
// or today for a new programme (or one that has already ended).
export function programStart(client, program, today) {
  const weeks = Number(program.weeks) || 1;
  if (/^\d{4}-\d{2}-\d{2}$/.test(program.start || "") && addDays(program.start, weeks * 7 - 1) >= today) return program.start;
  if (hasProgram(client) && client.programEnd && client.programEnd >= today) {
    const start = addDays(client.programEnd, -(Number(client.program.weeks) || weeks) * 7 + 1);
    if (addDays(start, weeks * 7 - 1) >= today) return start;
  }
  return today;
}

// The schedule after saving a programme: kept as it was before `today` and on any day with
// a completed workout; from `today` to the programme's last day, rebuilt from the week.
// Returns { schedule, start, programEnd }.
export function scheduleFromWeek(client, program, sessions, today) {
  const done = new Set((sessions || []).filter((s) => s.clientId === client.id).map((s) => s.date));
  const start = programStart(client, program, today);
  const end = addDays(start, Number(program.weeks) * 7 - 1);
  const schedule = (client.schedule || []).filter((s) => s.date < today || done.has(s.date));
  for (let date = today; date <= end; date = addDays(date, 1)) {
    if (done.has(date)) continue;
    const dayId = program.week?.[weekdayIndex(date)];
    if (dayId && program.days.some((d) => d.id === dayId)) schedule.push({ date, dayId });
  }
  schedule.sort((a, b) => a.date.localeCompare(b.date));
  return { schedule, start, programEnd: end };
}

// A template's week before the coach chooses one: its workouts in turn on Monday,
// Tuesday, Thursday and Saturday, as assignments worked before the weekly template.
export function defaultWeek(program) {
  const week = [null, null, null, null, null, null, null];
  if (!program?.days?.length) return week;
  [0, 1, 3, 5].forEach((weekday, i) => (week[weekday] = program.days[i % program.days.length].id));
  return week;
}

export const hasNutrition = (client) => Boolean(nutritionPlanFor(client, null));

// The coach's nutrition plan for a date: that weekday's targets and meals when the coach
// planned each day, otherwise the single plan. null when nothing is set for that day.
// With date = null, any planned day counts.
export function nutritionPlanFor(client, date) {
  const n = client?.nutrition;
  if (!n) return null;
  if (Array.isArray(n.days)) {
    const days = date ? [n.days[weekdayIndex(date)]] : n.days;
    const day = days.find((d) => d && Number(d.kcal) > 0);
    return day ? { mode: n.mode || "Flexible", ...day, meals: day.meals || [] } : null;
  }
  return Number(n.kcal) > 0 ? { ...n, meals: n.meals || [] } : null;
}

// Seven editable day plans for the coach's editor, from whatever the client has now.
export function weekNutrition(client) {
  const n = client?.nutrition;
  const blank = { kcal: "", p: "", c: "", f: "", meals: [] };
  if (Array.isArray(n?.days) && n.days.length === 7) return { mode: n.mode || "Flexible", days: n.days.map((d) => structuredClone(d || blank)) };
  if (n && Number(n.kcal) > 0) {
    const day = { kcal: n.kcal, p: n.p, c: n.c, f: n.f, meals: n.meals || [] };
    return { mode: n.mode || "Flexible", days: WEEKDAYS.map(() => structuredClone(day)) };
  }
  return { mode: "Flexible", days: WEEKDAYS.map(() => structuredClone(blank)) };
}

// A client who has just joined: nothing planned until the coach sets it.
export function blankPlan(client, today) {
  return Object.assign(client, {
    program: emptyProgram(),
    schedule: [],
    programEnd: addDays(today, 83),
    nutrition: null,
    habits: [],
  });
}

// Templates: a coach's reusable training programmes (data.templates) and weekly nutrition
// plans (data.nutritionTemplates). Using one gives the client their own copy, which the
// coach can then adjust without changing the template.

// A client's programme saved as a template: a fresh copy with no start date.
export function programTemplateFrom(program, name = program.name) {
  const copy = structuredClone(program);
  delete copy.start;
  return { ...copy, id: uid(), name: String(name || "").trim() || copy.name, week: Array.isArray(copy.week) && copy.week.length === 7 ? copy.week : defaultWeek(copy) };
}

// Gives a client a programme from a template, starting today on the template's week.
// Past days and completed workouts stay. Changes `data` in place.
export function applyProgramTemplate(data, clientId, template, today) {
  const client = data.clients.find((c) => c.id === clientId);
  const program = { ...structuredClone(template), id: uid(), week: template.week || defaultWeek(template) };
  delete program.start;
  // A new programme: it starts today rather than continuing the old one.
  const { schedule, start, programEnd } = scheduleFromWeek({ ...client, program: { days: [] } }, program, data.sessions, today);
  Object.assign(client, { program: { ...program, start }, schedule, programEnd });
  return client;
}

// A weekly nutrition plan saved as a template, or a template copied into a client's plan.
export function nutritionTemplateFrom(plan, name) {
  return { id: uid(), name: String(name || "").trim(), mode: plan.mode || "Flexible", days: structuredClone(plan.days) };
}
export const nutritionFromTemplate = (template) => ({ mode: template.mode || "Flexible", days: structuredClone(template.days) });

