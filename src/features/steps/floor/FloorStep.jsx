import { NumberField, SelectField, SourcesInline, Toggle } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';
import AgreementSection from './AgreementSection.jsx';
import BandDetail from './BandDetail.jsx';
import ContractTypeSection from './ContractTypeSection.jsx';
import FloorSummary from './FloorSummary.jsx';
import StateFloorInfo from './StateFloorInfo.jsx';

export default function FloorStep({ data, set }) {
  const { wageFloors, agreements, formDefaults, contract } = useServices();
  const t = useFormText();
  const state = wageFloors.stateFloor(data.uf);
  const floor = wageFloors.resolve(data);
  const band = wageFloors.findBand(data.uf, data.bandId, data.weeklyHours);
  const agreementSelected = Boolean(agreements.selection(data));
  const apprentice = contract.isApprentice(data);

  const applyFloor = (patch) => set(wageFloors.floorPatch(data, patch));

  const bandOption = (b) => ({ value: b.id, label: t.text('band', 'option', b) });
  const bandOptions = [
    { value: '', label: t.text('band', 'emptyOption') },
    ...(state?.bands ?? []).map(bandOption),
    ...wageFloors.federalFloors(data.weeklyHours).map(bandOption),
  ];

  return (
    <>
      <ContractTypeSection data={data} set={set} />
      <SelectField
        {...t.field('state')}
        value={data.uf}
        onChange={(uf) => set(wageFloors.statePatch(data, uf, formDefaults.defaults()))}
        options={wageFloors.states().map((s) => ({
          value: s.uf,
          label: t.text('state', wageFloors.stateFloor(s.uf) ? 'optionWithFloor' : 'option', s),
        }))}
      />

      <AgreementSection data={data} set={set} />

      {!agreementSelected && (
        <>
          {!apprentice && (
            <>
              <StateFloorInfo uf={data.uf} />
              <SelectField {...t.field('band')} value={data.bandId} onChange={(bandId) => applyFloor({ bandId })} options={bandOptions} />
              <BandDetail band={band} />
            </>
          )}

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
