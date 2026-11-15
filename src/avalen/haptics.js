// Haptic feedback in the iPhone app (DR-12). Called only after a save is confirmed.
// The plugin loads only inside the app; in a browser these do nothing. iOS skips them when
// the phone's system haptics are off.
import { inNativeApp } from './features.js';

let plugin = null;
async function load() {
  if (!inNativeApp()) return null;
  try { plugin ||= await import('@capacitor/haptics'); return plugin; } catch { return null; }
}
export function setLoggedHaptic() {
  load().then((p) => p?.Haptics.impact({ style: p.ImpactStyle.Light })).catch(() => {});
}
export function workoutFinishedHaptic() {
  load().then((p) => p?.Haptics.notification({ type: p.NotificationType.Success })).catch(() => {});
}
