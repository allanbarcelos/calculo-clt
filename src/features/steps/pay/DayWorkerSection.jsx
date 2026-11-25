import { ContentCallout, NumberField } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';

// Day worker (diarista): daily rate, days a week and transport. No payroll fields.
export default function DayWorkerSection({ data, set }) {
  const { dayWorker, wageFloors } = useServices();
  const t = useFormText();
  const rules = dayWorker.rules();
  // Reference only: the state floor for domestic workers (or the minimum wage) per working day.
  const referenceFloor = wageFloors.domesticBand(data.uf)?.value ?? wageFloors.resolve({ ...data, contractType: 'standard' }).value;
  const workingDays = 22;

  return (
    <>
      <NumberField
        {...t.field('dayRate', { daily: referenceFloor / workingDays, days: workingDays })}
        value={data.dayRate}
        onChange={(v) => set({ dayRate: v })}
      />
      <NumberField
        {...t.field('dayWorkerDaysPerWeek', { max: rules.maxDaysPerWeek })}
        value={data.dayWorkerDaysPerWeek}
        min={1}
        max={7}
        onChange={(v) => set({ dayWorkerDaysPerWeek: Math.round(v) })}
      />
      {dayWorker.createsBond(data) && <ContentCallout id="dayWorkerBond" vars={{ daysPerWeek: data.dayWorkerDaysPerWeek }} />}
      <NumberField {...t.field('dayWorkerTransport')} value={data.dayWorkerTransport} onChange={(v) => set({ dayWorkerTransport: v })} />
    </>
  );
}
