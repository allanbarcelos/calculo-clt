import { ChoiceGroup, ContentCallout, Explainer } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';

// Standard CLT contract or apprentice. Switching updates the workweek and the floor.
export default function ContractTypeSection({ data, set }) {
  const { contract, wageFloors, repositories } = useServices();
  const t = useFormText();
  const rules = contract.apprentice();
  const field = t.field('contractType');
  const apprentice = contract.isApprentice(data);
  const hours = repositories.rates.workweekDivisor(data.weeklyHours);

  return (
    <>
      <ChoiceGroup
        legend={field.label}
        hint={field.hint}
        name="contractType"
        value={data.contractType}
        onChange={(v) => set(wageFloors.floorPatch(data, contract.switchPatch(data, v)))}
        options={[
          { value: 'standard', label: t.text('contractType', 'optionStandard'), description: t.text('contractType', 'descStandard') },
          { value: 'apprentice', label: t.text('contractType', 'optionApprentice'), description: t.text('contractType', 'descApprentice', rules) },
        ]}
      />
      {apprentice && (
        <ContentCallout
          id="apprenticeFloor"
          vars={{
            floor: contract.apprenticeFloor(data.weeklyHours),
            hourly: repositories.rates.minimumWage() / rules.minimumWageDivisor,
            hours,
            weeklyHours: data.weeklyHours,
          }}
        />
      )}
      <Explainer id="apprentice" vars={rules} />
    </>
  );
}
