import { useId, useState } from 'react';
import FieldNotice from './FieldNotice.jsx';

function formatInput(n) {
  if (!n) return '0';
  return String(n).replace('.', ',');
}

// Accepts "1.874,36" (pt-BR) and "1874.36"
function parseInput(text) {
  const cleaned = String(text).replace(/[^\d,.-]/g, '');
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
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
      {hint && <p id={`${inputId}-hint`} className="hint">{hint}</p>}
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
            onChange(Math.max(min, n));
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
