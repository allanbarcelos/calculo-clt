import { Explainer, NumberField, SelectField, Toggle } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';

const OPTION_KEYS = { none: 'optionNone', female: 'optionFemale', male: 'optionMale', unknown: 'optionUnknown' };

// Optional reserve for maternity/paternity and sickness leaves. Every rate is computed
// by LeaveReserveService from official statistics; the user only picks the scenario.
export default function LeaveReserveSection({ data, set, result }) {
  const t = useFormText();
  const leave = result.leaveReserve;
  const { options } = leave;
  const internal = data.leaveReplacementMode === 'internal';
  const enable = (on) => set(on
    ? { leaveFamilyProfile: 'unknown', leaveHealthReserve: true }
    : { leaveFamilyProfile: 'none', leaveHealthReserve: false });

  const familyOptions = Object.entries(OPTION_KEYS).map(([value, key]) => ({
    value,
    label: t.text('leaveFamilyProfile', key, {
      rate: options[value],
      days: value === 'female' ? leave.maternityDays : leave.paternityDays,
    }),
  }));

  return (
    <fieldset className="subsection">
      <legend>{t.section('leaveReserve')}</legend>
      <Toggle {...t.field('leaveReserveEnabled')} checked={leave.enabled} onChange={enable} />
      {leave.enabled && (
        <>
          <SelectField
            {...t.field('leaveFamilyProfile')}
            value={leave.profile}
            options={familyOptions}
            onChange={(v) => set({ leaveFamilyProfile: v })}
          />
          <Toggle
            {...t.field('leaveHealthReserve', { rate: options.health, days: leave.sicknessDays })}
            checked={leave.includesHealth}
            onChange={(v) => set({ leaveHealthReserve: v })}
          />
          {leave.includesFamily && (
            <Toggle {...t.field('companyCitizen')} checked={data.companyCitizen} onChange={(v) => set({ companyCitizen: v })} />
          )}
          {leave.includesFamily && leave.paternityConditional && leave.profile !== 'female' && (
            <Toggle
              {...t.field('paternity20DaysConfirmed', { days: leave.paternityDays })}
              checked={data.paternity20DaysConfirmed}
              onChange={(v) => set({ paternity20DaysConfirmed: v })}
            />
          )}
          <SelectField
            {...t.field('leaveReplacementMode')}
            value={internal ? 'internal' : 'external'}
            options={[
              { value: 'external', label: t.text('leaveReplacementMode', 'optionExternal') },
              { value: 'internal', label: t.text('leaveReplacementMode', 'optionInternal') },
            ]}
            onChange={(v) => set({ leaveReplacementMode: v })}
          />
          {internal ? (
            <NumberField
              {...t.field('leaveInternalBonusRate')}
              value={data.leaveInternalBonusRate}
              max={100}
              onChange={(v) => set({ leaveInternalBonusRate: v })}
            />
          ) : (
            <NumberField
              {...t.field('leaveExternalHiringCost')}
              value={data.leaveExternalHiringCost}
              onChange={(v) => set({ leaveExternalHiringCost: v })}
            />
          )}
          <Explainer id="leaveMethod" vars={leave.statistics} />
        </>
      )}
    </fieldset>
  );
}
