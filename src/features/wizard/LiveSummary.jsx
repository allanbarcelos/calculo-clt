import { useBreakdownLabels } from '../../hooks/useBreakdownLabels.js';
import { formatMoney } from '../../lib/format.js';

export default function LiveSummary({ started, result, onReset }) {
  const { groupTitle } = useBreakdownLabels();
  return (
    <aside className="card live-summary no-print" aria-labelledby="live-title">
      <h2 id="live-title" className="live-summary__title">Estimativa até agora</h2>
      <p className="live-summary__value" aria-live="polite" aria-atomic="true">
        {formatMoney(result.monthlyTotal)}<span> /mês</span>
      </p>
      {started ? (
        <>
          <ul className="live-summary__list">
            {result.groups.filter((g) => g.total > 0).map((g) => (
              <li key={g.id}><span>{groupTitle(g.id)}</span><strong>{formatMoney(g.total)}</strong></li>
            ))}
          </ul>
          <p className="hint">Cada R$ 1,00 de salário custa <strong>{formatMoney(result.costPerReal)}</strong> para a empresa.</p>
        </>
      ) : (
        <p className="hint">O cálculo começa quando você escolhe uma função com piso definido ou chega à etapa “Salário”.</p>
      )}
      {onReset && (
        <button
          type="button"
          className="btn btn--ghost live-summary__reset"
          onClick={() => {
            if (window.confirm('Iniciar uma nova simulação? Os dados preenchidos serão apagados.')) onReset();
          }}
        >
          Nova simulação
        </button>
      )}
    </aside>
  );
}
