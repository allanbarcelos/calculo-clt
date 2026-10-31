import { Explainer, NumberField, RichText, SelectField } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';

export default function RatFapSection({ data, set, result }) {
  const rat = useServices().repositories.regimes.rat();
  const t = useFormText();
  return (
    <>
      <div className="grid-2">
        <SelectField
          {...t.field('rat')}
          value={String(data.rat)}
          onChange={(v) => set({ rat: Number(v) })}
          options={rat.options.map((r) => ({ value: String(r), label: `${r}%` }))}
        />
        <NumberField
          {...t.field('fap', rat.fap)}
          value={data.fap}
          min={rat.fap.min}
          max={rat.fap.max}
          onChange={(v) => set({ fap: v })}
        />
      </div>
      <p className="hint" aria-live="polite">
        <RichText text={t.raw('rat', 'note')} vars={{ rat: data.rat, fap: data.fap, effective: result.rates.ratFap }} />
      </p>
      <Explainer id="ratFap" vars={{ fapMin: rat.fap.min, fapMax: rat.fap.max }} />
    </>
  );
}
