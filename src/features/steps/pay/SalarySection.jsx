import { ContentCallout, NumberField, SelectField } from '../../../components/ui';
import { useAgreementNotice } from '../../../hooks/useAgreementNotice.js';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';

export default function SalarySection({ data, set, errors }) {
  const { wageFloors, repositories } = useServices();
  const t = useFormText();
  const floor = wageFloors.resolve(data);
  const regime = repositories.regimes.get(data.regime);
  const workweek = repositories.rates.workweek();
  const vars = { floor: floor.value };
  const noticeFor = useAgreementNotice(data);

  return (
    <>
      <NumberField
        {...t.field('salary', vars)}
        value={data.salary}
        onChange={(v) => set({ salary: v, salaryAuto: false })}
        error={errors.salary}
        notice={noticeFor('salary')}
      />
      {data.salary < floor.value && (
        <button type="button" className="btn btn--ghost" onClick={() => set({ salary: floor.value, salaryAuto: true })}>
          {t.text('salary', 'useFloorButton', vars)}
        </button>
      )}
      {regime.salaryCappedAtFloor && data.salary > floor.value && <ContentCallout id="meiSalaryCap" vars={{ meiCap: floor.value }} />}

      <SelectField
        {...t.field('weeklyHours')}
        value={String(data.weeklyHours)}
        onChange={(v) => set({ weeklyHours: Number(v) })}
        notice={noticeFor('weeklyHours')}
        options={workweek.options.map((o) => ({ value: String(o.hours), label: o.label }))}
      />
    </>
  );
}
