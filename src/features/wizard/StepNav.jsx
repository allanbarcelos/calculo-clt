export default function StepNav({ canGoBack, isLast, isBeforeLast, onBack, onReset }) {
  return (
    <div className="step__nav no-print">
      {canGoBack && <button type="button" className="btn btn--ghost" onClick={onBack}>← Voltar</button>}
      {/* Distinct keys: otherwise React reuses the same <button> and, once the reset re-renders
          the first step, the click finishes on a submit button and advances one step. */}
      {isLast ? (
        <button
          key="reset"
          type="button"
          className="btn btn--primary"
          onClick={(e) => {
            e.preventDefault();
            onReset();
          }}
        >
          Recomeçar
        </button>
      ) : (
        <button key="next" type="submit" className="btn btn--primary">{isBeforeLast ? 'Ver resultado' : 'Continuar'} →</button>
      )}
    </div>
  );
}
