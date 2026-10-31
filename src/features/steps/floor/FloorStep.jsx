import { NumberField, SelectField, SourcesInline, Toggle } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';
import AgreementSection from './AgreementSection.jsx';
import BandDetail from './BandDetail.jsx';
import FloorSummary from './FloorSummary.jsx';
import StateFloorInfo from './StateFloorInfo.jsx';

export default function FloorStep({ data, set }) {
  const { wageFloors, agreements, formDefaults } = useServices();
  const t = useFormText();
  const state = wageFloors.stateFloor(data.uf);
  const floor = wageFloors.resolve(data);
  const band = wageFloors.findBand(data.uf, data.bandId);
  const agreementSelected = Boolean(agreements.selection(data));

  // Picking a band or a manual agreement floor fills the salary with that floor and starts
  // the calculation. Clearing it undoes a salary we filled, but keeps one the user typed.
  const applyFloor = (patch) => {
    const next = { ...data, ...patch };
    const hasDefinedFloor = Boolean(next.bandId) || (next.hasAgreementFloor && next.agreementFloor > 0) || Boolean(agreements.selection(next)?.role);
    if (hasDefinedFloor) set({ ...patch, salary: wageFloors.resolve(next).value, salaryAuto: true });
    else set(data.salaryAuto ? { ...patch, salary: 0, salaryAuto: false } : patch);
  };

  const bandOption = (b) => ({ value: b.id, label: t.text('band', 'option', b) });
  const bandOptions = [
    { value: '', label: t.text('band', 'emptyOption') },
    ...(state?.bands ?? []).map(bandOption),
    ...wageFloors.federalFloors().map(bandOption),
  ];

  return (
    <>
      <SelectField
        {...t.field('state')}
        value={data.uf}
        onChange={(uf) => {
          const patch = { uf, bandId: wageFloors.isFederalBand(data.bandId) ? data.bandId : '' };
          // An agreement that does not cover the new state is undone.
          const keepsAgreement = agreements.forState(uf).some((a) => a.id === data.agreementId);
          applyFloor(keepsAgreement ? patch : { ...agreements.revertPatch(data, formDefaults.defaults()), ...patch });
        }}
        options={wageFloors.states().map((s) => ({
          value: s.uf,
          label: t.text('state', wageFloors.stateFloor(s.uf) ? 'optionWithFloor' : 'option', s),
        }))}
      />

      <AgreementSection data={data} set={set} />

      {!agreementSelected && (
        <>
          <StateFloorInfo uf={data.uf} />
          <SelectField {...t.field('band')} value={data.bandId} onChange={(bandId) => applyFloor({ bandId })} options={bandOptions} />
          <BandDetail band={band} />

          <Toggle {...t.field('hasAgreementFloor')} checked={data.hasAgreementFloor} onChange={(v) => applyFloor({ hasAgreementFloor: v })} />
          {data.hasAgreementFloor && (
            <NumberField {...t.field('agreementFloor')} value={data.agreementFloor} onChange={(v) => applyFloor({ agreementFloor: v })} />
          )}
          <SourcesInline prefix={t.text('agreementFloor', 'sourcesPrefix')} sources={[{ id: 'mediador' }, { id: 'statePisosLaw' }]} />
        </>
      )}

      <FloorSummary floor={floor} salaryAdjusted={data.salary > 0 && data.salaryAuto} />
    </>
  );
}
