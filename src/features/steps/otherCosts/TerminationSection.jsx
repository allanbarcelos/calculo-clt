import { ContentCallout, Explainer, NumberField, RichText, Toggle } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';

export default function TerminationSection({ data, set, result }) {
  const { provisions, repositories, contract } = useServices();
  const t = useFormText();
  const fgts = contract.fgts(data);
  const notice = repositories.rates.notice();
  const { gross } = result;

  if (contract.isApprentice(data)) return <ContentCallout id="apprenticeTermination" />;

  return (
    <>
      <Toggle
        {...t.field('includeTerminationReserve', { fine: fgts.terminationFine })}
        checked={data.includeTerminationReserve}
        onChange={(v) => set({ includeTerminationReserve: v })}
      />
      {gross > 0 && (
        <p className="hint" aria-live="polite">
          <RichText text={t.raw('includeTerminationReserve', 'note')} vars={{ amount: provisions.terminationFineAfterOneYear(gross, data) }} />
        </p>
      )}

      <Toggle {...t.field('includeNoticeReserve')} checked={data.includeNoticeReserve} onChange={(v) => set({ includeNoticeReserve: v })} />
      {(data.includeNoticeReserve || data.includeTerminationReserve) && (
        <NumberField
          {...t.field('expectedTenureYears')}
          hint={data.includeNoticeReserve
            ? t.text('expectedTenureYears', gross > 0 ? 'hintWithValue' : 'hintPending', { ...notice, ...result.notice })
            : t.text('expectedTenureYears', 'hintTermination')}
          value={data.expectedTenureYears}
          max={30}
          onChange={(v) => set({ expectedTenureYears: v })}
        />
      )}
      <Toggle {...t.field('includeVacationCover')} checked={data.includeVacationCover} onChange={(v) => set({ includeVacationCover: v })} />
      <Explainer id="termination" vars={notice} />
    </>
  );
}
