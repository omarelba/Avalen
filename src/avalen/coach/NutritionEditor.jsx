// The coach's nutrition prescription for one client, for each weekday: targets, planned
// meals built from foods with amounts, and how the day's meals compare with those targets.
import { useState } from 'react';
import { ChevronRight, Plus, Trash2 } from 'lucide-react';
import { MotionDetails } from '../motion.jsx';
import { useApp } from '../context.js';
import { useEditDraft, EditSaveBar } from '../edit-draft.jsx';
import { nutritionDay, targetValues } from '../nutrition-model.js';
import { dayKey, decision } from '../store.js';
import { Button, Field, Modal, Notice, SectionHead, Tabs } from '../ui.jsx';
import { ReasonChips } from './ReasonChips.jsx';
import { WEEKDAYS, nutritionFromTemplate, nutritionTemplateFrom, weekNutrition, weekdayIndex } from '../plan-week.js';
import { t } from '../i18n.js';
import { MealFoodsEditor } from '../MealFoods.jsx';
import { dayTotals, itemsTotals } from '../portions.js';
import { successHaptic } from '../haptics.js';

// The day as planned, from every meal, beside the targets the coach set above.
function DayTotals({ meals, targets, structured }) {
  const rows = dayTotals(meals, targets);
  const off = rows.some((row) => row.status === 'short' || row.status === 'over');
  return <div className="plan-day-totals" role="group" aria-label={t('Day total from meals')}>
    <div className="plan-day-totals-head"><span className="eyebrow">{t('Day total from meals')}</span><small>{t('Compared with your targets')}</small></div>
    {rows.map((row) => <div key={row.key} className={`plan-day-row is-${row.status}`}>
      <span>{t(row.label)}</span>
      <b>{t('{value} of {target} {unit}', { value: row.value.toLocaleString(), target: row.target.toLocaleString(), unit: t(row.unit) })}</b>
      <small>{row.status === 'on' ? t('On target') : row.status === 'short' ? t('{amount} {unit} short', { amount: Math.abs(row.diff).toLocaleString(), unit: t(row.unit) }) : row.status === 'over' ? t('{amount} {unit} over', { amount: Math.abs(row.diff).toLocaleString(), unit: t(row.unit) }) : t('No target')}</small>
      <i aria-hidden="true"><em style={{ inlineSize: `${row.target ? Math.min(100, (row.value / row.target) * 100) : 0}%` }}/></i>
      {row.missing > 0 && row.key !== 'kcal' && <small className="plan-day-missing">{t('Not entered for {count} meals', { count: row.missing })}</small>}
    </div>)}
    {structured && off && <p className="fine-print muted">{t('Review any difference before publishing.')}</p>}
  </div>;
}


const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MACROS = [["kcal", "Calories"], ["p", "Protein (g)"], ["c", "Carbs (g)"], ["f", "Fat (g)"]];
const dayReady = (day) => Number(day?.kcal) > 0 && ["p", "c", "f"].every((k) => day[k] !== "" && Number(day[k]) >= 0);
// The first weekday without targets, or -1 when all seven are set.
export const firstMissingDay = (plan) => plan.days.findIndex((d) => !dayReady(d));
const cleanPlan = (form) => ({ mode: form.mode, days: form.days.map((d) => ({ ...d, kcal: Number(d.kcal), p: Number(d.p), c: Number(d.c), f: Number(d.f), meals: d.meals || [] })) });

