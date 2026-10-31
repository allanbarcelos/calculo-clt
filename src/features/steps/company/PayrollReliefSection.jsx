import { Explainer, Toggle } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';

// Rendered only while a payroll relief transition rule is in force.
export default function PayrollReliefSection({ data, set }) {
  const relief = useServices().repositories.regimes.payrollRelief();
  const t = useFormText();
  if (!relief) return null;
  const thirteenth = relief.inssOnThirteenth ? '' : t.text('payrollRelief', 'thirteenthNote');

  return (
    <>
      <Toggle
        {...t.field('payrollRelief', { rate: relief.payrollRate, thirteenth })}
        checked={data.payrollRelief}
        onChange={(v) => set({ payrollRelief: v })}
      />
      <Explainer id="payrollRelief" vars={{ reliefRate: relief.payrollRate, cprbShare: relief.cprbShare }} />
    </>
  );
}
