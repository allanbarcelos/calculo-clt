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
  fpas() { return this.version('fpas'); }
  corporateIncomeTax() { return this.version('corporateIncomeTax'); }
  // null after 2026, when CBS replaces PIS/COFINS.
  pisCofinsNonCumulative() { return this.optionalVersion('pisCofinsNonCumulative'); }
  // null when no PAT incentive rule is in force.
  patIncentive() { return this.optionalVersion('patIncentive'); }
  // LC 224/2025: share of federal tax incentives kept from 2026 (null before).
  incentiveReduction() { return this.optionalVersion('incentiveReduction'); }

  // null once the payroll relief transition is over
  payrollRelief() { return this.optionalVersion('payrollRelief'); }
}
