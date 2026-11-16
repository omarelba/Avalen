-- Workouts synced from a wearable or health app (WHOOP, Oura, Apple Health): one row per
-- provider workout, keyed by the provider's own id so a repeated sync updates rather than
-- duplicates. Times are ISO 8601; `date` is the local day the workout started. `data` holds
-- the checked values (duration, heart rate, calories, distance, heart-rate zone minutes and
-- the provider's own strain score where it reports one). Daily readings stay in wearable_days.
CREATE TABLE IF NOT EXISTS wearable_workouts(
  workspace_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  external_id TEXT NOT NULL,
  date TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT NOT NULL,
  sport TEXT NOT NULL,
  data TEXT NOT NULL,
  synced_at TEXT NOT NULL,
  PRIMARY KEY(workspace_id, client_id, provider, external_id));
CREATE INDEX IF NOT EXISTS wearable_workouts_client ON wearable_workouts(workspace_id, client_id, date);
