import { Explainer, NumberField, RichText, Toggle } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';

export default function TerminationSection({ data, set, result }) {
  const { provisions, repositories } = useServices();
  const t = useFormText();
  const fgts = repositories.rates.fgts();
  const notice = repositories.rates.notice();
  const { gross } = result;

  return (
    <>
      <Toggle
        {...t.field('includeTerminationReserve', { fine: fgts.terminationFine })}
        checked={data.includeTerminationReserve}
        onChange={(v) => set({ includeTerminationReserve: v })}
      />
      {gross > 0 && (
        <p className="hint" aria-live="polite">
          <RichText text={t.raw('includeTerminationReserve', 'note')} vars={{ amount: provisions.terminationFineAfterOneYear(gross) }} />
        </p>
      )}

      <Toggle {...t.field('includeNoticeReserve')} checked={data.includeNoticeReserve} onChange={(v) => set({ includeNoticeReserve: v })} />
      {data.includeNoticeReserve && (
        <NumberField
          {...t.field('expectedTenureYears')}
          hint={t.text('expectedTenureYears', gross > 0 ? 'hintWithValue' : 'hintPending', { ...notice, ...result.notice })}
          value={data.expectedTenureYears}
          max={30}
          onChange={(v) => set({ expectedTenureYears: v })}
        />
      )}
      <Explainer id="termination" vars={notice} />
    </>
  );
}
