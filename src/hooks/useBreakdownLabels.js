import { useServices } from './useServices.js';
import { fillTemplate } from '../lib/template.js';

// Turns calculator item ids into the labels stored in content.json.
export function useBreakdownLabels() {
  const { repositories } = useServices();
  return {
    groupTitle: (id) => repositories.content.breakdownGroup(id),
    itemLabel: (item) => fillTemplate(repositories.content.breakdownItem(item.labelKey ?? item.id), item.params),
  };
}
