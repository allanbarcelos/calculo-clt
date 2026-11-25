import { ChoiceGroup, ContentCallout, Explainer } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';

// Companies: standard CLT contract or apprentice. Households: domestic employee or day worker.
// Switching updates the workweek and the floor.
export default function ContractTypeSection({ data, set }) {
  const { contract, wageFloors } = useServices();
  const t = useFormText();
  const rules = contract.apprentice();
  const field = t.field('contractType');
  const apprentice = contract.isApprentice(data);
  const household = contract.isHousehold(data);

  const option = {
    standard: household
      ? { label: t.text('contractType', 'optionDomestic'), description: t.text('contractType', 'descDomestic') }
      : { label: t.text('contractType', 'optionStandard'), description: t.text('contractType', 'descStandard') },
    apprentice: { label: t.text('contractType', 'optionApprentice'), description: t.text('contractType', 'descApprentice', rules) },
    dayWorker: { label: t.text('contractType', 'optionDayWorker'), description: t.text('contractType', 'descDayWorker') },
  };

  return (
    <>
      <ChoiceGroup
        legend={field.label}
        hint={household ? undefined : field.hint}
        name="contractType"
        value={data.contractType}
        onChange={(v) => set(wageFloors.floorPatch(data, contract.switchPatch(data, v)))}
        options={contract.types(data).map((value) => ({ value, ...option[value] }))}
      />
      {apprentice && (
        <ContentCallout
          id="apprenticeFloor"
          vars={{
            floor: contract.apprenticeFloor(data.weeklyHours),
            hourly: contract.apprenticeHourly(),
            hours: contract.apprenticeMonthlyHours(data.weeklyHours),
            weeklyHours: data.weeklyHours,
          }}
        />
      )}
      {contract.isDayWorker(data) && <ContentCallout id="dayWorkerRules" />}
      {!household && <Explainer id="apprentice" vars={rules} />}
    </>
  );
}
