import { ContentCallout } from '../../../components/ui';
import { useServices } from '../../../hooks/useServices.js';

// Same employee and salary on a standard contract, to show what the apprentice contract saves.
export default function ApprenticeSavingsCallout({ data, result }) {
  const { contract, calculator, repositories } = useServices();
  if (!contract.isApprentice(data)) return null;
  const standard = calculator.calculate({ ...data, contractType: 'standard' });
  const savings = standard.monthlyTotal - result.monthlyTotal;
  return (
    <ContentCallout
      id="apprenticeSavings"
      vars={{
        fgtsRate: contract.apprentice().fgtsRate,
        standardRate: repositories.rates.fgts().monthlyRate,
        standardTotal: standard.monthlyTotal,
        savings,
        savingsYear: savings * 12,
      }}
    />
  );
}
