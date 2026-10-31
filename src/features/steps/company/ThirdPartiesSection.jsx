import { Explainer, NumberField } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';

export default function ThirdPartiesSection({ data, set }) {
  const rules = useServices().repositories.regimes.thirdParties();
  const t = useFormText();
  return (
    <>
      <NumberField {...t.field('thirdParties')} value={data.thirdParties} max={rules.max} onChange={(v) => set({ thirdParties: v })} />
      <Explainer id="thirdParties" />
    </>
  );
}
