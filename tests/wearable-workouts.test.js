// Synced wearable workouts (Phase 1): the table, checking, repeat syncs and deletion.
// Runs against SQLite, and PostgreSQL with `pnpm test:postgres`.
import test from "node:test";
import assert from "node:assert/strict";
import { cleanWorkout } from "../src/avalen/wearables-model.js";
import { fixture } from "./helpers/service.js";

const run = { externalId: "whoop-123", sport: "Running", startedAt: "2026-11-16T07:00:00+02:00", endedAt: "2026-11-16T07:45:00+02:00", date: "2026-11-16", avgHr: 152, maxHr: 181, kcal: 520, distanceM: 8200, strain: 12.4, zoneMinutes: [2, 5, 12, 18, 7, 1] };

test("a workout is checked before it is stored", () => {
  const w = cleanWorkout(run);
  assert.deepEqual(w, { externalId: "whoop-123", sport: "running", startedAt: run.startedAt, endedAt: run.endedAt, date: "2026-11-16", data: { durationMin: 45, avgHr: 152, maxHr: 181, kcal: 520, distanceM: 8200, strain: 12.4, zoneMinutes: [2, 5, 12, 18, 7, 1] } });
  assert.throws(() => cleanWorkout({ ...run, externalId: "" }), /id/);
  assert.throws(() => cleanWorkout({ ...run, endedAt: run.startedAt }), /after its start/);
  assert.throws(() => cleanWorkout({ ...run, startedAt: "yesterday" }), /ISO 8601/);
  assert.throws(() => cleanWorkout({ ...run, avgHr: 400 }), /avgHr/);
  assert.throws(() => cleanWorkout({ ...run, strain: 30 }), /strain/);
  assert.throws(() => cleanWorkout({ ...run, zoneMinutes: [1, 2] }), /zoneMinutes/);
  assert.equal(cleanWorkout({ ...run, sport: "", avgHr: undefined }).sport, "workout");
});

test("workouts are stored once per provider workout, and deleted with the client's readings", async () => {
  const f = await fixture({ plannedFirstClient: false });
  try {
    const store = f.store.wearables, client = f.coach.data.clients[0].id;
    const { workspace_id: workspace } = await f.db.get("SELECT workspace_id FROM users WHERE email='coach@test.app'");
    await store.saveWorkout(workspace, client, "whoop", cleanWorkout(run), "2026-11-16T08:00:00Z");
    await store.saveWorkout(workspace, client, "whoop", cleanWorkout({ ...run, kcal: 540 }), "2026-11-16T09:00:00Z");
    await store.saveWorkout(workspace, client, "apple", cleanWorkout({ ...run, externalId: "HK-UUID-1", strain: undefined }), "2026-11-16T09:00:00Z");
    let rows = await store.workoutsSince(workspace, client, "2026-11-01");
    assert.equal(rows.length, 2, "a repeated sync of the same workout updates it");
    assert.equal(rows.find((r) => r.provider === "whoop").data.kcal, 540);
    assert.equal(rows.find((r) => r.provider === "apple").data.strain, undefined, "Avalen never fills in a strain score");

    await store.deleteWorkouts(workspace, client, "apple");
    rows = await store.workoutsSince(workspace, client, "2026-11-01");
    assert.deepEqual(rows.map((r) => r.provider), ["whoop"], "disconnecting one provider with history deleted removes only its workouts");

    await store.deleteAll(workspace, client, { keepReadings: true });
    assert.equal((await store.workoutsSince(workspace, client, "2026-11-01")).length, 1, "keeping history keeps workouts");
    await store.deleteAll(workspace, client);
    assert.equal((await store.workoutsSince(workspace, client, "2026-11-01")).length, 0, "deleting the client's wearable data removes workouts too");
  } finally {
    await f.close();
  }
});
