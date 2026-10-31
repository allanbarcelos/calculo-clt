import { VersionedRepository } from './VersionedRepository.js';

export class RatesRepository extends VersionedRepository {
  minimumWage() { return this.version('minimumWage').value; }
  fgts() { return this.version('fgts'); }
  inssEmployee() { return this.version('inssEmployee'); }
  familyAllowance() { return this.version('familyAllowance'); }
  irrf() { return this.version('irrf'); }
  workweek() { return this.version('workweek'); }
  overtime() { return this.version('overtime'); }
  nightWork() { return this.version('nightWork'); }
  transportVoucher() { return this.version('transportVoucher'); }
  mealVoucher() { return this.version('mealVoucher'); }
  educationAid() { return this.version('educationAid'); }
  notice() { return this.version('notice'); }

  nightWorkType(id) {
    const { types } = this.nightWork();
    return types.find((t) => t.id === id) ?? types[0];
  }

  workweekDivisor(hours) {
    const { options } = this.workweek();
    return (options.find((o) => o.hours === hours) ?? options[0]).divisor;
  }
}
