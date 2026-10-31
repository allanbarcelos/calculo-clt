import { SourcesInline } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';
import AllowancesSection from './AllowancesSection.jsx';
import EmployeeDataSection from './EmployeeDataSection.jsx';
import NightWorkSection from './NightWorkSection.jsx';
import OvertimeSection from './OvertimeSection.jsx';
import SalarySection from './SalarySection.jsx';

export default function PayStep(props) {
  const t = useFormText();
  return (
    <>
      <SalarySection {...props} />
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
