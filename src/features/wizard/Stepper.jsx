export default function Stepper({ steps, current, onSelect }) {
  return (
    <nav className="stepper no-print" aria-label="Etapas da calculadora">
      <ol>
        {steps.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-current={i === current ? 'step' : undefined}
              className={`stepper__item${i === current ? ' is-current' : ''}${i < current ? ' is-done' : ''}`}
            >
              <span className="stepper__num" aria-hidden="true">{i < current ? '✓' : i + 1}</span>
              <span className="stepper__label">
                <span className="visually-hidden">Etapa {i + 1} de {steps.length}: </span>
                {s.title}
                {i < current && <span className="visually-hidden"> (concluída)</span>}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <div className="progress" aria-hidden="true"><span style={{ width: `${(current / (steps.length - 1)) * 100}%` }} /></div>
    </nav>
  );
}
