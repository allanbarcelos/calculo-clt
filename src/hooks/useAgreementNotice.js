import { formatMoney } from '../lib/format.js';
import { useFormText } from './useFormText.js';
import { useServices } from './useServices.js';

// Returns noticeFor(field) → { text, differs } when the selected collective agreement
// sets a value for that field; null otherwise.
export function useAgreementNotice(data) {
  const { agreements, wageFloors } = useServices();
  const t = useFormText();
  const selection = agreements.selection(data);
  const presets = selection ? agreements.presets(data.agreementId, data.agreementRoleId) : {};
  const kind = selection?.agreement.kind === 'ACT' ? 'acordo coletivo' : 'convenção coletiva';

  const describe = (preset) => {
    if (preset.daily !== undefined) return t.text('agreementNotice', 'dailyValue', { daily: preset.daily, monthly: preset.value });
    if (preset.format === 'money') return formatMoney(preset.value);
    if (preset.format === 'hours') return t.text('agreementNotice', 'hoursValue', { hours: preset.value });
    if (preset.format === 'boolean') return t.text('agreementNotice', preset.value ? 'yes' : 'no');
    if (preset.format === 'insalubrityBase') return t.text('agreementNotice', preset.value === 'salary' ? 'baseSalary' : 'baseMinimumWage');
    return `${String(preset.value).replace('.', ',')}%`;
  };

  const build = (preset, current) => {
    const differs = current !== preset.value;
    return { differs, text: t.text('agreementNotice', differs ? 'differs' : 'match', { kind, clause: preset.clause, value: describe(preset) }) };
  };

  return function noticeFor(field) {
    if (!selection) return null;
    if (field === 'salary') {
      if (!selection.role) return null;
      const floor = wageFloors.resolve(data).value;
      return build({ value: floor, format: 'money', clause: selection.role.clause }, data.salary < floor ? data.salary : floor);
    }
    const preset = presets[field];
    return preset ? build(preset, data[field]) : null;
  };
}
