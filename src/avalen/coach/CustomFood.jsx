// A coach's own foods: created with their calories, protein, carbs and fat, and saved to
// the coach's workspace. From then on they are part of food search for the coach and the
// coach's clients, ranked with the library foods. Only the coach can add or delete them.
import { useState } from 'react';
import { useApp } from '../context.js';
import { useWorkspaceSave } from '../workspace-save.js';
import { uid } from '../store.js';
import { customFoodError } from '../validation.js';
import { Button, Field } from '../ui.jsx';
import { t } from '../i18n.js';

const EMPTY = { name: '', portion: '1 serving', kcal: '', p: '', c: '', f: '' };

// The form sits inside other forms (a meal plan), so it saves with its own button and
// handles Enter itself instead of submitting the plan.
export function CustomFoodForm({ initialName = '', onSaved, onCancel }) {
  const { data } = useApp();
  const { save, saving, error: saveError } = useWorkspaceSave();
  const [food, setFood] = useState({ ...EMPTY, name: initialName });
  const [error, setError] = useState('');
  const set = (key) => (event) => { setFood({ ...food, [key]: event.target.value }); setError(''); };
  async function submit() {
    if (saving) return;
    const entry = { id: uid(), name: food.name.trim(), portion: food.portion.trim(), kcal: Number(food.kcal), p: Number(food.p), c: Number(food.c), f: Number(food.f) };
    const issue = customFoodError({ ...food, name: food.name.trim(), portion: food.portion.trim() });
    if (issue) return setError(t(issue));
    if ((data.customFoods || []).some((x) => x.name.toLowerCase() === entry.name.toLowerCase())) return setError(t('You already have a food called “{name}”.', { name: entry.name }));
    if (await save((d) => { d.customFoods ||= []; d.customFoods.push(entry); })) onSaved?.(entry);
  }
  const enter = (event) => { if (event.key === 'Enter') { event.preventDefault(); submit(); } };
  return <div className="custom-food-form" role="group" aria-label={t('New custom food')} onKeyDown={enter}>
    <fieldset className="save-fields" disabled={saving}>
      <Field label={t('Food name')} value={food.name} maxLength={80} onChange={set('name')} placeholder={t('e.g. Protein pancakes')} />
      <Field label={t('Serving')} value={food.portion} maxLength={60} onChange={set('portion')} placeholder={t('e.g. 1 cup · 150 g')} hint={t('Include the weight in g or ml if you know it.')} />
      <div className="form-grid">
        <Field label={t('Calories')} type="number" inputMode="decimal" min="0" value={food.kcal} onChange={set('kcal')} />
        <Field label={t('Protein (g)')} type="number" inputMode="decimal" min="0" value={food.p} onChange={set('p')} />
        <Field label={t('Carbs (g)')} type="number" inputMode="decimal" min="0" value={food.c} onChange={set('c')} />
        <Field label={t('Fat (g)')} type="number" inputMode="decimal" min="0" value={food.f} onChange={set('f')} />
      </div>
      {(error || saveError) && <p className="error" role="alert">{error || saveError}</p>}
      <div className="button-row">
        <Button type="button" small onClick={submit}>{saving ? t('Saving…') : t('Save food')}</Button>
        {onCancel && <button type="button" className="text-link" onClick={onCancel}>{t('Cancel')}</button>}
      </div>
    </fieldset>
  </div>;
}
