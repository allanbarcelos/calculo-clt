// Employer contributions on payroll for the chosen tax regime.
export class EmployerChargesService {
  constructor(regimeRepository) {
    this.regimes = regimeRepository;
  }

  payrollReliefAvailable(regimeId) {
    return Boolean(this.regimes.get(regimeId).allowsPayrollRelief && this.regimes.payrollRelief());
  }

  rates(input) {
    const regime = this.regimes.get(input.regime);
    const relief = input.payrollRelief && this.payrollReliefAvailable(regime.id) ? this.regimes.payrollRelief() : null;

    const inss = relief ? relief.payrollRate : regime.employerInssRate;
    const ratFap = regime.usesRatFap ? (input.rat / 100) * input.fap : 0;
    const thirdParties = regime.usesThirdParties ? input.thirdParties / 100 : 0;
    const total = inss + ratFap + thirdParties;
    const onThirteenth = relief && !relief.inssOnThirteenth ? total - inss : total;

    return { inss, ratFap, thirdParties, total, onThirteenth, relief };
  }
}
