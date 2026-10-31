import { Explainer, NumberField, SourcesInline, Toggle } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';

export default function TransportSection({ data, set }) {
  const { benefits, repositories } = useServices();
  const t = useFormText();
  const rules = repositories.rates.transportVoucher();
  const cost = data.transportDays * data.transportDailyFare;
  const cap = benefits.transportCap(data.salary);

  return (
    <fieldset className="subsection">
      <legend>{t.section('transport')}</legend>
      <Toggle {...t.field('transportEnabled')} checked={data.transportEnabled} onChange={(v) => set({ transportEnabled: v })} />
      {data.transportEnabled && (
        <>
          <div className="grid-2">
            <NumberField {...t.field('transportDays')} value={data.transportDays} max={31} onChange={(v) => set({ transportDays: Math.round(v) })} />
            <NumberField {...t.field('transportDailyFare')} value={data.transportDailyFare} onChange={(v) => set({ transportDailyFare: v })} />
          </div>
          <p className="hint" aria-live="polite">
            {t.text('transportDailyFare', 'note', {
              cost,
              share: rules.employeeShare,
              employee: Math.min(cost, cap),
              company: Math.max(0, cost - cap),
            })}
          </p>
        </>
      )}
      <SourcesInline sources={[{ id: 'transport' }]} />
      <Explainer id="transport" vars={{ employeeShare: rules.employeeShare, transportCap: cap }} />
    </fieldset>
  );
}
