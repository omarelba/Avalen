// A client's plan tab: their programme, schedule and daily habits.
import { useState } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { MotionDetails } from '../motion.jsx';
import { useApp } from '../context.js';
import { dayKey, decision, shortDate } from '../store.js';
import { WEEKDAYS, applyProgramTemplate, hasProgram, programTemplateFrom, programWeek } from '../plan-week.js';
import { useWorkspaceSave } from '../workspace-save.js';
import { Button, Field, Notice, Tabs } from '../ui.jsx';
import { t } from '../i18n.js';
import { ProgressionSuggestions, HabitEditor } from '../insights.jsx';
import { SmartSchedule } from '../ecosystem/scheduling.jsx';
import { ScheduleEditor } from './ScheduleEditor.jsx';
import { TravelPlan } from './TravelPlan.jsx';

// Start a client from one of the coach's programme templates, or save the client's
// programme as a new template. Success shows only after the save is confirmed.
// The confirmation lives with the Plan tab (`done`, `setDone`): using a template swaps the
// empty card for the programme card, and this component with it.
function ProgramTemplates({ client, replacing, done, setDone }) {
  const { data } = useApp();
  const { save, saving, error } = useWorkspaceSave();
  const templates = data.templates || [];
  const [choice, setChoice] = useState(templates[0]?.id || ''), [open, setOpen] = useState(!replacing);
  const first = client.name.split(' ')[0];
  async function useTemplate() {
    const template = templates.find((p) => p.id === choice);
    if (!template || saving) return;
    setDone('');
    if (await save((d) => { applyProgramTemplate(d, client.id, template, dayKey()); decision(d, client.id, 'Programme assigned', template.name); })) {
      setDone(t('{name} now follows “{template}”, starting today.', { name: first, template: t(template.name) }));
      setOpen(false);
    }
  }
  async function saveAsTemplate() {
    if (saving) return;
    setDone('');
    if (await save((d) => { d.templates ||= []; d.templates.push(programTemplateFrom(d.clients.find((c) => c.id === client.id).program)); }))
      setDone(t('Saved to your templates. Use it for any client from their Plan tab or from Programs.'));
  }
  return <div className="programme-templates">
    {replacing && !open && <div className="button-row">
      {templates.length > 0 && <Button small secondary disabled={saving} onClick={() => { setOpen(true); setDone(''); }}>{t('Replace with a template')}</Button>}
      <Button small secondary disabled={saving} onClick={saveAsTemplate}>{saving ? t('Saving…') : t('Save as template')}</Button>
    </div>}
    {open && (templates.length ? <div className="programme-template-pick">
      <Field label={t('Start from a template')}>
        <select value={choice} onChange={(e) => setChoice(e.target.value)} disabled={saving}>
          {templates.map((p) => <option key={p.id} value={p.id}>{t(p.name)} · {t('{weeks} weeks', { weeks: p.weeks })}</option>)}
        </select>
      </Field>
      {replacing && <p className="muted">{t('This replaces {name}’s current programme from today. Completed workouts are kept.', { name: first })}</p>}
      <div className="button-row">
        <Button small disabled={saving || !choice} onClick={useTemplate}>{saving ? t('Saving…') : t('Use this template')}</Button>
        {replacing && <button type="button" className="text-link" disabled={saving} onClick={() => setOpen(false)}>{t('Cancel')}</button>}
      </div>
    </div> : <p className="muted">{t('No programme templates yet. Save a client’s programme as a template, or create one in Programs.')}</p>)}
    {done && <Notice>{done}</Notice>}
    {error && <p role="alert" className="error">{error}</p>}
  </div>;
}

export function ClientPlan({client, onEdit}) {
  const {data, subtab, setSubtab} = useApp();
  const pending = (data.scheduleProposals || []).filter(row => row.clientId === client.id && row.status === 'pending').length;
  const [initialTab] = useState(pending ? 'Schedule' : 'Programme');
  const [note, setNote] = useState({ clientId: '', text: '' });
  const templateNote = note.clientId === client.id ? note.text : '';
  const setTemplateNote = (text) => setNote({ clientId: client.id, text });
  const tab = ['Programme', 'Schedule', 'Habits'].includes(subtab) ? subtab : initialTab;
  return <div className="coach-plan-workspace">
    <Tabs label={t('Plan tools')} items={['Programme', ['Schedule', `Schedule${pending ? ` · ${pending} to review` : ''}`], 'Habits']} value={tab} onChange={setSubtab}/>
    {tab === 'Programme' && !hasProgram(client) && <section className="card"><h2>{t('No programme yet')}</h2><p className="muted">{t('Build {name}’s workouts and choose which days of the week they train. The client sees their plan as soon as you save it.', { name: client.name.split(' ')[0] })}</p><Button onClick={onEdit}>{t('Create programme')} <ArrowRight size={17}/></Button><ProgramTemplates client={client} done={templateNote} setDone={setTemplateNote}/></section>}
    {tab === 'Programme' && hasProgram(client) && <>
      <section className="card"><span className="eyebrow">{client.program.phase}</span><h2>{t(client.program.name)}</h2><p>{t('{weeks} weeks · ends {shortDate}', { weeks: client.program.weeks, shortDate: shortDate(client.programEnd) })}</p><Button onClick={onEdit}>{t('Edit programme')} <ArrowRight size={17}/></Button><ProgramTemplates key={client.program.id} client={client} replacing done={templateNote} setDone={setTemplateNote}/></section>
      <section className="card programme-week-summary" aria-label={t('Weekly schedule')}><span className="eyebrow">{t('EACH WEEK')}</span>
        <ol>{programWeek(client, dayKey()).map((id, i) => <li key={WEEKDAYS[i]}><span>{t(WEEKDAYS[i])}</span><b>{id ? t(client.program.days.find(d => d.id === id)?.name || '') : t('Rest day')}</b></li>)}</ol>
      </section>
      <div className="coach-programme-days">{client.program.days.map(day => <MotionDetails key={day.id}><summary><span><b>{t(day.name)}</b><small>{t('{length} exercises · {minutes} min', { length: day.exercises.length, minutes: day.minutes })}</small></span><ChevronRight size={18}/></summary>{day.exercises.map(exercise => <div className="simple-row" key={exercise.id}><span><b>{t(exercise.name)}</b><small>{exercise.sets} × {exercise.reps}{exercise.kind === 'Duration' ? ' sec' : ' reps'} · {exercise.weight} {t('kg ·')} {exercise.rest}{t('s rest')}</small></span></div>)}</MotionDetails>)}</div>
      <ProgressionSuggestions client={client}/>
    </>}
    {tab === 'Schedule' && <><SmartSchedule client={client} coach/><ScheduleEditor client={client}/><TravelPlan client={client}/></>}
    {tab === 'Habits' && <HabitEditor key={client.id} client={client}/>}
  </div>;
}

