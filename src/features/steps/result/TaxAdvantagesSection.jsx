import { ContentCallout, Explainer } from '../../../components/ui';
import { useServices } from '../../../hooks/useServices.js';
import { formatMoney } from '../../../lib/format.js';
import { fillTemplate } from '../../../lib/template.js';

// Tax savings outside the payroll cost: itemized for Lucro Real, explained for other regimes.
export default function TaxAdvantagesSection({ data, result }) {
  const { taxAdvantages, repositories } = useServices();
  const content = repositories.content;
  const label = (id, vars) => fillTemplate(content.label(id), vars);
  const tax = taxAdvantages.compute(data, result);

  if (!tax.applies) {
    return <ContentCallout id="taxOtherRegimes" vars={{ regime: repositories.regimes.get(data.regime).short }} />;
  }

  return (
    <section aria-labelledby="tax-title">
      <h3 id="tax-title">{label('taxTitle')}</h3>
      <p className="hint">{label('taxIntro')}</p>
      {tax.items.length === 0 ? (
        <p className="hint">{label('taxNone')}</p>
      ) : (
        <table className="breakdown">
          <caption className="visually-hidden">{label('taxTitle')}</caption>
          <thead>
            <tr><th scope="col">{label('taxColumn')}</th><th scope="col" className="num">{label('taxAmountColumn')}</th></tr>
          </thead>
          <tbody>
            {tax.items.map((item) => (
              <tr key={item.id}>
                <th scope="row">
                  {label(`tax_${item.id}`, item.params)}
                  <span className="hint tax-explain">{label(`taxExplain_${item.id}`)}</span>
                </th>
                <td className="num">{formatMoney(item.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><th scope="row">{label('taxTotal')}</th><td className="num">{formatMoney(tax.total)}</td></tr>
            <tr><th scope="row">{label('taxNet')}</th><td className="num">{formatMoney(tax.net)}</td></tr>
          </tfoot>
        </table>
      )}
      {tax.pat.potential > 0 && <p className="hint">{label('taxPatPotential', { amount: tax.pat.potential })}</p>}
      <Explainer id="taxAdvantages" />
    </section>
  );
}
