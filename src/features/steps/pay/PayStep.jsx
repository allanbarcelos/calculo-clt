import { ContentCallout, SourcesInline } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';
import AllowancesSection from './AllowancesSection.jsx';
import EmployeeDataSection from './EmployeeDataSection.jsx';
import NightWorkSection from './NightWorkSection.jsx';
import OvertimeSection from './OvertimeSection.jsx';
import SalarySection from './SalarySection.jsx';

export default function PayStep(props) {
  const t = useFormText();
  const { contract } = useServices();
  const issues = contract.apprenticeIssues(props.data);
  const issueVars = { weeklyHours: props.data.weeklyHours, maxWeeklyHours: contract.apprentice().maxWeeklyHours, hours: issues.includes('hours'), overtime: issues.includes('overtime'), risk: issues.includes('risk') };
  return (
    <>
      <SalarySection {...props} />
      {issues.length > 0 && <ContentCallout id="apprenticeIssues" vars={issueVars} />}
      <AllowancesSection {...props} />
      <fieldset className="subsection">
        <legend>{t.section('overtimeNight')}</legend>
        <OvertimeSection {...props} />
        <NightWorkSection {...props} />
      </fieldset>
      <EmployeeDataSection {...props} />
      <SourcesInline sources={[{ id: 'clt' }]} />
    </>
  );
}