// The weekday tabs, targets and meals of a weekly plan. Used for a client's plan and for
// the coach's nutrition templates.
export function WeekNutritionFields({ form, setForm, dayIndex, setDayIndex }) {
  const day = form.days[dayIndex];
  const setDay = (next) => setForm({ ...form, days: form.days.map((d, i) => (i === dayIndex ? next : d)) });
  const setMeals = (meals) => setDay({ ...day, meals });
  const [copied, setCopied] = useState('');
  return <>
    <Field label={t('Approach')}>
      <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
        <option value="Flexible">{t('Flexible')}</option>
        <option value="Structured">{t('Structured')}</option>
      </select>
    </Field>
    <Tabs label="Weekday" items={WEEKDAYS.map((name, i) => [String(i), `${t(SHORT_DAYS[i])}${dayReady(form.days[i]) ? ` · ${Number(form.days[i].kcal).toLocaleString()}` : ''}`])} value={String(dayIndex)} onChange={(value) => { setDayIndex(Number(value)); setCopied(''); }} />
    <div className="nutrition-day-head"><h3>{t(WEEKDAYS[dayIndex])}</h3>
      <button type="button" className="text-link" disabled={!dayReady(day)} onClick={() => { setForm({ ...form, days: form.days.map(() => structuredClone(day)) }); setCopied(t('{day} copied to every day.', { day: t(WEEKDAYS[dayIndex]) })); }}>{t('Copy this day to every day')}</button>
    </div>
    {copied && <p className="muted" role="status">{copied}</p>}
    <div className="form-grid">
      {MACROS.map(([key, label]) => (
        <Field key={`${dayIndex}-${key}`} label={t(label)} type="number" required min={key === "kcal" ? "1" : "0"} max={key === "kcal" ? 10000 : 1000} value={day[key]}
          onChange={(e) => setDay({ ...day, [key]: e.target.value === '' ? '' : Number(e.target.value) })} />
      ))}
    </div>
    <div className="nutrition-meal-editor"><SectionHead title={form.mode === 'Structured' ? t('Your prescribed meals') : t('Suggested meals')}/>
      <DayTotals meals={day.meals || []} targets={day} structured={form.mode === "Structured"} />
      {(day.meals || []).map((m,i)=><MotionDetails className="card coach-meal-editor" key={`${dayIndex}-${i}`} open={i===0 || !m.description || undefined}><summary><span><b>{m.name || t('New meal')}</b><small>{m.description || (m.items?.length ? m.items.map(x => t(x.name)).join(', ') : t('Add meal guidance'))}</small></span><span>{Number(m.kcal || 0).toLocaleString()} kcal<ChevronRight size={16}/></span></summary><div className="coach-meal-fields">
        <Field label={t('Meal name')} required maxLength={70} value={m.name} onChange={e=>setMeals(day.meals.map((x,j)=>j===i?{...x,name:e.target.value}:x))}/>
        <Field label={t('Meal guidance')} maxLength={500} value={m.description} onChange={e=>setMeals(day.meals.map((x,j)=>j===i?{...x,description:e.target.value}:x))}/>
        <MealFoodsEditor items={m.items || []} onChange={items=>setMeals(day.meals.map((x,j)=>j===i?{...x,items,...(items.length?itemsTotals(items):{})}:x))}/>
        <div className="form-grid">{[['kcal','Meal calories'],['p','Meal protein (g)'],['c','Meal carbs (g)'],['f','Meal fat (g)']].map(([key,label])=><Field key={key} label={label} type="number" min="0" step={key==='kcal'?'1':'0.1'} max={key==='kcal'?10000:1000} required={key==='kcal'} value={m[key]??''} onChange={e=>setMeals(day.meals.map((x,j)=>j===i?{...x,[key]:e.target.value===''?null:Number(e.target.value)}:x))}/>)}</div>
        <button type="button" className="text-link red" onClick={()=>setMeals(day.meals.filter((_,j)=>i!==j))}><Trash2 size={14}/>{t('Remove meal')}</button>
      </div></MotionDetails>)}
      <Button secondary onClick={()=>setMeals([...(day.meals||[]),{name:'Snack',description:'',kcal:0,p:null,c:null,f:null}])}><Plus size={15}/>{t('Add planned meal')}</Button>
    </div>
  </>;
}

