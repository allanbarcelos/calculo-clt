import { ContentCallout } from '../../../components/ui';
import { useServices } from '../../../hooks/useServices.js';

export default function StateFloorInfo({ uf }) {
  const { wageFloors, repositories } = useServices();
  const state = wageFloors.stateFloor(uf);
  const minimumWage = repositories.rates.minimumWage();

  if (!state) return <ContentCallout id="noStateFloor" vars={{ minimumWage }} />;
  return (
    <ContentCallout
      id={state.outdated ? 'stateFloorOutdated' : 'stateFloor'}
      vars={{ ...state, minimumWage, sourceTitle: repositories.sources.get(state.source).title }}
    />
  );
}
