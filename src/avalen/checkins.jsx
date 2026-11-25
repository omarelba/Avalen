import { VoiceRecording,AudioPlayer } from './ecosystem/recording.jsx';
import { checkinSummary } from './ecosystem/checkin-service.js';
import { zonedDay, clientTimezone } from './ecosystem/time.js';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Plus, Settings, Trash2, Upload } from 'lucide-react';
import { useApp } from './context.js';
import { offsetDay, shortDate, uid, decision, saveFile } from './store.js';
import { Button, Empty, Field, LineChart, Media, Modal, Notice, SectionHead, Tabs } from './ui.jsx';
import { useEditDraft, EditSaveBar } from './edit-draft.jsx';
import { answerFor, hasAnswer, checkinPlanFor, checkinSchedule, checkinPlanError, checkinError, schemaFor, saveCheckin, checkinTrend, trendFields } from './checkin-model.js';

import { t } from './i18n.js';
import { lightHaptic, successHaptic, tickHaptic } from './haptics.js';
import { WheelPicker } from './WheelPicker.jsx';
function CheckinSettings({ client, onClose }) {
  const { update, notify, data } = useApp();
  const editor = useEditDraft(`checkin-plan.${client.id}`, checkinPlanFor(client));
  const plan = editor.value;
  const [error, setError] = useState('');
  const change = (id,patch) => editor.setValue(p=>({...p,fields:p.fields.map(f=>f.id===id?{...f,...patch}:f)}));
  const next = checkinSchedule({...client,checkinPlan:plan},data.checkins);
  async function submit(e) {
    e.preventDefault(); const issue=checkinPlanError(plan); if(issue){setError(issue);return;}
    const saved={...structuredClone(plan),intervalDays:Number(plan.intervalDays)};
    const result=await update(d=>{ d.clients.find(c=>c.id===client.id).checkinPlan=saved; decision(d,client.id,'Check-in plan updated',`Every ${saved.intervalDays} days · ${saved.fields.filter(f=>f.enabled).length} fields requested.`); });
    if(result?.error){setError(result.error);return;}
    editor.clear(saved); notify?.(t('Check-in plan saved')); onClose();
  }
  return <Modal title={t('{value}’s check-in settings', { value: client.name.split(' ')[0] })} onClose={onClose} wide className="checkin-settings">
    <form onSubmit={submit}>
      <p className="muted">{t('Choose what this client reports and how often. Past check-ins keep their original questions and answers.')}</p>
      <div className="form-grid"><Field label={t('Repeat every (days)')} type="number" required min="1" max="365" step="1" value={plan.intervalDays} onChange={e=>editor.setValue(p=>({...p,intervalDays:e.target.value,scheduleMode:Number(e.target.value)===7?p.scheduleMode:'rolling'}))}/><Field label={t('First check-in date')} type="date" required value={plan.startDate} onChange={e=>editor.setValue(p=>({...p,startDate:e.target.value}))}/></div>
      {Number.isInteger(Number(plan.intervalDays)) && Number(plan.intervalDays)>0 && <div className="checkin-next-preview"><CalendarDays size={18}/><span>{t('Next check-in:')} <b>{shortDate(next.dueDate)}</b> {t('· then every')} {plan.intervalDays} {t('days')} {plan.scheduleMode==='weekly'?t('on the chosen weekday.'):t('after a submission.')}</span></div>}
      {Number(plan.intervalDays)===7 && <div className="form-grid"><Field label={t('Weekly scheduling')}><select value={plan.scheduleMode || 'rolling'} onChange={e=>editor.setValue(p=>({...p,scheduleMode:e.target.value,preferredWeekday:p.preferredWeekday ?? 1}))}><option value="rolling">{t('Every 7 days after submission')}</option><option value="weekly">{t('Fixed weekly day')}</option></select></Field>{plan.scheduleMode==='weekly'&&<Field label={t('Preferred check-in day')}><select value={plan.preferredWeekday ?? 1} onChange={e=>editor.setValue(p=>({...p,preferredWeekday:Number(e.target.value)}))}>{['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((d,i)=><option key={d} value={i}>{d}</option>)}</select></Field>}</div>}<div className="form-grid"><Field label={t('Client timezone')} value={plan.timezone || ''} placeholder={clientTimezone({ ...client, checkinPlan: null })} onChange={e=>editor.setValue(p=>({...p,timezone:e.target.value}))}/><Field label={t('Local reminder time')} type="time" value={plan.reminderTime || '18:00'} onChange={e=>editor.setValue(p=>({...p,reminderTime:e.target.value}))}/></div><label className="checkbox-row"><input type="checkbox" checked={plan.reminders!==false} onChange={e=>editor.setValue(p=>({...p,reminders:e.target.checked}))}/>{t('In-app reminders when due')}</label><p className="fine-print muted">{t('For weekly check-ins, choose the preferred weekday using the first check-in date. Every {intervalDays} days remains your cadence. External push and email need a delivery service.', { intervalDays: plan.intervalDays })}</p><SectionHead title={t('What to include')}/>
      <div className="checkin-field-settings">{plan.fields.map(f=><div className={`checkin-field-setting ${f.enabled?'enabled':''}`} key={f.id}>
        <div className="checkin-field-toggle"><label><input type="checkbox" checked={f.enabled} onChange={e=>change(f.id,{enabled:e.target.checked})}/><span>{f.label || t('New question')}<small>{f.type==='number'?t('Number{value}', { value: f.unit?` · ${f.unit}`:'' }):f.type==='rating'?t('Rating · 1–5'):f.type==='photos'?t('Photos'):t('Written answer')}</small></span></label><label className="checkin-required"><input type="checkbox" disabled={!f.enabled} checked={Boolean(f.required)} onChange={e=>change(f.id,{required:e.target.checked})} aria-label={t('Require {value}', { value: f.label || 'new question' })}/>{t('Required')}</label></div>
        {f.enabled && <details open={!f.builtin || undefined}><summary>{t('Edit question')}</summary><Field label={t('Label for {value}', { value: f.label || 'new question' })} required maxLength={100} value={f.label} onChange={e=>change(f.id,{label:e.target.value})}/>{!f.builtin && f.type==='number' && <div className="form-grid"><Field label={t('Unit for {value}', { value: f.label || 'new question' })} maxLength={20} value={f.unit || ''} placeholder={t('e.g. minutes')} onChange={e=>change(f.id,{unit:e.target.value})}/><Field label={t('Minimum for {value}', { value: f.label || 'new question' })} type="number" step="any" required value={f.min} onChange={e=>change(f.id,{min:e.target.value})}/><Field label={t('Maximum for {value}', { value: f.label || 'new question' })} type="number" step="any" required value={f.max} onChange={e=>change(f.id,{max:e.target.value})}/></div>}{!f.builtin && <button type="button" className="text-link red" onClick={()=>editor.setValue(p=>({...p,fields:p.fields.filter(x=>x.id!==f.id)}))}><Trash2 size={14}/>{t('Remove question')}</button>}</details>}
      </div>)}</div>
      <div className="checkin-add-question"><span>{t('Add a custom question')}</span>{[['number','Number'],['rating','Rating'],['text','Text']].map(([type,label])=><Button secondary small key={type} onClick={()=>editor.setValue(p=>({...p,fields:[...p.fields,{id:uid(),label:'',type,unit:type==='rating'?'/ 5':'',min:type==='rating'?1:0,max:type==='rating'?5:100000,enabled:true,required:false}]}))}><Plus size={15}/>{label}</Button>)}</div>
      {error && <p role="alert" className="error">{error}</p>}
      <EditSaveBar draft={editor} label={t('Save check-in plan')}/>
    </form>
  </Modal>;
}

function CheckinTrends({ client, rows }) {
  const { data } = useApp();
  const fields=trendFields(client,rows).filter(f=>f.enabled || checkinTrend(data,client.id,f).length);
  const [metric,setMetric]=useState('weight|number|kg'),[period,setPeriod]=useState('90 days');
  const field=fields.find(f=>f.seriesKey===metric) || fields[0];
  if(!field)return null;
  const all=checkinTrend(data,client.id,field);
  const points=all.filter(p=>period==='All time' || p.date>=offsetDay(period==='30 days'?-29:-89));
  const delta=points.length>1?Math.round((points.at(-1).value-points[0].value)*10)/10:null;
  return <section className="card checkin-trends" aria-label={t('Check-in trends')}>
    <SectionHead title={t('Trends over time')}/>
    <div className="checkin-trend-controls"><Field label={t('Trend metric')}><select value={field.seriesKey} onChange={e=>setMetric(e.target.value)}>{fields.map(f=><option key={f.seriesKey} value={f.seriesKey}>{t(f.label)}{f.unit?` (${f.unit})`:''}</option>)}</select></Field><Tabs items={['30 days','90 days','All time']} value={period} onChange={setPeriod} label={t('Trend period')}/></div>
    {points.length?<><div className="checkin-trend-stats"><span><small>{t('Latest')}</small><b>{points.at(-1).value.toLocaleString()} <em>{field.unit}</em></b></span><span><small>{t('Change in this period')}</small><b>{delta===null?'—':`${delta>0?'+':''}${delta}`} <em>{delta===null?'':field.unit}</em></b></span><span><small>{t('Entries')}</small><b>{points.length}</b></span></div><LineChart key={field.seriesKey} records={points} field="value" label={field.label} unit={field.unit || ''} timeScale domain={field.type==='rating'?[1,5]:undefined}/>{points.length===1 && <p className="fine-print muted">{t('One entry so far. A trend will appear after the next recorded value.')}</p>}<details className="checkin-values"><summary>{t('View recorded values')}</summary><table><thead><tr><th>{t('Date')}</th><th>{t(field.label)}</th><th>{t('Source')}</th></tr></thead><tbody>{[...points].reverse().map(p=><tr key={p.date}><td>{shortDate(p.date)}</td><td>{p.value} {field.unit}</td><td>{p.source}</td></tr>)}</tbody></table></details></>:<Empty title={t('No {value} entries yet', { value: field.label.toLowerCase() })} detail={t('Submitted values will appear here over time. Missing answers are never plotted as zero.')}/>}
    <p className="fine-print muted">{field.measurementKey?t('Includes check-ins and existing measurement logs. A check-in takes precedence for the same date.'):t('Based on submitted check-in answers.')} {t('Dates are spaced by elapsed time.')}</p>
  </section>;
}

// The client's check-in, one question at a time: measurements on a scroll wheel (typed
// values work too), ratings as large options, then their update and Send. The questions,
// answers and saving are the coach's check-in plan as before; only the way through changed.
const NUMBER_REST = { weight: 75, waist: 85, bodyFat: 20, chest: 100, hips: 100, sleepHours: 7 };
function CheckinForm({ row, client, onClose, onSent }) {
  const { data,update,notify,runAction }=useApp();
  const editor=useEditDraft(`checkin-entry.${client.id}.${row.date}.${row.submittedAt || 'new'}.${JSON.stringify(row.schema)}`, row);
  const form=editor.value, setForm=editor.setValue;
  const [error,setError]=useState(''),[uploading,setUploading]=useState(false),[voiceBusy,setVoiceBusy]=useState(false);
  const [index,setIndex]=useState(0),[direction,setDirection]=useState(1);
  const lock=useRef(false),submitted=useRef(false),advance=useRef(null);
  const mergedNote=form.schema.find(f=>f.id==='note' && f.builtin && f.label==='Anything else for your coach?');
  const setAnswer=(id,value)=>setForm(f=>({...f,answers:{...f.answers,[id]:value}}));
  // Photos are always optional. When the coach hasn't asked for them, they sit with the update.
  const photoField=form.schema.find(f=>f.type==='photos'), extraPhotos=photoField?[]:(form.answers.photos || []);
  const fields=form.schema.filter(f=>!mergedNote || f.id!==mergedNote.id).sort((a,b)=>Number(b.required)-Number(a.required) || Number(b.type==='number')-Number(a.type==='number'));
  const steps=[...fields.map(field=>({ key:field.id, field })), { key:'update' }];
  const step=steps[Math.min(index,steps.length-1)], last=index>=steps.length-1;
  const stepIssue=step.field?checkinError([step.field],form.answers):'';
  const answered=step.field?hasAnswer(form.answers[step.field.id]):true;
  useEffect(()=>()=>clearTimeout(advance.current),[]);
  function go(next){ clearTimeout(advance.current); setError(''); setDirection(next>index?1:-1); setIndex(Math.max(0,Math.min(steps.length-1,next))); }
  function proceed(){ if(stepIssue){setError(stepIssue);return;} lightHaptic(); go(index+1); }
  async function upload(e,field) {
    const input=e.currentTarget,files=[...input.files || []];if(!files.length || lock.current)return;
    if(files.length+(form.answers[field.id]?.length || 0)>4){setError(t('Choose up to four progress photos.'));input.value='';return;}
    lock.current=true;setUploading(true);setError('');
    try{const photos=[];for(const file of files)photos.push(await saveFile(file,{clientId:client.id}));setForm(f=>({...f,answers:{...f.answers,[field.id]:[...(f.answers[field.id] || []),...photos]}}));}catch(e){setError(e.message);}finally{lock.current=false;setUploading(false);input.value='';}
  }
  async function send(e) {
    e.preventDefault();if(!last){proceed();return;}if(lock.current || submitted.current)return;if(voiceBusy){setError(t('Finish saving your recording before sending.'));return;}
    const issue=checkinError(form.schema,form.answers);if(issue){setError(issue);const at=steps.findIndex(s=>s.field && checkinError([s.field],form.answers));if(at>=0)go(at);return;}
    submitted.current=true;setUploading(true);setError('');
    try{await runAction('checkin.submit',client.id,{...form,transcript:form.audio?.transcript ?? form.transcript});editor.clear(row);successHaptic();onSent?.();onClose();}catch(e){submitted.current=false;setError(e.message);}finally{setUploading(false);}
  }
  const f=step.field, value=f?(form.answers[f.id] ?? ''):'';
  const previous=f && data.checkins.filter(r=>r.clientId===client.id && r.date<form.date).sort((a,b)=>b.date.localeCompare(a.date)).map(r=>answerFor(r,f)).find(hasAnswer);
  const label=f?`${t(f.label)}${f.unit?` (${t(f.unit)})`:''}`:'';
  return <Modal title={t('Your check-in')} className="checkin-form checkin-flow" canClose={!uploading && !voiceBusy} onClose={onClose}>
    <form onSubmit={send}><fieldset className="checkin-answers" aria-label={t('Check-in answers')} disabled={uploading}>
      <div className="checkin-flow-top">
        <div className="checkin-flow-progress" role="progressbar" aria-label={t('Check-in progress')} aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={index+1}><span style={{transform:`scaleX(${(index+1)/steps.length})`}}/></div>
        <div className="checkin-flow-nav">
          <button type="button" className="checkin-back" disabled={index===0} onClick={()=>go(index-1)}><ArrowLeft size={16} aria-hidden="true"/>{t('Back')}</button>
          <small>{t('{value} of {total}', { value: index+1, total: steps.length })}</small>
          {f && !f.required && !last ? <button type="button" className="checkin-skip" onClick={()=>go(index+1)}>{answered?t('Next'):t('Skip')}</button> : <span className="checkin-skip-space"/>}
        </div>
      </div>
      <div className="checkin-step" key={step.key} data-direction={direction>0?'forward':'back'}>
        {f ? <>
          <span className="eyebrow">{f.required?t('REQUIRED'):t('OPTIONAL')}</span>
          {f.type==='number'?<NumberStep field={f} label={label} value={value} previous={previous} onChange={v=>{setError('');setAnswer(f.id,v);}}/>
          :f.type==='rating'?<div className="score-field checkin-rating"><h2 id={`q-${f.id}`}>{t(f.label)}</h2><p className="muted">{['Hunger','Stress'].includes(f.legacyKey)?t('1 = low · 5 = high'):t('1 = low / difficult · 5 = high / great')}</p><div role="group" aria-labelledby={`q-${f.id}`}>{[1,2,3,4,5].map(n=><button type="button" key={n} aria-label={`${t(f.label)}: ${n}`} aria-pressed={Number(value)===n} onClick={()=>{const next=Number(value)===n?'':n;setAnswer(f.id,next);tickHaptic();setError('');if(next!=='' && !last){clearTimeout(advance.current);advance.current=setTimeout(()=>go(index+1),360);}}}><b>{n}</b></button>)}</div>{hasAnswer(previous) && <small className="checkin-previous">{t('Previous check-in: {previous} {unit}', { previous, unit: f.unit })}</small>}</div>
          :f.type==='text'?<><h2 className="checkin-question">{t(f.label)}</h2><Field label={t(f.label)}><textarea required={Boolean(f.required)} maxLength={2000} value={value} placeholder={t('Type your answer')} onChange={e=>setAnswer(f.id,e.target.value)}/></Field></>
          :<><h2 className="checkin-question">{t(f.label)}</h2><label className="upload-zone"><Upload size={20}/><b>{t('Choose photos')}</b><small>{t('Up to 4 photos')}</small><input type="file" accept="image/*" multiple disabled={uploading} aria-label={f.label} onChange={e=>upload(e,f)}/></label><div className="checkin-photos">{(value || []).map(photo=><div key={photo.id}><Media fileId={photo.id} alt={t('Check-in progress photo')}/><button type="button" aria-label={t('Remove {name}', { name: photo.name })} onClick={()=>setAnswer(f.id,value.filter(p=>p.id!==photo.id))}><Trash2 size={15}/></button></div>)}</div></>}
        </> : <div className="checkin-reflection"><span className="eyebrow">{t('LAST STEP')}</span><h2 className="checkin-question">{t('Your update')}</h2>
          <Field label={mergedNote?.required?t('Your update (required)'):t('Your update (optional)')}><textarea required={Boolean(mergedNote?.required)} value={form.updateText || (mergedNote?form.answers.note:'') || ''} maxLength={2000} placeholder={t('How are you feeling? What should your coach know?')} onChange={e=>setForm(f=>({...f,updateText:e.target.value,answers:mergedNote?{...f.answers,note:e.target.value}:f.answers}))}/></Field>
          <details className="checkin-voice-disclosure" open={Boolean(form.audio) || undefined}><summary>{t('Add a voice update')}<span>{t('Optional · up to 60 seconds')}</span></summary><VoiceRecording value={form.audio} onBusyChange={setVoiceBusy} clientId={client.id} onChange={audio=>setForm(f=>({...f,audio}))}/></details>
          {!photoField && <details className="checkin-voice-disclosure checkin-photo-disclosure" open={extraPhotos.length>0 || undefined}><summary>{t('Add progress photos')}<span>{t('Optional · up to 4 photos')}</span></summary><label className="upload-zone"><Upload size={20}/><b>{t('Choose photos')}</b><small>{t('Private to you and your coach')}</small><input type="file" accept="image/*" multiple disabled={uploading} aria-label={t('Add progress photos')} onChange={e=>upload(e,{id:'photos'})}/></label>{extraPhotos.length>0 && <div className="checkin-photos">{extraPhotos.map(photo=><div key={photo.id}><Media fileId={photo.id} alt={t('Check-in progress photo')}/><button type="button" aria-label={t('Remove {name}', { name: photo.name })} onClick={()=>setAnswer('photos',extraPhotos.filter(p=>p.id!==photo.id))}><Trash2 size={15}/></button></div>)}</div>}</details>}
          <p className="fine-print muted">{t('Every')} {client.checkinPlan?.intervalDays || 7} {t('days · set by your coach.')}{editor.dirty ? ` ${t('Draft saved on this device')}` : ''}</p>
        </div>}
      </div>
      {editor.error && <p role="alert" className="error">{editor.error}</p>}
      {error && <p role="alert" className="error">{error}</p>}
      <div className="checkin-submit">{last
        ? <Button type="submit" disabled={uploading || voiceBusy}>{uploading ? submitted.current ? t('Sending check-in…') : t('Saving photos…') : t('Send check-in')}<ArrowRight size={16}/></Button>
        : <Button type="submit" disabled={uploading || (f?.required && !answered)}>{t('Continue')}<ArrowRight size={16}/></Button>}</div>
    </fieldset></form>
  </Modal>;
}

// A measurement: the number itself (tap to type) above a scroll wheel with tenths.
function NumberStep({ field, label, value, previous, onChange }) {
  const min=Number(field.min ?? 0), max=Number(field.max ?? 100000);
  const wheel=max-min<=1000;
  const rest=hasAnswer(previous)?Number(previous):NUMBER_REST[field.id] ?? Math.round((min+max)/2);
  return <div className="checkin-number">
    <label className="checkin-number-value"><span className="sr-only">{label}</span><span className="checkin-question" aria-hidden="true">{t(field.label)}</span>
      <span className="checkin-number-entry"><input aria-label={label} type="number" inputMode="decimal" min={min} max={max} step="any" required={Boolean(field.required)} value={value} placeholder={hasAnswer(previous)?String(previous):'—'} onFocus={e=>e.target.select()} onChange={e=>onChange(e.target.value)}/>{field.unit && <em>{t(field.unit)}</em>}</span>
    </label>
    {wheel && <WheelPicker min={min} max={max} value={value===''?'':Number(value)} center={rest} unit={field.unit ? t(field.unit) : ''} label={t(field.label)} onChange={v=>onChange(String(v))}/>}
    <div className="checkin-number-hints">
      {hasAnswer(previous) && <button type="button" className="checkin-same" onClick={()=>{tickHaptic();onChange(String(previous));}}>{t('Same as last time · {previous} {unit}', { previous, unit: field.unit || '' })}</button>}
      {!hasAnswer(previous) && <small className="muted">{wheel?t('Scroll the wheel or tap the number to type.'):t('Tap the number to type your reading.')}</small>}
    </div>
  </div>;
}

// Shown once the check-in is saved: a short, clear confirmation.
function CheckinSent({ onDone }) {
  const ref=useRef(null);
  useEffect(()=>{ ref.current?.focus(); const timer=setTimeout(onDone,4200); return ()=>clearTimeout(timer); },[]);
  return <div className="checkin-sent" role="status" aria-live="polite">
    <div className="checkin-sent-card">
      <svg className="summary-mark" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28" pathLength="1"/><path pathLength="1" d="M21 33.5l7.5 7.5L44 25"/></svg>
      <h2>{t('Check-in sent')}</h2>
      <p>{t('Your coach will review it and reply here.')}</p>
      <Button ref={ref} onClick={onDone}>{t('Done')}</Button>
    </div>
  </div>;
}

export function Checkins({ clientId, coach=false }) {
  const { data,update,notify,runAction }=useApp();
  const client=data.clients.find(c=>c.id===clientId);
  const rows=data.checkins.filter(c=>c.clientId===clientId).sort((a,b)=>b.date.localeCompare(a.date));
  const [form,setForm]=useState(null),[sent,setSent]=useState(false),[selectedId,setSelectedId]=useState(null),[response,setResponse]=useState(''),[settings,setSettings]=useState(false),[reviewAudio,setReviewAudio]=useState(null),[reviewError,setReviewError]=useState(''),[reviewBusy,setReviewBusy]=useState(false),[reviewVoiceBusy,setReviewVoiceBusy]=useState(false),[followUp,setFollowUp]=useState(false),[filter,setFilter]=useState('All');
  const plan=checkinPlanFor(client),schedule=checkinSchedule(client,rows),today=rows.find(r=>r.date===zonedDay(clientTimezone(client)));
  const selected=rows.find(r=>r.id===selectedId);
  function start() {
    const schema=today?.schema || plan.fields.filter(f=>f.enabled).map(f=>structuredClone(f));
    setForm({...today,id:today?.id || uid(),clientId,date:zonedDay(clientTimezone(client)),schema,answers:Object.fromEntries(schema.map(f=>[f.id,today?answerFor(today,f):f.type==='photos'?[]:''])),reviewed:false,response:today?.response || ''});
  }
  return <div className="checkins-workspace">
    <SectionHead title={coach?t('Check-in review'):t('Your check-ins')} action={coach?<Button secondary small onClick={()=>setSettings(true)}><Settings size={16}/>{t('Check-in settings')}</Button>:<Button small onClick={start}>{today?t('Edit today’s check-in'):t('Start check-in')}<Plus size={15}/></Button>}/>
    <div className={`checkin-schedule ${schedule.overdue?'overdue':''}`}><CalendarDays size={22}/><span><b>{today?t('Today’s check-in submitted'):schedule.daysUntil===0?t('Check-in due today'):schedule.overdue?t('Check-in {count} days overdue', { count: Math.abs(schedule.daysUntil) }):t('Next check-in · {shortDate}', { shortDate: shortDate(schedule.dueDate) })}</b><small>{t('Every')} {schedule.intervalDays} {schedule.intervalDays===1?'day':'days'} · {plan.fields.filter(f=>f.enabled).length} {t('fields requested')}{today?t(' · next {shortDate}', { shortDate: shortDate(schedule.dueDate) }):''}</small></span></div>
    <CheckinTrends client={client} rows={rows}/>
    <SectionHead title={t('Check-in history')}/>
    <Field label={t('Check-in status')}><select value={filter} onChange={e=>setFilter(e.target.value)}>{['All','Pending review','Reviewed','Follow-up'].map(f=><option key={f}>{f}</option>)}</select></Field>
    {rows.filter(r=>filter==='All' || filter==='Pending review'&&!r.reviewed || filter==='Reviewed'&&r.reviewed || filter==='Follow-up'&&r.followUp).map(r=><button className="card checkin-summary" key={r.id} onClick={()=>{setSelectedId(r.id);setResponse(r.response || '');setReviewAudio(r.responseAudio || null);setReviewError('');setFollowUp(Boolean(r.followUp));}}><span className={`status-icon ${r.reviewed?'green':'amber'}`}><Check size={18}/></span><span><b>{shortDate(r.date)}</b><small>{r.reviewed?t('Reviewed by coach'):t('Waiting for review')}{hasAnswer(answerFor(r,{id:'weight'}))?t(' · {answerFor} kg', { answerFor: answerFor(r,{id:'weight'}) }):''}</small></span><ArrowRight size={17}/></button>)}
    {!rows.length && <Empty title={t('Your first check-in')} detail={t('Your coach’s requested measurements and answers will build a clear history here.')}/>}
    {settings && <CheckinSettings key={client.id} client={client} onClose={()=>setSettings(false)}/>}
    {form && <CheckinForm row={form} client={client} onClose={()=>setForm(null)} onSent={()=>setSent(true)}/>}
    {sent && <CheckinSent onDone={()=>setSent(false)}/>}
    {selected && <Modal title={t('{value}’s check-in · {shortDate}', { value: client.name.split(' ')[0], shortDate: shortDate(selected.date) })} onClose={()=>setSelectedId(null)}>
      <AudioPlayer file={selected.audio}/>{selected.updateText&&<Notice><b>{t('Client update')}</b><p>{selected.updateText}</p></Notice>}{selected.transcript&&<Notice><b>{t('Transcript · reviewed by client')}</b><p>{selected.transcript}</p></Notice>}<CheckinBrief summary={selected.summary || checkinSummary(data,selected)}/>
      <div className="checkin-review-answers">{schemaFor(selected).map(f=>{
        const value=answerFor(selected,f);if(!hasAnswer(value))return null;
        const previous=rows.filter(r=>r.date<selected.date).map(r=>answerFor(r,f)).find(hasAnswer);
        return <div key={f.id} className={`checkin-review-answer ${f.type}`}><h3>{t(f.label)}</h3>{f.type==='photos'?<div className="checkin-photos">{value.map(photo=><Media key={photo.id} fileId={photo.id} alt={t('Check-in progress photo')}/>)}</div>:<p>{value} {f.unit || ''}</p>}{['number','rating'].includes(f.type) && hasAnswer(previous) && <small>{t('Previous:')} {previous} {f.unit || ''}</small>}</div>;
      })}</div>
      {coach?<form onSubmit={async e=>{e.preventDefault();setReviewBusy(true);setReviewError('');try{await runAction('checkin.review',clientId,{id:selected.id,response,audio:reviewAudio,followUp});successHaptic();setSelectedId(null);notify?.(t('Check-in reviewed'));}catch(e){setReviewError(e.message);}finally{setReviewBusy(false);}}}><Field label={t('Feedback to client')}><textarea maxLength={4000} value={response} onChange={e=>setResponse(e.target.value)} placeholder={t('Your next step, and why…')}/></Field><VoiceRecording onBusyChange={setReviewVoiceBusy} value={reviewAudio} clientId={clientId} onChange={setReviewAudio} label={t('Voice feedback')}/><label className="checkbox-row"><input type="checkbox" checked={followUp} onChange={e=>setFollowUp(e.target.checked)}/>{t('Needs a follow-up')}</label>{reviewError&&<p role="alert" className="error">{reviewError}</p>}<Button disabled={reviewBusy || reviewVoiceBusy} type="submit">{reviewBusy?t('Saving review…'):t('Complete review')} <Check size={16}/></Button></form>:<><AudioPlayer file={selected.responseAudio}/>{selected.response && <Notice><b>{selected.reviewed?t('Your coach’s feedback'):t('Previous feedback · your updated check-in is awaiting review')}</b><p>{selected.response}</p></Notice>}</>}

    </Modal>}
  </div>;
}

export function CheckinBrief({summary}){return <section className="checkin-brief"><small className="eyebrow">{summary.source}</small><p className="fine-print muted">{summary.start} – {summary.end}</p><h4>{t('Client reported')}</h4>{summary.reported.length?<ul>{summary.reported.map((x,i)=><li key={i}>{x}</li>)}</ul>:<p className="muted">{t('No written or numeric answers. Listen to any attached recording.')}</p>}<h4>{t('Recorded activity')}</h4><ul>{summary.measured.map((x,i)=><li key={i}>{x}</li>)}</ul><h4>{t('Suggested review · rule based')}</h4><p>{summary.suggestion}</p><small className="muted">{summary.limitations}</small></section>;}

export function CheckinQueue(){const {data,selectClient}=useApp();const [status,setStatus]=useState('Pending review'),[sort,setSort]=useState('Oldest first');const rows=data.clients.flatMap(client=>{const schedule=checkinSchedule(client,data.checkins);return [...data.checkins.filter(r=>r.clientId===client.id).map(r=>({client,date:r.date,status:r.followUp?'Follow-up':r.reviewed?'Reviewed':'Pending review',id:r.id})),...(schedule.overdue?[{client,date:schedule.dueDate,status:'Missed',id:`missed-${client.id}`}]:[])];}).filter(r=>status==='All' || r.status===status).sort((a,b)=>sort==='Client name'?a.client.name.localeCompare(b.client.name):sort==='Newest first'?b.date.localeCompare(a.date):a.date.localeCompare(b.date));return <section className="card"><SectionHead title={t('Check-in review queue')}/><div className="coach-inbox-filter"><Field label={t('Queue status')}><select value={status} onChange={e=>setStatus(e.target.value)}>{['Pending review','Follow-up','Missed','Reviewed','All'].map(s=><option key={s}>{s}</option>)}</select></Field><Field label={t('Sort queue')}><select value={sort} onChange={e=>setSort(e.target.value)}>{['Oldest first','Newest first','Client name'].map(s=><option key={s}>{s}</option>)}</select></Field></div>{rows.slice(0,20).map(r=><button className="simple-row" key={r.id} onClick={()=>selectClient(r.client.id,'Check-ins')}><span><b>{t(r.client.name)}</b><small>{shortDate(r.date)} · {r.status}</small></span><ArrowRight size={16}/></button>)}{!rows.length&&<p className="muted">{t('No check-ins in this queue.')}</p>}</section>;}
