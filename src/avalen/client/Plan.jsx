// A client's training tab: today's or a chosen day's workout, the exercises in
// it, the programme overview, and the daily habits tab beside it.
import { useState } from 'react';
import { ArrowRight, CalendarClock, ChevronRight, Clock3, Dumbbell, MessageCircle, TrendingUp } from 'lucide-react';
import { MotionDetails } from '../motion.jsx';
import { useApp } from '../context.js';
import { dayKey, offsetDay, scheduleDay, shortDate, sum, useFile } from '../store.js';
import { groupLabel } from '../exercise-catalogue.js';
import { ExerciseMedia, exerciseImage } from '../ExerciseMedia.jsx';
import { FormLab } from '../formlab-entry.jsx';
import { SmartSchedule } from '../ecosystem/scheduling.jsx';
import { Button, Calendar, Empty, Heading, Modal, Notice, SectionHead, Stat, Tabs } from '../ui.jsx';
import { locale, t } from '../i18n.js';
import { Habits } from './Habits.jsx';
import { hasProgram } from '../plan-week.js';
import { scheduleRules } from '../ecosystem/scheduling.js';
import { successHaptic, tickHaptic } from '../haptics.js';

export function Plan() {
  const { subtab, setSubtab, client } = useApp();
  const tab = ["Training", "Habits", "FormLab"].includes(subtab)
    ? subtab
    : "Training";
  return (
    <>
      <Heading title={t('Your plan.')} />
      <Tabs
        items={["Training", "Habits", "FormLab"]}
        value={tab}
        onChange={setSubtab}
      />
      {tab === "Training" ? (
        <Training />
      ) : tab==='FormLab'?<FormLab client={client}/>: (
        <Habits />
      )}
    </>
  );
}

