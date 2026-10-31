import { Explainer, NumberField, SourcesInline } from '../../../components/ui';
import { useAgreementNotice } from '../../../hooks/useAgreementNotice.js';
import { useFormText } from '../../../hooks/useFormText.js';

export default function PlrSection({ data, set, result }) {
  const t = useFormText();
  const noticeFor = useAgreementNotice(data);
  const monthly = data.plrYearly / 12;
  return (
    <>
      <NumberField {...t.field('plrYearly')} value={data.plrYearly} onChange={(v) => set({ plrYearly: v })} notice={noticeFor('plrYearly')} />
      {data.plrYearly > 0 && (
        <p className="hint" aria-live="polite">
          {t.text('plrYearly', 'costNote', { monthly, asSalary: monthly * result.costPerReal })}
        </p>
      )}
      <SourcesInline sources={[{ id: 'plr' }, { id: 'clt' }]} />
      <Explainer id="plr" />
    </>
  );
}
