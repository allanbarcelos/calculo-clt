// The only module that knows where the data lives. Swap it (API, CMS, test fixture)
// without touching repositories or services.
import collectiveAgreements from '../db/collective-agreements.json';
import content from '../db/content.json';
import federalRates from '../db/federal-rates.json';
import formText from '../db/form-text.json';
import meta from '../db/meta.json';
import occupationalHazards from '../db/occupational-hazards.json';
import sources from '../db/sources.json';
import taxRegimes from '../db/tax-regimes.json';
import wageFloors from '../db/wage-floors.json';

export const jsonDatabase = {
  meta,
  federalRates,
  taxRegimes,
  wageFloors,
  occupationalHazards,
  sources,
  content,
  formText,
  collectiveAgreements,
};
