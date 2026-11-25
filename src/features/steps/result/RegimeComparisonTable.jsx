import { RichText } from '../../../components/ui';
import { useServices } from '../../../hooks/useServices.js';
import { formatMoney } from '../../../lib/format.js';

export default function RegimeComparisonTable({ data }) {
  const { comparison: comparisonService, repositories, wageFloors } = useServices();
  const comparison = comparisonService.compare(data, { floor: wageFloors.resolve(data).value });
  const cheapest = Math.min(...comparison.filter((c) => c.eligible).map((c) => c.monthlyTotal));
  // A household has nothing to compare with: company regimes are not an option for it.
  if (comparison.length < 2) return null;

  return (
    <section aria-labelledby="compare-title">
      <h3 id="compare-title">Comparando regimes tributários</h3>
      <p className="hint">Mesmo funcionário, custo só da folha. O DAS e os impostos sobre o faturamento não entram aqui, então a escolha do regime deve considerar também a receita da empresa. A desoneração da folha só entra se você a marcou no seu regime, e a CPRB sobre a receita fica de fora.</p>
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
                {c.eligible && c.monthlyTotal === cheapest && <span className="tag tag--good">menor custo só de folha</span>}
              </th>
              {c.eligible ? (
                <>
                  <td className="num">{formatMoney(c.monthlyTotal)}</td>
                  <td className="num">{formatMoney(c.yearlyTotal)}</td>
                </>
              ) : (
                <td className="num" colSpan={2}>não se aplica: salário acima do piso</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint"><RichText text={repositories.content.label('regimeComparisonNote')} /></p>
    </section>
  );
}