function Training() {
  const { data, client, openWorkout, openShare, ask, viewSession, viewDate, setViewDate, openExercise } = useApp();
  const date = viewDate || dayKey(), setDate = setViewDate;
  const day = scheduleDay(client, date);
  const draft = data.drafts[client.id];
  const [detail, setDetail] = useState(null);
  const done = data.sessions.find(
    (s) => s.clientId === client.id && s.date === date,
  );
  return (
    <>
      <Calendar
        selected={date}
        onChange={setDate}
        client={client}
        sessions={data.sessions}
      />
      {day ? (
        <>
          <SectionHead
            title={day.name}
            action={
              <span className="muted">{t('{length} exercises', { length: day.exercises.length })}</span>
            }
          />
          <div className="training-start-action">
            {done || date === dayKey() ? <Button
              aria-label={draft && date === dayKey() ? t('Resume workout: {title}', { title: draft.title }) : undefined}
              onClick={() => (done ? openShare(done) : openWorkout(day, date))}
            >
              {done ? t('View workout result') : draft ? t('Resume workout') : t('Start Workout')}
              <ArrowRight size={16} />
            </Button> : <Reschedule day={day} date={date} onDate={setDate} />}
            {!done && date === dayKey() && !draft && <Reschedule day={day} date={date} onDate={setDate} moveOnly />}
          </div>
          <button className="training-detail-link" onClick={() => viewSession(day,date)}><span>{t('View session details')}</span><ArrowRight size={17}/></button>
          <div className="card list training-exercise-list">
            {day.exercises.map((e, i) => (
              <button
                className="exercise-row"
                key={e.id}
                onClick={() => setDetail(e)}
              >
                <span className="exercise-photo-number"><ExerciseThumbnail exercise={e}/><i>{String(i + 1).padStart(2,'0')}</i></span>
                <span className="exercise-row-copy">
                  <span className="exercise-group">{e.group ? groupLabel(e.group) : t('Training')}{e.videoFile && <span className="coach-demo-label"> {t('· Coach video')}</span>}</span>
                  <b>{t(e.name)}</b>
                  <small className="exercise-prescription"><strong>{e.sets} × {e.reps} {e.kind === 'Duration' ? 'sec' : 'reps'}</strong><span><Clock3 size={11}/>{e.rest}{t('s rest')}</span></small>
                </span>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>

        </>
      ) : (
        <>
        <Empty
          icon={Dumbbell}
          title={hasProgram(client) ? t('A planned rest day') : t('Your coach is preparing your plan.')}
          detail={hasProgram(client) ? t('Recovery is part of the programme. Your habits are still here for you.') : t('Your workouts appear here as soon as your coach sets them.')}
        />
        {hasProgram(client) && date === dayKey() && <NextUp onDate={setDate} />}
        </>
      )}
      {hasProgram(client) && <MotionDetails className="programme-overview"><summary><span>{t('About your programme')}<small>{t(client.program.name)} · {client.program.phase}</small></span><ChevronRight size={18}/></summary>
      <div className="card program-title">
        <span className="eyebrow">{client.program.phase}</span>
        <h2>{t(client.program.name)}</h2>
        <p>
          {client.program.weeks}{t('-week programme · through')}{" "}
          {shortDate(client.programEnd)}
        </p>
        {client.program.progression && <p className="program-progression"><TrendingUp size={15}/>{client.program.progression}</p>}
        {client.travel &&
          date >= client.travel.start &&
          date <= client.travel.end && (
            <Notice>
              {t('Travel plan active. Your regular plan resumes')}{" "}
              {shortDate(offsetDay(1, client.travel.end))}.
            </Notice>
          )}
      </div>
      </MotionDetails>}
      <SmartSchedule client={client}/>
      {detail && (
        <Modal title={detail.name} onClose={() => setDetail(null)}>
          <ExerciseMedia exercise={detail}/>
          <FormLab client={client} exercise={detail} compact/>
          <p className="exercise-coach-cue"><span>{t('COACH’S CUE')}</span>{detail.notes || t('Ask your coach for technique guidance.')}</p>
          <div className="three-stats">
            <Stat
              label={detail.kind === 'Duration' ? t('Sets × seconds') : t('Sets × reps')}
              value={`${detail.sets} × ${detail.reps}`}
            />
            <Stat label={t('Tempo')} value={detail.tempo || "—"} />
            <Stat label={t('Reps in reserve')} value={detail.rir ?? "—"} />
          </div>
          <div className="exercise-sheet-actions">
            <Button
              onClick={() => {
                const name = detail.name;
                setDetail(null);
                openExercise(name);
              }}
            >
              {t('Progress & history')} <ArrowRight size={16} />
            </Button>
            <Button
              secondary
              onClick={() => {
                setDetail(null);
                ask(`${detail.name} · ${day.name}`);
              }}
            >
              {t('Ask coach')} <MessageCircle size={16} />
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}


// ---- Flexible scheduling ----
// Clients can do a planned workout today, swap two days or move a workout to any free
// day, without waiting for the original date. Only the date changes: the coach's
// exercises, sets, reps and notes stay exactly as prescribed. A coach who turns on
// "All changes require coach approval" gets a request instead.
const HORIZON = 21;
function useReschedule() {
  const { data, client, runAction, notify, openWorkout } = useApp();
  const today = dayKey();
  const rules = scheduleRules(client);
  const selfServe = rules.independent && !rules.requireApproval;
  const completed = new Set(data.sessions.filter((s) => s.clientId === client.id).map((s) => s.date));
  const draft = data.drafts[client.id];
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function run(from, to, { start, day, onDate } = {}) {
    if (busy) return;
    const mode = scheduleDay(client, to) && !completed.has(to) ? 'swap' : 'move';
    setBusy(true); setError('');
    try {
      await runAction('schedule.propose', client.id, { mode, from, to, confirm: true });
      if (!selfServe) { notify(t('Sent to your coach for approval')); return true; }
      successHaptic();
      notify(mode === 'swap' ? t('Workouts swapped. Your coach’s plan stays the same.') : t('Workout moved to {date}.', { date: shortDate(to) }));
      onDate?.(to);
      if (start && to === today) await openWorkout(day, to);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally { setBusy(false); }
  }
  return { today, completed, draft, busy, error, run, selfServe };
}

function Reschedule({ day, date, onDate, moveOnly = false }) {
  const { today, completed, draft, busy, error, run, selfServe } = useReschedule();
  const { client } = useApp();
  const [moving, setMoving] = useState(false);
  const trainedToday = completed.has(today);
  const todayPlanned = scheduleDay(client, today) && !trainedToday;
  // Today works when nothing is logged today; a missed workout can't swap into the past.
  const canDoToday = !moveOnly && !trainedToday && !draft && (date > today || !todayPlanned);
  return <div className="reschedule-actions">
    {canDoToday && <Button disabled={busy} onClick={() => run(date, today, { start: selfServe, day, onDate })}>
      {busy ? t('Saving…') : date < today ? t('Do this workout today') : t('Do it today')} <ArrowRight size={16} />
    </Button>}
    {!moveOnly && !canDoToday && <p className="reschedule-note muted">{draft ? t('Finish or pause your current workout before moving another.') : trainedToday ? t('You’ve trained today. Move this workout to another day.') : t('Today already has a workout. Move this one to another day.')}</p>}
    <button type="button" className="reschedule-link" disabled={busy} onClick={() => { tickHaptic(); setMoving(true); }}><CalendarClock size={16} aria-hidden="true"/>{date < today ? t('Reschedule missed workout') : t('Move to another day')}</button>
    {error && !moving && <p className="error" role="alert">{error}</p>}
    {moving && <MoveSheet day={day} from={date} onClose={() => setMoving(false)} onDate={onDate} />}
  </div>;
}

function MoveSheet({ day, from, onClose, onDate }) {
  const { client, data } = useApp();
  const { today, completed, busy, error, run, selfServe } = useReschedule();
  const [to, setTo] = useState('');
  const days = Array.from({ length: HORIZON }, (_, i) => offsetDay(i)).filter((d) => d !== from);
  const target = to && scheduleDay(client, to);
  const label = (d) => new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' });
  return <Modal title={t('Move {name}', { name: t(day.name) })} onClose={onClose} canClose={!busy} className="move-sheet">
    <p className="muted">{t('Pick a new day. Your coach’s exercises, sets and reps stay exactly the same.')}</p>
    <div className="move-days" role="radiogroup" aria-label={t('New day')}>
      {days.map((d) => {
        const planned = scheduleDay(client, d), isDone = completed.has(d);
        return <button key={d} type="button" role="radio" aria-checked={to === d} disabled={isDone || busy}
          className={`move-day ${to === d ? 'is-selected' : ''} ${planned ? 'has-workout' : ''}`}
          onClick={() => { tickHaptic(); setTo(d); }}>
          <b>{d === today ? t('Today') : label(d)}</b>
          <small>{isDone ? t('Workout logged') : planned ? t('Swap with {name}', { name: t(planned.name) }) : t('Free')}</small>
        </button>;
      })}
    </div>
    {error && <p className="error" role="alert">{error}</p>}
    <div className="exercise-sheet-actions">
      <Button disabled={!to || busy} onClick={async () => { if (await run(from, to, { onDate })) onClose(); }}>
        {busy ? t('Saving…') : !selfServe ? t('Request coach approval') : target ? t('Swap workouts') : t('Move workout')}
      </Button>
      <Button secondary disabled={busy} onClick={onClose}>{t('Cancel')}</Button>
    </div>
  </Modal>;
}

// On a rest day, the next planned workout, ready to do today.
function NextUp({ onDate }) {
  const { client, data } = useApp();
  const { today, completed, draft, busy, error, run, selfServe } = useReschedule();
  const next = [...client.schedule].sort((a, b) => a.date.localeCompare(b.date)).find((s) => s.date > today && !completed.has(s.date));
  const day = next && scheduleDay(client, next.date);
  if (!day || completed.has(today) || draft) return null;
  return <section className="next-up" aria-label={t('Next workout')}>
    <span className="eyebrow">{t('NEXT UP · {date}', { date: shortDate(next.date) })}</span>
    <h3>{t(day.name)}</h3>
    <p className="muted">{t('{length} exercises', { length: day.exercises.length })}</p>
    <div className="next-up-actions">
      <Button disabled={busy} onClick={() => run(next.date, today, { start: selfServe, day, onDate })}>{busy ? t('Saving…') : t('Do it today')} <ArrowRight size={16} /></Button>
      <button type="button" className="text-link" onClick={() => onDate(next.date)}>{t('View workout')}</button>
    </div>
    {error && <p className="error" role="alert">{error}</p>}
  </section>;
}

export function ExerciseThumbnail({ exercise }) {
  const url = useFile(exercise.imageFile?.id);
  return <img className="exercise-thumb" src={url || exerciseImage(exercise)} alt={t('{name} exercise', { name: exercise.name })} loading="lazy" decoding="async"/>;
}

