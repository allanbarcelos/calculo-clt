// Reference monthly price of an employer health plan for one person, by state, age band and
// accommodation. A reference to help fill the form, never the contracted price.
export class HealthPlanReferenceService {
  constructor(healthPlanRepository) {
    this.plans = healthPlanRepository;
  }

  ageBands() { return this.plans.ageBands(); }

  stats(values) {
    if (!values) return null;
    const [low, median, high, plans, beneficiaries] = values;
    return { low, median, high, plans, beneficiaries };
  }

  // null until the age band is known; state figures fall back to Brazil when missing.
  lookup({ uf, ageBand, accommodation }) {
    if (!ageBand) return null;
    const reference = this.plans.reference();
    const kind = accommodation === 'private' ? 'private' : 'ward';
    const pick = (scope) => this.stats(reference.values[scope]?.[kind]?.[ageBand]);
    const national = pick('BR');
    const state = pick(uf);
    return {
      reference: reference.reference,
      source: reference.source,
      weightsSource: reference.weightsSource,
      accommodation: kind,
      state,
      national,
      smallSample: Boolean(state) && state.beneficiaries < this.plans.smallSampleBeneficiaries(),
      commercialRange: this.plans.commercialRange(),
    };
  }
}
