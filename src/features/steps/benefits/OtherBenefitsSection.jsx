import { ContentCallout, Explainer, NumberField } from '../../../components/ui';
import { useAgreementNotice } from '../../../hooks/useAgreementNotice.js';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';

const FIELDS = ['healthPlan', 'dentalPlan', 'lifeInsurance', 'education', 'pension', 'otherBenefits'];

export default function OtherBenefitsSection({ data, set, result }) {
  const educationLimit = useServices().benefits.educationLimit(result.gross);
  const t = useFormText();
  const noticeFor = useAgreementNotice(data);
  return (
    <>
      <div className="grid-2">
        {FIELDS.map((key) => (
          <NumberField key={key} {...t.field(key)} value={data[key]} onChange={(v) => set({ [key]: v })} notice={noticeFor(key)} />
        ))}
      </div>
      {data.education > educationLimit && <ContentCallout id="educationOverLimit" vars={{ educationLimit }} />}
      <Explainer id="otherBenefits" vars={{ educationLimit }} />
    </>
  );
}
