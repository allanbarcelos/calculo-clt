import { NumberField } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';

export default function EmployeeDataSection({ data, set }) {
  const t = useFormText();
  return (
    <fieldset className="subsection">
      <legend>{t.section('employeeData')}</legend>
      <div className="grid-2">
        <NumberField {...t.field('dependents')} value={data.dependents} onChange={(v) => set({ dependents: Math.round(v) })} />
        <NumberField {...t.field('childrenUnder14')} value={data.childrenUnder14} onChange={(v) => set({ childrenUnder14: Math.round(v) })} />
      </div>
    </fieldset>
  );
}
