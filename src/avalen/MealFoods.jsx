// The foods on a planned meal, each with a clear amount. Coaches add them from the
// food library and set how many portions; clients see exactly what goes on the plate.
import React, { useMemo, useState } from 'react';
import { Minus, Plus, Search, Trash2, MoreHorizontal } from 'lucide-react';
import { ALL_FOODS, customLibrary, rankFoods } from './food-library.js';
import { amountLabel, mealItem, portionLabel, withServings } from './portions.js';
import { t } from './i18n.js';
import { warningHaptic } from './haptics.js';
import { useApp } from './context.js';
import { useWorkspaceSave } from './workspace-save.js';
import { CustomFoodForm } from './coach/CustomFood.jsx';

export function MealFoodsList({ items = [] }) {
  if (!items.length) return null;
  return <ul className="planned-meal-foods" aria-label={t('Foods in this meal')}>
    {items.map((item, i) => <li key={`${item.name}-${i}`}><span>{t(item.name)}</span><b>{portionLabel(amountLabel(item))}</b></li>)}
  </ul>;
}

// A coach's custom food in search: add it like any food, or delete it (asked first).
function CustomFoodResult({ food, onAdd }) {
  const { save, saving, error } = useWorkspaceSave();
  const [confirming, setConfirming] = useState(false);
  async function remove() {
    if (await save((d) => { d.customFoods = (d.customFoods || []).filter((x) => x.id !== food.id); })) warningHaptic();
  }
  return <div className="meal-food-result-custom">
    <button type="button" onClick={onAdd}>
      <span><b>{food.name}<em className="custom-food-tag">{t('Custom')}</em></b><small>{portionLabel(food.portion)} · {t('{kcal} kcal', { kcal: food.kcal })}</small></span><Plus size={15}/>
    </button>
    {confirming
      ? <span className="template-delete-confirm"><span>{t('Delete this food?')}</span><button type="button" className="text-link red" disabled={saving} onClick={remove}>{t('Delete')}</button><button type="button" className="text-link" disabled={saving} onClick={() => setConfirming(false)}>{t('Keep')}</button></span>
      : <button type="button" className="custom-food-delete" aria-label={t('Delete custom food {name}', { name: food.name })} onClick={() => setConfirming(true)}><Trash2 size={15}/></button>}
    {error && <p className="error" role="alert">{error}</p>}
  </div>;
}

export function MealFoodsEditor({ items = [], onChange }) {
  const { data } = useApp();
  const [query, setQuery] = useState(''), [creating, setCreating] = useState(false);
  // Removing a food is one step away, behind the row's "…" menu (DR-05).
  const [menu, setMenu] = useState(null);
  // The coach's own foods are searched together with the library, in one ranked list.
  const custom = data.customFoods || [];
  const results = useMemo(() => (query.trim() ? rankFoods([...ALL_FOODS, ...customLibrary(custom)], query).slice(0, 8) : []), [query, custom]);
  const add = (food) => { onChange([...items, mealItem(food, 1)]); setQuery(''); setCreating(false); };
  const change = (i, servings) => onChange(items.map((item, j) => (j === i ? withServings(item, servings) : item)));
  return <div className="meal-foods-editor">
    <span className="eyebrow">{t('Foods and amounts')}</span>
    {items.length ? <ul>{items.map((item, i) => <li key={`${item.name}-${i}`}>
      <span><b>{t(item.name)}</b><small>{portionLabel(amountLabel(item))} · {t('{kcal} kcal', { kcal: item.kcal })}</small></span>
      <span className="meal-food-stepper">
        <button type="button" aria-label={t('Less {name}', { name: t(item.name) })} disabled={item.servings <= 0.5} onClick={() => change(i, item.servings - 0.5)}><Minus size={15}/></button>
        <output aria-live="polite">{item.servings}×</output>
        <button type="button" aria-label={t('More {name}', { name: t(item.name) })} disabled={item.servings >= 10} onClick={() => change(i, item.servings + 0.5)}><Plus size={15}/></button>
        <button type="button" aria-label={t('More options for {name}', { name: t(item.name) })} aria-expanded={menu === i} onClick={() => setMenu(menu === i ? null : i)}><MoreHorizontal size={15}/></button>
      </span>
      {menu === i && <div className="meal-food-menu"><button type="button" className="text-link red" onClick={() => { onChange(items.filter((_, j) => j !== i)); setMenu(null); warningHaptic(); }}><Trash2 size={14}/>{t('Remove {name}', { name: t(item.name) })}</button></div>}
    </li>)}</ul> : <p className="fine-print muted">{t('Add foods so your client knows exactly what and how much to eat. The meal totals add up for you.')}</p>}
    <label className="search meal-food-search"><Search size={16}/><input type="search" placeholder={t('Add a food…')} aria-label={t('Add a food to this meal')} value={query} onChange={(e) => setQuery(e.target.value)}/></label>
    {results.length > 0 && <div className="meal-food-results">{results.map((food) => food.custom
      ? <CustomFoodResult key={`custom-${food.id}`} food={food} onAdd={() => add(food)} />
      : <button type="button" key={food.name} onClick={() => add(food)}>
          <span><b>{t(food.name)}</b><small>{portionLabel(food.portion)} · {t('{kcal} kcal', { kcal: food.kcal })}</small></span><Plus size={15}/>
        </button>)}</div>}
    {creating
      ? <CustomFoodForm initialName={query.trim()} onSaved={add} onCancel={() => setCreating(false)} />
      : <button type="button" className="text-link" onClick={() => setCreating(true)}><Plus size={14}/>{query.trim() && !results.length ? t('Create “{name}” as a custom food', { name: query.trim() }) : t('Create a custom food')}</button>}
  </div>;
}
