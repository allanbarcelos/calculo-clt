import { ContentCallout } from '../../../components/ui';
import BreakdownTable from './BreakdownTable.jsx';
import CompositionBar from './CompositionBar.jsx';
import PayslipTable from './PayslipTable.jsx';
import RegimeComparisonTable from './RegimeComparisonTable.jsx';
import ResultHero from './ResultHero.jsx';

export default function ResultStep({ data, result }) {
  const groups = result.groups.filter((g) => g.total > 0);
  return (
    <div className="result">
      <ResultHero data={data} result={result} />
      <CompositionBar groups={groups} total={result.monthlyTotal} />
      <BreakdownTable groups={groups} total={result.monthlyTotal} />
      {result.benefitsTotal > 0 && (
        <ContentCallout
          id="benefitsSavings"
          vars={{
            benefitsTotal: result.benefitsTotal,
            benefitsAsSalary: result.benefitsAsSalary,
            savings: result.benefitsSavings,
            savingsYear: result.benefitsSavings * 12,
          }}
        />
      )}
      <PayslipTable employee={result.employee} />
      <RegimeComparisonTable data={data} />
      <ContentCallout id="beforeHiring" />
      <div className="actions no-print">
        <button type="button" className="btn btn--ghost" onClick={() => window.print()}>Imprimir ou salvar em PDF</button>
      </div>
    </div>
  );
}
