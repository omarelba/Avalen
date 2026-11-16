// The haptic after a food entry is saved: success when it takes the day to its calorie
// target, a light tap otherwise. `data` is the workspace before the entry was saved.
import { targetsFor } from './nutrition-model.js';
import { lightHaptic, successHaptic } from './haptics.js';

export function foodLoggedHaptic(data, client, entry) {
  const target = Number(targetsFor(client, entry.date)?.kcal) || 0;
  const before = (data.foodLogs || []).filter((f) => f.clientId === client.id && f.date === entry.date && f.id !== entry.id).reduce((sum, f) => sum + (Number(f.kcal) || 0), 0);
  const after = before + (Number(entry.kcal) || 0);
  (target > 0 && before < target && after >= target ? successHaptic : lightHaptic)();
}
