export default function StepNav({ canGoBack, isLast, isBeforeLast, onBack, onReset }) {
  return (
    <div className="step__nav no-print">
      {canGoBack && <button type="button" className="btn btn--ghost" onClick={onBack}>← Voltar</button>}
      {isLast ? (
        <button type="button" className="btn btn--primary" onClick={onReset}>Recomeçar</button>
      ) : (
        <button type="submit" className="btn btn--primary">{isBeforeLast ? 'Ver resultado' : 'Continuar'} →</button>
      )}
    </div>
  );
}
