import { t } from './i18n.js';
// Keep missing values missing: Number(null) and Number('') otherwise become zero.
export function chartRecords(records, field) {
  return records.filter((record) => {
    const value = record[field];
    return value !== null && value !== undefined && String(value).trim() !== '' && Number.isFinite(Number(value));
  }).sort((a, b) => a.date.localeCompare(b.date));
}

export function fieldMessage(input, label = 'this field') {
  const value = input.value.trim();
  if (input.required && !value) return t('Please enter {value}.', { value: label.toLowerCase() });
  const validity = input.validity;
  if (validity.typeMismatch) return t('Enter a valid email address, such as you@example.com.');
  if (validity.badInput) return t('Enter a valid number.');
  if (validity.rangeUnderflow) return t('Enter {min} or more.', { min: input.min });
  if (validity.rangeOverflow) return t('Enter {max} or less.', { max: input.max });
  if (validity.stepMismatch) return input.step === '1' ? t('Enter a whole number.') : t('Use increments of {step}.', { step: input.step });
  if (validity.patternMismatch) return t('Please use the requested format.');
  if (validity.tooShort) return t('Use at least {min} characters.', { min: input.minLength });
  if (validity.tooLong) return t('Use {max} characters or fewer.', { max: input.maxLength });
  return '';
}

// Passwords: at least PASSWORD_MIN characters, no more than PASSWORD_MAX. The server
// enforces the same limits (server/context.js, server/routes/accounts.js).
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 200;
const COMMON_PASSWORDS = ['password', 'passw0rd', '12345678', '123456789', '1234567890', 'qwerty', 'qwertyuiop', 'iloveyou', 'avalen', 'letmein', 'welcome', 'admin', 'abc123', '11111111', '00000000'];
// A quick estimate for the strength meter, from length, variety and obvious patterns.
// 0 = weak, 1 = fair, 2 = good, 3 = strong. It guides; the server only checks length.
export function passwordStrength(password = '') {
  const value = String(password);
  if (!value) return null;
  const lower = value.toLowerCase();
  if (value.length < PASSWORD_MIN || COMMON_PASSWORDS.some((word) => lower.includes(word)) || /^(.)\1+$/.test(value)) return 0;
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(value)).length;
  let score = 0;
  if (value.length >= 10) score++;
  if (value.length >= 14) score++;
  if (kinds >= 2) score++;
  if (kinds >= 3) score++;
  if (/^\d+$/.test(value) || /(.)\1\1/.test(value)) score--;
  return Math.max(0, Math.min(3, score - 1 + (value.length >= 18 ? 1 : 0)));
}
export const PASSWORD_LEVELS = ['Weak', 'Fair', 'Good', 'Strong'];

export function programError(program) {
  if (!program.name?.trim()) return t('Give your programme a name.');
  if (!Number.isInteger(Number(program.weeks)) || program.weeks < 1 || program.weeks > 52) return t('Weeks must be a whole number from 1 to 52.');
  if (!program.days.length) return t('Add at least one training day.');
  for (const day of program.days) {
    if (!day.name?.trim() || day.name.length > 70) return t('Give each day a name of 1–70 characters.');
    if (!Number.isInteger(Number(day.minutes)) || day.minutes < 5 || day.minutes > 180) return t('{name}: estimated minutes must be a whole number from 5 to 180.', { name: day.name });
    if (!day.exercises.length) return t('{name}: add at least one exercise.', { name: day.name });
    for (const exercise of day.exercises) {
      for (const [key, label, min, max] of [['sets', 'sets', 1, 20], ['reps', 'reps', 1, 100], ['weight', 'load', 0, 1000], ['rest', 'rest seconds', 0, 600], ['rpe', 'RPE', 1, 10], ['rir', 'reps in reserve', 0, 10]]) {
        const value = exercise[key];
        if (value === '' || !Number.isFinite(Number(value)) || value < min || value > max || (key !== 'weight' && !Number.isInteger(Number(value)))) return t('{name} · {name2}: enter {value} from {min} to {max} for {label}.', { name: day.name, name2: exercise.name, value: key === 'weight' ? 'a number' : 'a whole number', min, max, label });
      }
    }
  }
  if (program.week !== undefined) {
    if (!Array.isArray(program.week) || program.week.length !== 7 || program.week.some((id) => id !== null && !program.days.some((d) => d.id === id)))
      return t('Choose a workout or a rest day for each day of the week.');
    if (!program.week.some(Boolean)) return t('Choose at least one day of the week for a workout.');
  }
  return '';
}

export function consistencyState({ workout, scheduled, foodLogged, nutrition, habits = [], values = {}, mode }) {
  if (mode === 'Habits') return habits.length && habits.every(h => Number(values[h.id] || 0) >= h.target) ? 'both' : Object.keys(values).length ? 'partial' : 'none';
  if (mode === 'Training') return workout ? 'both' : 'none';
  if (mode === 'Nutrition') return nutrition ? 'both' : foodLogged ? 'partial' : 'none';
  if (nutrition && (workout || !scheduled)) return 'both';
  if (workout || (foodLogged && !nutrition)) return 'partial';
  return nutrition ? 'nutrition' : 'none';
}

export function latestMeasurement(records, field) {
  return chartRecords(records, field).at(-1) || null;
}

// A coach's own food: a name, a serving, and its calories, protein, carbs and fat.
// Returns "" when it's fine, otherwise what to fix.
export function customFoodError(food) {
  if (!food || typeof food !== "object") return "Enter the food's details.";
  const name = typeof food.name === "string" ? food.name.trim() : "";
  if (!name || name.length > 80) return "Give the food a name of up to 80 characters.";
  if (typeof food.portion !== "string" || !food.portion.trim() || food.portion.length > 60) return "Describe the serving in up to 60 characters, for example 1 cup · 150 g.";
  for (const [key, label, max] of [["kcal", "Calories", 5000], ["p", "Protein", 500], ["c", "Carbs", 1000], ["f", "Fat", 500]]) {
    const value = food[key];
    if (value === "" || value == null || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > max) return `${label} must be a number from 0 to ${max.toLocaleString("en-US")}.`;
  }
  return "";
}
