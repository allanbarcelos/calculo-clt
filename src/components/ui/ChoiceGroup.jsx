import { useId } from 'react';
import FieldNotice from './FieldNotice.jsx';
import RichText from './RichText.jsx';

export default function ChoiceGroup({ legend, name, value, onChange, options, hint, notice }) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, notice && `${id}-notice`].filter(Boolean).join(' ') || undefined;
  return (
    <fieldset className="choice-group" aria-describedby={describedBy}>
      <legend>{legend}</legend>
      {hint && <p id={`${id}-hint`} className="hint"><RichText text={hint} /></p>}
      <FieldNotice id={`${id}-notice`} notice={notice} />
      <div className="choices">
        {options.map((o) => {
          const checked = String(value) === String(o.value);
          return (
            <label key={o.value} className={`choice${checked ? ' choice--active' : ''}`}>
              <input type="radio" name={name} value={o.value} checked={checked} onChange={() => onChange(o.value)} />
              <span className="choice__body">
                <span className="choice__title">{o.label}</span>
                {o.description && <span className="choice__desc"><RichText text={o.description} /></span>}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
