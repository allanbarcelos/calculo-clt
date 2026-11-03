import { useId } from 'react';
import FieldNotice from './FieldNotice.jsx';
import RichText from './RichText.jsx';

export default function SelectField({ label, value, onChange, options, hint, notice }) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, notice && `${id}-notice`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && <p id={`${id}-hint`} className="hint"><RichText text={hint} /></p>}
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={describedBy}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <FieldNotice id={`${id}-notice`} notice={notice} />
    </div>
  );
}
