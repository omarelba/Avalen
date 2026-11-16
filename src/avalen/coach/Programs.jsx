// The coach's reusable templates: training programmes (create, edit, duplicate, assign,
// delete) and weekly nutrition plans (create, edit, duplicate, delete). Clients start from
// them on their Plan and Nutrition tabs.
import { useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import { useApp } from '../context.js';
import { useWorkspaceSave } from '../workspace-save.js';
import { defaultProgram } from '../seed.js';
import { dayKey, decision, offsetDay, uid } from '../store.js';
import { WEEKDAYS, applyProgramTemplate } from '../plan-week.js';
import { libraryWithCatalogue } from '../exercise-catalogue.js';
import { Button, Empty, Field, Heading, IconButton, Modal, Notice, SectionHead, Tabs } from '../ui.jsx';
import { NutritionTemplateEditor } from './NutritionEditor.jsx';
import { t } from '../i18n.js';
import { ProgramEditor } from './ProgramEditor.jsx';
import { warningHaptic } from '../haptics.js';

const blankNutritionTemplate = () => ({ id: uid(), name: '', mode: 'Flexible', days: WEEKDAYS.map(() => ({ kcal: '', p: '', c: '', f: '', meals: [] })) });

// The coach's weekly nutrition templates, each with its calories from Monday to Sunday.
function NutritionTemplates({ templates, onEdit, deleteControl }) {
  if (!templates.length) return <Empty icon={FileText} title={t('Reusable nutrition plans.')} detail={t('Create a weekly nutrition template once, then load it for any client from their Nutrition tab and adjust it for them.')} action={<Button onClick={() => onEdit(blankNutritionTemplate())}>{t('Create nutrition template')} <Plus size={16} /></Button>} />;
  return <div className="client-grid">
    {templates.map((tpl) => {
      const kcal = tpl.days.map((d) => Number(d.kcal) || 0), low = Math.min(...kcal), high = Math.max(...kcal);
      return <section className="card" key={tpl.id}>
        <span className="eyebrow">{tpl.mode === 'Structured' ? t('Meal plan') : t('Macro plan')}</span>
        <h2>{tpl.name}</h2>
        <p>{low === high ? t('{kcal} kcal every day', { kcal: low.toLocaleString() }) : t('{low}–{high} kcal across the week', { low: low.toLocaleString(), high: high.toLocaleString() })}</p>
        <div className="button-row">
          <Button small secondary onClick={() => onEdit(structuredClone(tpl))}>{t('Edit')}</Button>
          <button className="text-link" onClick={() => onEdit({ ...structuredClone(tpl), id: uid(), name: `${tpl.name} · copy` })}>{t('Duplicate')}</button>
          {deleteControl(tpl.id)}
        </div>
      </section>;
    })}
  </div>;
}

export function Programs() {
  const { data, update } = useApp();
  const {save, saving, error:saveError} = useWorkspaceSave();
  const [editing, setEditing] = useState(null),
    [assign, setAssign] = useState(null),
    [nutritionEditing, setNutritionEditing] = useState(null),
    [clientId, setClientId] = useState(data.clients[0]?.id || '');
  const programs = data.templates || [];
  const [kind, setKind] = useState('Training'), [confirming, setConfirming] = useState(null);
  const remove = async (list, id) => { if (await save((d) => { d[list] = (d[list] || []).filter((x) => x.id !== id); })) { warningHaptic(); setConfirming(null); } };
  const deleteControl = (list, id) => confirming === id
    ? <span className="template-delete-confirm"><span>{t('Delete this template?')}</span><button className="text-link red" disabled={saving} onClick={() => remove(list, id)}>{t('Delete')}</button><button className="text-link" disabled={saving} onClick={() => setConfirming(null)}>{t('Keep')}</button></span>
    : <button className="text-link" onClick={() => setConfirming(id)}>{t('Delete')}</button>;
  return (
    <>
      <Heading
        title={t('Programs')}
        action={
          <IconButton
            label={kind === 'Nutrition' ? t('Create nutrition template') : t('Create programme')}
            onClick={() => (kind === 'Nutrition' ? setNutritionEditing(blankNutritionTemplate()) : setEditing(defaultProgram()))}
          >
            <Plus size={21} />
          </IconButton>
        }
      />
      <Tabs label="Template type" items={['Training', 'Nutrition']} value={kind} onChange={(value) => { setKind(value); setConfirming(null); }} />
      {kind === 'Nutrition' && <NutritionTemplates templates={data.nutritionTemplates || []} onEdit={setNutritionEditing} deleteControl={(id) => deleteControl('nutritionTemplates', id)} />}
      {kind === 'Training' && <>
      <div className="client-grid">
        {programs.map((p) => (
          <section className="card" key={p.id}>
            <span className="eyebrow">{t('{weeks} WEEKS · {length} DAYS', { weeks: p.weeks, length: p.days.length })}</span>
            <h2>{t(p.name)}</h2>
            <p>{p.phase}</p>
            <div className="button-row">
              <Button
                small
                secondary
                onClick={() => setEditing(structuredClone(p))}
              >
                {t('Edit')}
              </Button>
              <Button small onClick={() => setAssign(p)}>
                {t('Assign')}
              </Button>
              <button
                className="text-link"
                onClick={() =>
                  setEditing({
                    ...structuredClone(p),
                    id: uid(),
                    name: p.name + " · copy",
                  })
                }
              >
                {t('Duplicate')}
              </button>
              {deleteControl('templates', p.id)}
            </div>
          </section>
        ))}
      </div>
      {!programs.length && (
        <Empty
          icon={FileText}
          title={t('Your coaching method, repeatable.')}
          detail={t('Create a reusable template, then assign it to a client. Their copy can be adjusted independently.')}
          action={
            <Button onClick={() => setEditing(defaultProgram())}>
              {t('Create your first programme')} <Plus size={16} />
            </Button>
          }
        />
      )}
      </>}
      {saveError && !assign && <p className="error" role="alert">{saveError}</p>}
      <section className="card">
        <SectionHead
          title={t('Exercise library')}
          action={<span className="pill">{t('{length} movements', { length: libraryWithCatalogue(data.library).length })}</span>}
        />
        <p className="muted">
          {t('The programme builder includes sets, reps, load, rest, tempo, RPE, RIR and coaching notes for every movement.')}
        </p>
      </section>
      {nutritionEditing && (
        <NutritionTemplateEditor
          template={nutritionEditing}
          onClose={() => setNutritionEditing(null)}
          onSave={async (tpl) => {
            const result = await update((d) => {
              d.nutritionTemplates = (d.nutritionTemplates || []).filter((x) => x.id !== tpl.id);
              d.nutritionTemplates.push(tpl);
            });
            if (result?.error) throw new Error(result.error);
            setNutritionEditing(null);
          }}
        />
      )}
      {editing && (
        <ProgramEditor
          program={editing}
          onClose={() => setEditing(null)}
          onSave={async(p) => {
            const result=await update((d) => {
              d.templates = d.templates.filter((t) => t.id !== p.id);
              d.templates.push(p);
            });
            if(result?.error)throw new Error(result.error);
            setEditing(null);
          }}
        />
      )}
      {assign && (
        <Modal title={t('Assign programme')} onClose={() => setAssign(null)} canClose={!saving}>
          <fieldset className="save-fields" disabled={saving}>
          <Field label={t('Client')}>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              {data.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {t(c.name)}
                </option>
              ))}
            </select>
          </Field>
          <Notice>{t('This replaces the client’s current plan and follows the programme’s week for the full {weeks} weeks, starting today. Completed workout history is kept.', { weeks: assign.weeks })}</Notice>
          <Button
            onClick={async () => {
              if (!await save((d) => {
                const c = applyProgramTemplate(d, clientId, assign, dayKey());
                decision(d, c.id, "Programme assigned", assign.name);
              })) return;
              setAssign(null);
            }}
          >
            {saving ? t('Assigning programme…') : t('Confirm assignment')}
          </Button>
          {saveError && <p className="error" role="alert">{saveError}</p>}
          </fieldset>
        </Modal>
      )}
    </>
  );
}

