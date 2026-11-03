import { RichText } from '../../../components/ui';
import { useServices } from '../../../hooks/useServices.js';
import { formatMoney } from '../../../lib/format.js';

export default function RegimeComparisonTable({ data }) {
  const { comparison: comparisonService, repositories } = useServices();
  const comparison = comparisonService.compare(data);
  const cheapest = Math.min(...comparison.map((c) => c.monthlyTotal));

  return (
    <section aria-labelledby="compare-title">
      <h3 id="compare-title">Comparando regimes tributários</h3>
      <p className="hint">Mesmo funcionário, custo só da folha. O DAS e os impostos sobre o faturamento não entram aqui, então a escolha do regime deve considerar também a receita da empresa.</p>
      <table className="breakdown">
        <caption className="visually-hidden">Custo mensal e anual por regime</caption>
        <thead>
          <tr><th scope="col">Regime</th><th scope="col" className="num">Por mês</th><th scope="col" className="num">Por ano</th></tr>
        </thead>
        <tbody>
          {comparison.map((c) => (
            <tr key={c.id} className={c.id === data.regime ? 'is-current' : undefined}>
              <th scope="row">
                {c.label}
                {c.id === data.regime && <span className="tag">seu regime</span>}
                {c.monthlyTotal === cheapest && <span className="tag tag--good">menor custo de folha</span>}
              </th>
              <td className="num">{formatMoney(c.monthlyTotal)}</td>
              <td className="num">{formatMoney(c.yearlyTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint"><RichText text={repositories.content.label('regimeComparisonNote')} /></p>
    </section>
  );
}
