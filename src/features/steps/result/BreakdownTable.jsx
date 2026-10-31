import { useBreakdownLabels } from '../../../hooks/useBreakdownLabels.js';
import { formatMoney } from '../../../lib/format.js';
import { GROUP_COLORS } from './groupColors.js';

export default function BreakdownTable({ groups, total }) {
  const { groupTitle, itemLabel } = useBreakdownLabels();
  return (
    <section aria-labelledby="detail-title">
      <h3 id="detail-title">Detalhamento mensal</h3>
      <table className="breakdown">
        <caption className="visually-hidden">Custos mensais por item</caption>
        <thead>
          <tr><th scope="col">Item</th><th scope="col" className="num">Valor por mês</th></tr>
        </thead>
        {groups.map((g) => (
          <tbody key={g.id}>
            <tr className="breakdown__group">
              <th scope="rowgroup">
                <span className="legend__swatch" style={{ background: GROUP_COLORS[g.id] }} aria-hidden="true" />
                {groupTitle(g.id)}
              </th>
              <td className="num">{formatMoney(g.total)}</td>
            </tr>
            {g.items.map((i) => (
              <tr key={i.id}>
                <th scope="row">{itemLabel(i)}</th>
                <td className="num">{formatMoney(i.amount)}</td>
              </tr>
            ))}
          </tbody>
        ))}
        <tfoot>
          <tr><th scope="row">Total mensal</th><td className="num">{formatMoney(total)}</td></tr>
        </tfoot>
      </table>
    </section>
  );
}
