import { VersionedRepository } from './VersionedRepository.js';

export class RegimeRepository extends VersionedRepository {
  list() { return this.collection('regimes'); }

  get(id) {
    const regimes = this.list();
    return regimes.find((r) => r.id === id) ?? regimes.find((r) => r.id === this.section.defaultRegime) ?? regimes[0];
  }

  defaultId() { return this.section.defaultRegime; }
  rat() { return this.version('rat'); }
  thirdParties() { return this.version('thirdParties'); }
  simplesRules() { return this.version('simplesRules'); }

  // null once the payroll relief transition is over
  payrollRelief() { return this.optionalVersion('payrollRelief'); }
}
