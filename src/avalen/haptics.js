// Haptic feedback in the iPhone app (DR-12 and the polish pass). Each is called only after
// the action is confirmed. The plugin loads only inside the app; in a browser these do
// nothing. iOS skips them when the phone's system haptics are off.
import { inNativeApp } from './features.js';

let plugin = null;
async function load() {
  if (!inNativeApp()) return null;
  try { plugin ||= await import('@capacitor/haptics'); return plugin; } catch { return null; }
}
const run = (fn) => { load().then((p) => p && fn(p)).catch(() => {}); };

// A light tick: switching tabs or segments, each step of a weight or reps stepper.
export function tickHaptic() {
  run(async ({ Haptics }) => { await Haptics.selectionStart(); await Haptics.selectionChanged(); await Haptics.selectionEnd(); });
}
// A light tap: a set, meal or habit is logged; the rest timer is adjusted.
export function lightHaptic() { run(({ Haptics, ImpactStyle }) => Haptics.impact({ style: ImpactStyle.Light })); }
// Success: a workout is finished, a check-in approved, a programme or plan saved.
export function successHaptic() { run(({ Haptics, NotificationType }) => Haptics.notification({ type: NotificationType.Success })); }
// Warning: deleting something, discarding a workout, a form that can't be submitted.
export function warningHaptic() { run(({ Haptics, NotificationType }) => Haptics.notification({ type: NotificationType.Warning })); }

export const setLoggedHaptic = lightHaptic;
export const workoutFinishedHaptic = successHaptic;
