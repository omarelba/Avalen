// Common reasons for changing a client's plan, one tap away. The reason box stays editable,
// and whatever it holds is saved to the client's timeline as before (DR-06).
import { t } from '../i18n.js';

const REASONS = ['First plan', 'Progression', 'Client request', 'Recovery week'];

export function ReasonChips({ value, onPick }) {
  return <div className="reason-chips" role="group" aria-label={t('Common reasons')}>
    {REASONS.map((reason) => {
      const label = t(reason);
      return <button type="button" key={reason} aria-pressed={value === label} onClick={() => onPick(label)}>{label}</button>;
    })}
  </div>;
}
