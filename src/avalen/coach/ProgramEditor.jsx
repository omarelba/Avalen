// The programme builder: a coach assembles a client's or template's workouts from the
// exercise catalogue, with per-exercise prescriptions and media, and chooses which
// workout falls on each weekday. That week repeats for the length of the programme.
import { useMemo, useRef, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useApp } from '../context.js';
import { useEditDraft, EditSaveBar } from '../edit-draft.jsx';
import { programError } from '../validation.js';
import { saveFile, uid } from '../store.js';
import { CustomExercise } from '../insights.jsx';
import { BACKGROUNDS, Button, Field, Modal, Tabs } from '../ui.jsx';
import { WEEKDAYS, defaultWeek } from '../plan-week.js';
import { matchesSearch, t } from '../i18n.js';
import { REGIONS, groupLabel, libraryWithCatalogue, planExercise, regionOf } from '../exercise-catalogue.js';
import { ReasonChips } from './ReasonChips.jsx';
import { warningHaptic } from '../haptics.js';

// How many exercises the builder's library shows before "Show all" (DR-15).
const LIBRARY_PREVIEW = 24;

export function ProgramEditor({ program, onClose, onSave, draftKey = `template.${program.id}` }) {
  const { data } = useApp();
  const uploadLock = useRef(false);
  const [uploading, setUploading] = useState(false);
  const editor = useEditDraft(`programme.${draftKey}`, { plan: { ...program, week: program.week || defaultWeek(program) }, reason: '' });
  const draft = editor.value.plan, reason = editor.value.reason;
  const setDraft = value => editor.setValue(prev => ({ ...prev, plan: typeof value === 'function' ? value(prev.plan) : value }));
  const setReason = reason => editor.setValue(prev => ({ ...prev, reason }));
  const [dayIndex, setDayIndex] = useState(0),
    [search, setSearch] = useState(""),
    [region, setRegion] = useState("All"),
    [showAll, setShowAll] = useState(false),
    [confirmRemove, setConfirmRemove] = useState(null),
    [error, setError] = useState("");
  const day = draft.days[dayIndex];
  // Monday-first workout ids; a workout removed from the programme becomes a rest day.
  const week = (draft.week || defaultWeek(draft)).map((id) => (draft.days.some((d) => d.id === id) ? id : null));
  const choices = useMemo(() => libraryWithCatalogue(data.library).filter((e) => (region === "All" || regionOf(e.group) === region) && matchesSearch(search, [e.name, e.equipment, groupLabel(e.group)])), [data.library, region, search]);
  function change(fn) {
    setError('');
    setDraft((prev) => {
      const d = structuredClone(prev);
      fn(d);
      return d;
    });
  }
  async function attach(event, dayId, exerciseId, image = false) {
    const input = event.currentTarget;
    const selected = input.files?.[0];
    if (!selected || uploadLock.current) return;
    uploadLock.current = true;
    setUploading(true);
    setError('');
    try {
      const target=draftKey.startsWith('client.')?{clientId:draftKey.slice(7)}:{scope:'workspace'};const file = await saveFile(selected, exerciseId ? { types: [image ? 'image/' : 'video/'], maxMB: image ? 10 : 30,...target } : { ...target });
      change(d => {
        const targetDay = d.days.find(item => item.id === dayId);
        const target = exerciseId ? targetDay?.exercises.find(item => item.id === exerciseId) : targetDay;
        if (target) target[exerciseId ? image ? 'imageFile' : 'videoFile' : 'coverFile'] = file;
      });
    } catch (error) { setError(error.message); }
    finally { uploadLock.current = false; setUploading(false); input.value = ''; }
  }
  return (
    <Modal title={t('Programme builder')} onClose={() => { if (!uploadLock.current) onClose(); }} wide>
      <Field
        label={t('Programme name')}
        value={draft.name}
        maxLength={70}
        onChange={(e) => change((d) => (d.name = e.target.value))}
      />
      <div className="form-grid">
        <Field
          label={t('Phase')}
          value={draft.phase}
          onChange={(e) => change((d) => (d.phase = e.target.value))}
        />
        <Field
          label={t('Weeks')}
          type="number"
          min="1"
          max="52"
          value={draft.weeks}
          onChange={(e) =>
            change(
              (d) =>
                (d.weeks = e.target.value),
            )
          }
        />
      </div>
      <Tabs
        items={draft.days.map((d, i) => [i, d.name])}
        value={dayIndex}
        onChange={setDayIndex}
      />
      <div className="button-row">
        <button
          className="text-link"
          onClick={() => {
            change((d) =>
              d.days.push({
                id: uid(),
                name: `Workout ${d.days.length + 1}`,
                cover: 0,
                minutes: 45,
                exercises: [],
              }),
            );
            setDayIndex(draft.days.length);
          }}
        >
          {t('+ Add workout')}
        </button>
        <button
          className="text-link"
          disabled={!day}
          onClick={() => {
            change((d) =>
              d.days.push({
                ...structuredClone(day),
                id: uid(),
                name: day.name + " copy",
                exercises: day.exercises.map((e) => ({ ...e, id: uid() })),
              }),
            );
            setDayIndex(draft.days.length);
          }}
        >
          {t('Duplicate workout')}
        </button>
        {/* Removing a workout also clears it from the week; nothing is saved until "Save programme". */}
        {day && draft.days.length > 1 && (confirmRemove === day.id
          ? <span className="template-delete-confirm"><span>{t('Remove “{name}” and its exercises?', { name: t(day.name) || t('this workout') })}</span>
              <button type="button" className="text-link red" onClick={() => {
                const id = day.id;
                change((d) => { d.days = d.days.filter((x) => x.id !== id); if (Array.isArray(d.week)) d.week = d.week.map((x) => (x === id ? null : x)); });
                setDayIndex(Math.max(0, Math.min(dayIndex, draft.days.length - 2)));
                setConfirmRemove(null);
                warningHaptic();
              }}>{t('Remove')}</button>
              <button type="button" className="text-link" onClick={() => setConfirmRemove(null)}>{t('Keep')}</button></span>
          : <button type="button" className="text-link red" onClick={() => setConfirmRemove(day.id)}>{t('Remove workout')}</button>)}
      </div>
      {!day && <p className="muted">{t('Add the first workout, then choose which days of the week it falls on.')}</p>}
      {day && <>
      <div className="card">
        <Field
          label={t('Workout name')}
          maxLength={70}
          value={day.name}
          onChange={(e) =>
            change((d) => (d.days[dayIndex].name = e.target.value))
          }
        />
        <div className="form-grid">
          <Field label={t('Cover')}>
            <select
              value={day.cover}
              onChange={(e) =>
                change((d) => {
                  d.days[dayIndex].cover = Number(e.target.value);
                  d.days[dayIndex].coverFile = null;
                })
              }
            >
              {BACKGROUNDS.map((n, i) => (
                <option value={i} key={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={t('Estimated minutes')}
            type="number"
            min="5"
            max="180"
            value={day.minutes}
            onChange={(e) =>
              change((d) => (d.days[dayIndex].minutes = Number(e.target.value)))
            }
          />
        </div>
        <label className="upload-inline">
          {t('Upload a workout cover')}
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => attach(e, day.id)}
          />
        </label>
        {day.coverFile && <p className="muted">{t(day.coverFile.name)}</p>}
      </div>
      {day.exercises.map((ex, i) => (
        <details className="card exercise-editor" key={ex.id}>
          <summary>
            <span className="exercise-number">{i + 1}</span>
            <span>
              <b>{t(ex.name)}</b>
              <small>{t('{sets} × {reps} · {weight} kg · {rest}s rest', { sets: ex.sets, reps: ex.reps, weight: ex.weight, rest: ex.rest })}</small>
            </span>
          </summary>
          <div className="form-grid">
            {[
              ["sets", "Sets", 1, 20],
              ["reps", "Reps", 1, 100],
              ["weight", "Load (kg)", 0, 1000],
              ["rest", "Rest (seconds)", 0, 600],
              ["rpe", "RPE", 1, 10],
              ["rir", "Reps in reserve", 0, 10],
            ].map(([key, label, min, max]) => (
              <Field
                key={key}
                label={label}
                type="number"
                min={min}
                max={max}
                step={key === "weight" ? 0.5 : 1}
                value={ex[key] ?? 0}
                onChange={(e) =>
                  change(
                    (d) =>
                      (d.days[dayIndex].exercises[i][key] = e.target.value),
                  )
                }
              />
            ))}
          </div>
          <Field
            label={t('Tempo')}
            value={ex.tempo}
            onChange={(e) =>
              change(
                (d) => (d.days[dayIndex].exercises[i].tempo = e.target.value),
              )
            }
          />
          <Field label={t('Coaching notes')}>
            <textarea
              value={ex.notes}
              onChange={(e) =>
                change(
                  (d) => (d.days[dayIndex].exercises[i].notes = e.target.value),
                )
              }
            />
          </Field>
          <label className="upload-inline">
            {t('Attach demonstration video')}
            <input
              type="file"
              accept="video/*"
              disabled={uploading}
              onChange={(e) => attach(e, day.id, ex.id)}
            />
          </label>
          {ex.videoFile && <div className="button-row"><p className="muted">{t(ex.videoFile.name)}</p><button className="text-link" onClick={() => change(d => delete d.days[dayIndex].exercises[i].videoFile)}>{t('Remove video')}</button></div>}
          <label className="upload-inline">{t('Attach exercise photo')}<input type="file" accept="image/*" disabled={uploading} onChange={e => attach(e, day.id, ex.id, true)}/></label>
          {ex.imageFile && <div className="button-row"><p className="muted">{t(ex.imageFile.name)}</p><button className="text-link" onClick={() => change(d => delete d.days[dayIndex].exercises[i].imageFile)}>{t('Remove photo')}</button></div>}
          <p className="muted">{t('Clients can open this photo or video from the exercise demonstration.')}</p>
          <div className="button-row">
            <button
              className="text-link"
              disabled={i === 0}
              onClick={() =>
                change((d) => {
                  const arr = d.days[dayIndex].exercises;
                  [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
                })
              }
            >
              {t('Move up')}
            </button>
            <button
              className="text-link"
              onClick={() =>
                change((d) => d.days[dayIndex].exercises.splice(i, 1))
              }
            >
              {t('Remove')}
            </button>
          </div>
        </details>
      ))}
      <label className="search">
        <Search size={17} />
        <input
          placeholder={t('Add an exercise…')}
          aria-label={t('Search exercise library')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setShowAll(false); }}
        />
      </label>
      <Tabs label={t('Muscle group')} items={['All', ...REGIONS.map((name) => [name, groupLabel(name)])]} value={region} onChange={(value) => { setRegion(value); setShowAll(false); }} />
      <p className="muted exercise-library-count">{t('{length} movements', { length: choices.length })}</p>
      <div className="exercise-library">
        {/* The first 24 load with the builder; search results and "Show all" list everything (DR-15). */}
        {(showAll || search.trim() ? choices : choices.slice(0, LIBRARY_PREVIEW)).map((ex) => (
            <button
              key={ex.id}
              onClick={() =>
                change((d) =>
                  d.days[dayIndex].exercises.push({ ...planExercise(ex), id: uid() }),
                )
              }
            >
              <span>{t(ex.name)}{ex.equipment && <small>{t(ex.equipment)}</small>}</span>
              <Plus size={14} />
            </button>
          ))}
        {!showAll && !search.trim() && choices.length > LIBRARY_PREVIEW && <button type="button" className="exercise-library-more" onClick={() => setShowAll(true)}>{t('Show all {count} exercises', { count: choices.length })}</button>}
      </div>
      <CustomExercise
        onAdded={(ex) =>
          change((d) => d.days[dayIndex].exercises.push({ ...ex, id: uid() }))
        }
      />
      </>}
      <section className="card programme-week" aria-label={t('Your week')}>
        <h3>{t('Your week')}</h3>
        <p className="muted">{t('Choose a workout or a rest day for each day. This week repeats for the length of the programme.')}</p>
        <div className="programme-week-days">
          {WEEKDAYS.map((name, i) => (
            <Field key={name} label={t(name)}>
              <select value={week[i] || 'rest'} disabled={!draft.days.length} onChange={(e) => change((d) => { d.week = week.slice(); d.week[i] = e.target.value === 'rest' ? null : e.target.value; })}>
                <option value="rest">{t('Rest day')}</option>
                {draft.days.map((w) => <option key={w.id} value={w.id}>{w.name.trim() ? t(w.name) : t('Untitled workout')}</option>)}
              </select>
            </Field>
          ))}
        </div>
      </section>
      <ReasonChips value={reason} onPick={setReason} />
      <Field label={t('Reason for change (saved to client timeline)')}>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <EditSaveBar draft={editor} label={uploading ? t('Saving attachment…') : t('Save programme')}
        disabled={uploading}
        onSave={async() => {
          if (uploadLock.current) return;
          const error = programError({ ...draft, week });
          if (error) { setError(error); return; }
          const result = structuredClone({ ...draft, week });
          result.name = result.name.trim();
          result.weeks = Number(result.weeks);
          for (const day of result.days) {
            day.name = day.name.trim();
            day.minutes = Number(day.minutes);
            for (const exercise of day.exercises) for (const key of ['sets', 'reps', 'weight', 'rest', 'rpe', 'rir']) exercise[key] = Number(exercise[key]);
          }
          setUploading(true);try{await onSave(result, reason.trim());editor.clear({ plan: result, reason: "" });}catch(e){setError(e.message);}finally{setUploading(false);}
        }}
      />
    </Modal>
  );
}

