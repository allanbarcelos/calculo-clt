import { ChoiceGroup, ContentCallout, Explainer } from '../../../components/ui';
import { useAgreementNotice } from '../../../hooks/useAgreementNotice.js';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';

export default function AllowancesSection({ data, set }) {
  const { repositories, compensation } = useServices();
  const t = useFormText();
  const noticeFor = useAgreementNotice(data);
  const minimumWage = repositories.rates.minimumWage();
  const insalubrity = repositories.hazards.insalubrity();
  const hazardPay = repositories.hazards.hazardPay();
  const insalubrityBase = compensation.insalubrityBase(data);
  const insalubrityField = t.field('insalubrity', { minimumWage });
  const hazardField = t.field('hazard', { rate: hazardPay.rate });

  return (
    <fieldset className="subsection">
      <legend>{t.section('allowances')}</legend>
      <ChoiceGroup
        legend={insalubrityField.label}
        hint={data.insalubrityBase === 'salary' ? t.text('insalubrity', 'salaryBaseNote', { salary: data.salary }) : insalubrityField.hint}
        name="insalubrity"
        value={data.insalubrity}
        onChange={(v) => set({ insalubrity: Number(v) })}
        notice={noticeFor('insalubrity')}
        options={insalubrity.grades.map((g) => ({
          value: g.value,
          label: g.value ? t.text('insalubrity', 'option', { label: g.label, amount: (insalubrityBase * g.value) / 100 }) : g.label,
          description: g.description,
        }))}
      />
      <Explainer id="insalubrity" />

      <ChoiceGroup
        legend={hazardField.label}
        hint={hazardField.hint}
        name="hazard"
        value={data.hazard ? 'yes' : 'no'}
        onChange={(v) => set({ hazard: v === 'yes' })}
        notice={noticeFor('hazard')}
        options={[
          { value: 'no', ...hazardPay.options.no },
          {
            value: 'yes',
            ...hazardPay.options.yes,
            label: t.text('hazard', 'option', { label: hazardPay.options.yes.label, amount: data.salary * hazardPay.rate }),
          },
        ]}
      />
      <Explainer id="hazard" vars={{ hazardRate: hazardPay.rate }} />
      {data.hazard && data.insalubrity > 0 && <ContentCallout id="insalubrityHazardOverlap" />}
    </fieldset>
  );
}
