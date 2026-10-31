import { Explainer, NumberField } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';

const FIELDS = ['sstYearly', 'accountingMonthly', 'ppeMonthly', 'hiringOneTime'];

export default function OperationalCostsSection({ data, set }) {
  const t = useFormText();
  return (
    <fieldset className="subsection">
      <legend>{t.section('operationalCosts')}</legend>
      <div className="grid-2">
        {FIELDS.map((key) => (
          <NumberField key={key} {...t.field(key)} value={data[key]} onChange={(v) => set({ [key]: v })} />
        ))}
      </div>
      <Explainer id="sst" />
      <Explainer id="payrollOps" />
      <Explainer id="ppe" />
      <Explainer id="hiring" />
    </fieldset>
  );
}
