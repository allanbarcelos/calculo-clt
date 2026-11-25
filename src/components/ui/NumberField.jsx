import { useId, useState } from 'react';
import FieldNotice from './FieldNotice.jsx';
import RichText from './RichText.jsx';
import { parseInput } from '../../lib/parseNumber.js';

function formatInput(n) {
  if (!n) return '0';
  return String(n).replace('.', ',');
}

export default function NumberField({ label, value, onChange, hint, error, notice, prefix, suffix, min = 0, max, id }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [text, setText] = useState(formatInput(value));
  const [lastValue, setLastValue] = useState(value);

  // Resync the text only when the value changes from outside the field.
  if (value !== lastValue) {
    setLastValue(value);
    if (parseInput(text) !== value) setText(formatInput(value));
  }

  const describedBy = [hint && `${inputId}-hint`, notice && `${inputId}-notice`, error && `${inputId}-error`].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label htmlFor={inputId}>{label}</label>
      {hint && <p id={`${inputId}-hint`} className="hint"><RichText text={hint} /></p>}
      <div className="input-affix">
        {prefix && <span aria-hidden="true">{prefix}</span>}
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          value={text}
          aria-describedby={describedBy}
          aria-invalid={error ? 'true' : undefined}
          onChange={(e) => {
            setText(e.target.value);
            let n = parseInput(e.target.value);
            if (max !== undefined) n = Math.min(n, max);
            n = Math.max(min, n);
            // The value came from this field: keep what the user is typing (e.g. an empty field
            // that is clamped to min) and only reformat on blur.
            setLastValue(n);
            onChange(n);
          }}
          onBlur={() => setText(formatInput(value))}
        />
        {suffix && <span aria-hidden="true">{suffix}</span>}
      </div>
      <FieldNotice id={`${inputId}-notice`} notice={notice} />
      {error && <p id={`${inputId}-error`} className="error" role="alert">{error}</p>}
    </div>
  );
}
