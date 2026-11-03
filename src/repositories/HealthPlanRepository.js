import { VersionedRepository } from './VersionedRepository.js';

// ANS reference prices of employer health plans (see scripts/update-health-plan-prices.mjs).
export class HealthPlanRepository extends VersionedRepository {
  ageBands() { return this.section.ageBands; }
  reference() { return this.version('references'); }
  commercialRange() { return this.section.commercialRange; }
  smallSampleBeneficiaries() { return this.section.smallSampleBeneficiaries; }
}
