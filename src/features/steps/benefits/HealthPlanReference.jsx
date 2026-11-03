import { RichText, SelectField, SourcesInline } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';

// ANS reference price for the health plan field. It only suggests: the user decides whether
// to copy the value into the form.
export default function HealthPlanReference({ data, set }) {
  const { healthPlans, wageFloors } = useServices();
  const t = useFormText();
  const bands = healthPlans.ageBands();
  const ref = healthPlans.lookup({ uf: data.uf, ageBand: data.employeeAgeBand, accommodation: data.healthPlanAccommodation });
  const text = (key, vars) => <RichText text={t.raw('healthPlanReference', key)} vars={vars} />;
  const stateName = wageFloors.states().find((s) => s.uf === data.uf)?.name ?? data.uf;
  const shown = ref?.state ?? ref?.national;
  const band = bands.find((b) => b.id === data.employeeAgeBand)?.label;
  const accommodation = t.text('healthPlanReference', ref?.accommodation === 'private' ? 'accommodationPrivate' : 'accommodationWard');
  const [year, month] = (ref?.reference ?? '').split('-');

  return (
    <div className="band-detail health-reference">
      <p><strong>{t.text('healthPlanReference', 'title')}</strong></p>
      <div className="grid-2">
        <SelectField
          {...t.field('employeeAgeBand')}
          value={data.employeeAgeBand}
          onChange={(v) => set({ employeeAgeBand: v })}
          options={[{ value: '', label: t.text('employeeAgeBand', 'emptyOption') }, ...bands.map((b) => ({ value: b.id, label: b.label }))]}
        />
        <SelectField
          {...t.field('healthPlanAccommodation')}
          value={data.healthPlanAccommodation}
          onChange={(v) => set({ healthPlanAccommodation: v })}
          options={[
            { value: 'ward', label: t.text('healthPlanAccommodation', 'optionWard') },
            { value: 'private', label: t.text('healthPlanAccommodation', 'optionPrivate') },
          ]}
        />
      </div>
      {shown && (
        <div aria-live="polite">
          {!ref.state && <p className="field-notice field-notice--differs">⚠ {t.text('healthPlanReference', 'noState', { uf: stateName })}</p>}
          <p>{text('summary', { ...shown, scope: ref.state ? stateName : t.text('healthPlanReference', 'brazil'), band, accommodation })}</p>
          <p>{text('range', shown)}</p>
          {ref.state && <p>{text('national', ref.national)}</p>}
          {ref.smallSample && <p className="field-notice field-notice--differs">⚠ {t.text('healthPlanReference', 'smallSample', ref.state)}</p>}
          {data.healthPlan !== shown.median && (
            <button type="button" className="btn btn--ghost" onClick={() => set({ healthPlan: shown.median })}>
              {t.text('healthPlanReference', 'useButton', { value: shown.median })}
            </button>
          )}
          <p className="hint">{t.text('healthPlanReference', 'caveat', { reference: `${month}/${year}`, range: ref.commercialRange })}</p>
          <SourcesInline sources={[{ id: ref.source }, { id: ref.weightsSource }]} />
        </div>
      )}
    </div>
  );
}
