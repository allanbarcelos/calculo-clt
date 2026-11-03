import { ContentCallout } from '../../../components/ui';
import { useServices } from '../../../hooks/useServices.js';
import { fillTemplate } from '../../../lib/template.js';

// Summary of the leave reserve; every sentence lives in content.json.
export default function LeaveReserveCallout({ data, leave }) {
  const content = useServices().repositories.content;
  const coverage = leave.coverageMode === 'internal'
    ? fillTemplate(content.label('leaveCoverageInternal'), { bonus: data.leaveInternalBonusRate })
    : fillTemplate(content.label(data.leaveExternalHiringCost > 0 ? 'leaveCoverageExternalWithHiring' : 'leaveCoverageExternal'), { hiringCost: data.leaveExternalHiringCost });

  return (
    <ContentCallout
      id="leaveReserve"
      vars={{
        amount: leave.amount,
        coverage,
        reimbursement: leave.cashFlow.reimbursement,
        maternityDays: leave.maternityDays,
        paternityDays: leave.paternityDays,
        companyCitizen: leave.companyCitizen,
        companyCitizenExtraRemuneration: leave.cashFlow.companyCitizenExtraRemuneration,
        potentialIrpjDeduction: leave.cashFlow.potentialIrpjDeduction,
      }}
    />
  );
}
