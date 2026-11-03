import { Explainer, NumberField, RichText } from '../../../components/ui';
import { useAgreementNotice } from '../../../hooks/useAgreementNotice.js';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';

export default function OvertimeSection({ data, set, result }) {
  const { repositories, calendar, compensation } = useServices();
  const t = useFormText();
  const noticeFor = useAgreementNotice(data);
  const rules = repositories.rates.overtime();
  const { hourly } = result;
  const limits = compensation.limits(data);
  const warn = (field, over, vars) => (over ? { differs: true, text: t.text(field, 'overLimit', vars) } : null);
  const basis = t.text('hourly', data.insalubrity || data.hazard ? 'basisWithAllowances' : 'basisSalary');

  return (
    <>
      <p className="hint">
        <RichText text={t.raw('hourly', 'note')} vars={{ hourly, basis, divisor: repositories.rates.workweekDivisor(data.weeklyHours) }} />
      </p>
      <div className="grid-2">
        <NumberField
          {...t.field('overtimeHours', rules)}
          value={data.overtimeHours}
          onChange={(v) => set({ overtimeHours: v })}
          notice={warn('overtimeHours', data.overtimeHours + data.nightOvertimeHours > limits.overtime, { ...rules, max: limits.overtime, days: limits.monthlyWorkingDays })}
        />
        <NumberField
          {...t.field('overtimeRate', { minRate: rules.minRate, hourValue: hourly * (1 + data.overtimeRate / 100) })}
          value={data.overtimeRate}
          min={rules.minRate}
          onChange={(v) => set({ overtimeRate: v })}
          notice={noticeFor('overtimeRate')}
        />
      </div>
      <NumberField
        {...t.field('restDayOvertimeHours', { rate: rules.restDayRate, hourValue: hourly * (1 + rules.restDayRate / 100) })}
        value={data.restDayOvertimeHours}
        onChange={(v) => set({ restDayOvertimeHours: v })}
        notice={warn('restDayOvertimeHours', data.restDayOvertimeHours > limits.restDay, { max: limits.restDay, days: limits.monthlyRestDays })}
      />
      <Explainer id="overtime" vars={{ ...rules, ...calendar.yearSummary() }} />
    </>
  );
}
