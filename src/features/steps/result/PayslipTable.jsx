import { SourcesInline } from '../../../components/ui';
import { useServices } from '../../../hooks/useServices.js';
import { formatMoney } from '../../../lib/format.js';

export default function PayslipTable({ employee }) {
  const irrfZeroed = useServices().repositories.content.label('irrfZeroedByReduction');
  const rows = [
    { label: 'Remuneração bruta', amount: employee.gross },
    { label: '(−) INSS do empregado (tabela progressiva)', amount: -employee.inss },
    {
      label: `(−) Imposto de Renda retido${employee.irrf.tax === 0 && employee.irrf.taxBeforeReduction > 0 ? ` ${irrfZeroed}` : ''}`,
      amount: -employee.irrf.tax,
    },
    { label: '(−) Desconto do vale-transporte', amount: -employee.transport, optional: true },
    { label: '(−) Desconto do vale-refeição', amount: -employee.meal, optional: true },
    { label: '(+) Salário-família (compensado pela empresa no INSS)', amount: employee.familyAllowance, optional: true },
  ].filter((r) => !r.optional || r.amount !== 0);

  return (
    <section aria-labelledby="employee-title">
      <h3 id="employee-title">O que o funcionário recebe</h3>
      <table className="breakdown">
        <caption className="visually-hidden">Contracheque estimado do funcionário</caption>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <th scope="row">{r.label}</th>
              <td className="num">{r.amount < 0 ? `−${formatMoney(-r.amount)}` : formatMoney(r.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><th scope="row">Salário líquido estimado</th><td className="num">{formatMoney(employee.net)}</td></tr>
        </tfoot>
      </table>
      <SourcesInline
        prefix="Fontes:"
        sources={[{ id: 'inssTable' }, { id: 'irrfTable' }, { id: 'irrfReduction' }, { id: 'familyAllowance' }]}
      />
    </section>
  );
}
