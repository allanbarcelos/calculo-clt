import { useBreakdownLabels } from '../../../hooks/useBreakdownLabels.js';
import { formatMoney, formatPercent } from '../../../lib/format.js';
import { GROUP_COLORS } from './groupColors.js';

export default function CompositionBar({ groups, total }) {
  const { groupTitle } = useBreakdownLabels();
  return (
    <section aria-labelledby="composition-title">
      <h3 id="composition-title">Para onde vai o dinheiro</h3>
      <div className="stacked-bar" aria-hidden="true">
        {groups.map((g) => <span key={g.id} style={{ width: `${(g.total / total) * 100}%`, background: GROUP_COLORS[g.id] }} />)}
      </div>
      <ul className="legend">
        {groups.map((g) => (
          <li key={g.id}>
            <span className="legend__swatch" style={{ background: GROUP_COLORS[g.id] }} aria-hidden="true" />
            {groupTitle(g.id)}: <strong>{formatMoney(g.total)}</strong> ({formatPercent(g.total / total)})
          </li>
        ))}
      </ul>
    </section>
  );
}