// Targets and meals for each weekday, Monday to Sunday, for one client. The client sees the
// plan for the day it is; a day logged earlier keeps the targets it was logged against. The
// coach can start from a nutrition template or save this plan as one.
export function NutritionEditor({ client }) {
  const { data, update } = useApp();
  const draft = useEditDraft(`nutrition-week.${client.id}`, { plan: weekNutrition(client), reason: '' });
  const form = draft.value.plan, reason = draft.value.reason;
  const setForm = plan => draft.setValue(v => ({ ...v, plan }));
  const setReason = reason => draft.setValue(v => ({ ...v, reason }));
  const [dayIndex, setDayIndex] = useState(() => weekdayIndex(dayKey()));
  const [saved, setSaved] = useState(false),[saveError,setSaveError]=useState(''),[saving,setSaving]=useState(false);
  const templates = data.nutritionTemplates || [];
  const [templateId, setTemplateId] = useState(''), [templateName, setTemplateName] = useState(''), [templateNote, setTemplateNote] = useState('');
  async function saveAsTemplate() {
    if (saving) return;
    const missing = firstMissingDay(form);
    if (missing >= 0) { setDayIndex(missing); setSaveError(t('Set calories, protein, carbs and fat for {day}.', { day: t(WEEKDAYS[missing]) })); return; }
    if (!templateName.trim()) { setSaveError(t('Name the template first.')); return; }
    setSaving(true); setSaveError(''); setTemplateNote('');
    const result = await update((d) => { d.nutritionTemplates ||= []; d.nutritionTemplates.push(nutritionTemplateFrom(cleanPlan(form), templateName)); });
    setSaving(false);
    if (result?.error) { setSaveError(result.error); return; }
    setTemplateNote(t('Saved “{name}” to your nutrition templates.', { name: templateName.trim() }));
    setTemplateName('');
  }
  return (
    <section className="card">
      <SectionHead title={t('Nutrition prescription')} />
      {templates.length > 0 && <div className="nutrition-template-pick">
        <Field label={t('Start from a template')}>
          <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            <option value="">{t('Choose a template')}</option>
            {templates.map((tpl) => <option key={tpl.id} value={tpl.id}>{tpl.name}</option>)}
          </select>
        </Field>
        <Button small secondary disabled={!templateId} onClick={() => { const tpl = templates.find((x) => x.id === templateId); if (!tpl) return; setForm(nutritionFromTemplate(tpl)); setSaved(false); setTemplateNote(t('“{name}” loaded. Adjust anything for this client, then save.', { name: tpl.name })); }}>{t('Load template')}</Button>
      </div>}
      <form
        onChangeCapture={() => setSaved(false)}
        onSubmit={async(e) => {
          e.preventDefault();
          if(saving)return;
          // Every weekday needs targets before the plan is published.
          const missing = firstMissingDay(form);
          if (missing >= 0) { setDayIndex(missing); setSaveError(t('Set calories, protein, carbs and fat for {day}.', { day: t(WEEKDAYS[missing]) })); return; }
          setSaving(true);setSaveError('');
          const plan = cleanPlan(form);
          const result=await update((d) => {
            const c = d.clients.find((c) => c.id === client.id);
            c.nutrition = structuredClone(plan);
            // Today, if food is already logged, is measured against today's new targets.
            const today = nutritionDay(d,client.id,dayKey());
            if (today) { today.target = targetValues(plan.days[weekdayIndex(dayKey())]); today.complete = false; }
            decision(d, client.id, "Nutrition adjusted", `${t('Weekly nutrition plan updated.')} ${reason}`);
          });
          setSaving(false);if(result?.error){setSaveError(result.error);return;}
          draft.clear({ plan: structuredClone(plan), reason: '' });
          setSaved(true);
          successHaptic();
        }}
      >
        <WeekNutritionFields form={form} setForm={(next) => { setForm(next); setSaved(false); }} dayIndex={dayIndex} setDayIndex={setDayIndex} />
        <ReasonChips value={reason} onPick={setReason} />
        <Field label={t('Why are you making this change?')}>
          <textarea required value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
{saveError&&<p role="alert" className="error">{saveError}</p>}<EditSaveBar draft={draft} disabled={saving} label={t('Save nutrition plan')} saved={saved}/>
        {saved && (
          <Notice>{t('Updated. The client’s targets now reflect this plan.')}</Notice>
        )}
      </form>
      <div className="nutrition-template-save">
        <Field label={t('Save this plan as a template')} value={templateName} maxLength={70} placeholder={t('e.g. Fat loss · 4 training days')} onChange={(e) => setTemplateName(e.target.value)} />
        <Button small secondary disabled={saving} onClick={saveAsTemplate}>{saving ? t('Saving…') : t('Save as template')}</Button>
      </div>
      {templateNote && <p className="muted" role="status">{templateNote}</p>}
    </section>
  );
}

// Creating or editing one of the coach's nutrition templates.
export function NutritionTemplateEditor({ template, onClose, onSave }) {
  const [form, setForm] = useState(() => ({ mode: template.mode || 'Flexible', days: structuredClone(template.days) }));
  const [name, setName] = useState(template.name || ''), [dayIndex, setDayIndex] = useState(0), [error, setError] = useState(''), [saving, setSaving] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (saving) return;
    if (!name.trim()) { setError(t('Name the template first.')); return; }
    const missing = firstMissingDay(form);
    if (missing >= 0) { setDayIndex(missing); setError(t('Set calories, protein, carbs and fat for {day}.', { day: t(WEEKDAYS[missing]) })); return; }
    setSaving(true); setError('');
    try { await onSave({ ...template, name: name.trim(), ...cleanPlan(form) }); }
    catch (err) { setError(err.message); setSaving(false); }
  }
  return <Modal title={t('Nutrition template')} onClose={() => { if (!saving) onClose(); }} wide canClose={!saving}>
    <form onSubmit={submit}><fieldset className="save-fields" disabled={saving}>
      <Field label={t('Template name')} required maxLength={70} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('e.g. Fat loss · 4 training days')} />
      <WeekNutritionFields form={form} setForm={setForm} dayIndex={dayIndex} setDayIndex={setDayIndex} />
      {error && <p role="alert" className="error">{error}</p>}
      <Button type="submit">{saving ? t('Saving…') : t('Save template')}</Button>
    </fieldset></form>
  </Modal>;
}
