import { ContentCallout } from '../../../components/ui';
import AgreementCheckCallout from './AgreementCheckCallout.jsx';
import ApprenticeSavingsCallout from './ApprenticeSavingsCallout.jsx';
import BreakdownTable from './BreakdownTable.jsx';
import CompositionBar from './CompositionBar.jsx';
import LeaveReserveCallout from './LeaveReserveCallout.jsx';
import PayslipTable from './PayslipTable.jsx';
import RegimeComparisonTable from './RegimeComparisonTable.jsx';
import ResultHero from './ResultHero.jsx';
import TaxAdvantagesSection from './TaxAdvantagesSection.jsx';

export default function ResultStep({ data, result }) {
  const groups = result.groups.filter((g) => g.total > 0);
  return (
    <div className="result">
      <ResultHero data={data} result={result} />
      <AgreementCheckCallout data={data} />
      <CompositionBar groups={groups} total={result.monthlyTotal} />
      <BreakdownTable groups={groups} total={result.monthlyTotal} />
      <ApprenticeSavingsCallout data={data} result={result} />
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
      {result.leaveReserve.enabled && <LeaveReserveCallout data={data} leave={result.leaveReserve} />}
      <TaxAdvantagesSection data={data} result={result} />
      <PayslipTable employee={result.employee} />
      <RegimeComparisonTable data={data} />
      <ContentCallout id="beforeHiring" />
      <div className="actions no-print">
        <button type="button" className="btn btn--ghost" onClick={() => window.print()}>Imprimir ou salvar em PDF</button>
      </div>
    </div>
  );
}
