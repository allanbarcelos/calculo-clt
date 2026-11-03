import { Explainer, NumberField, SelectField } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';

export default function NightWorkSection({ data, set, result }) {
  const { repositories, compensation } = useServices();
  const { rates } = repositories;
  const t = useFormText();
  const night = rates.nightWorkType(data.nightType);
  const factor = 60 / night.hourMinutes;
  const { hourly } = result;
  const nightHoursField = t.field('nightHours');
  const limits = compensation.limits(data);
  const nightOver = data.nightHours > limits.night
    ? { differs: true, text: t.text('nightHours', 'overLimit', { period: night.periodHours, days: limits.monthlyWorkingDays, max: limits.night }) }
    : null;

  return (
    <>
      <SelectField
        {...t.field('nightType')}
        value={data.nightType}
        onChange={(v) => set({ nightType: v })}
        options={rates.nightWork().types.map((type) => ({ value: type.id, label: type.label }))}
      />
      <NumberField
        {...nightHoursField}
        hint={t.text('nightHours', factor > 1 ? 'hintReduced' : 'hintRegular', {
          minutes: night.hourMinutes,
          factor,
          premium: hourly * night.rate * factor,
        })}
        value={data.nightHours}
        onChange={(v) => set({ nightHours: v })}
        notice={nightOver}
      />
      <NumberField
        {...t.field('nightOvertimeHours', {
          nightRate: night.rate,
          overtimeRate: data.overtimeRate,
          hourValue: hourly * (1 + night.rate) * (1 + data.overtimeRate / 100) * factor,
        })}
        value={data.nightOvertimeHours}
        onChange={(v) => set({ nightOvertimeHours: v })}
      />
      <Explainer id="nightWork" />
    </>
  );
}
