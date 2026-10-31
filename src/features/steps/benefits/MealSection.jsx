import { Explainer, NumberField, Toggle } from '../../../components/ui';
import { useAgreementNotice } from '../../../hooks/useAgreementNotice.js';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';

export default function MealSection({ data, set, result }) {
  const { maxEmployeeSharePct } = useServices().repositories.rates.mealVoucher();
  const t = useFormText();
  const noticeFor = useAgreementNotice(data);

  return (
    <fieldset className="subsection">
      <legend>{t.section('meal')}</legend>
      <Toggle {...t.field('mealEnabled')} checked={data.mealEnabled} onChange={(v) => set({ mealEnabled: v })} />
      {data.mealEnabled && (
        <div className="grid-2">
          <NumberField {...t.field('mealValue')} value={data.mealValue} onChange={(v) => set({ mealValue: v })} notice={noticeFor('mealValue')} />
          <NumberField
            {...t.field('mealDiscountPct', { max: maxEmployeeSharePct })}
            max={maxEmployeeSharePct}
            value={data.mealDiscountPct}
            onChange={(v) => set({ mealDiscountPct: v })}
            notice={noticeFor('mealDiscountPct')}
          />
        </div>
      )}
      <p className="hint">{t.text('mealValue', 'cashNote')}</p>
      {data.mealEnabled && data.mealValue > 0 && (
        <p className="hint" aria-live="polite">
          {t.text('mealValue', 'costNote', {
            companyCost: data.mealValue * (1 - data.mealDiscountPct / 100),
            value: data.mealValue,
            asSalary: data.mealValue * result.costPerReal,
          })}
        </p>
      )}
      <Explainer id="meal" vars={{ maxShare: maxEmployeeSharePct }} />
    </fieldset>
  );
}
