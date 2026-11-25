// Runs the same employee through every tax regime in force.
export class RegimeComparisonService {
  constructor(regimeRepository, costCalculator) {
    this.regimes = regimeRepository;
    this.calculator = costCalculator;
  }

  // Payroll relief only counts when the user's own regime can use it and they chose it; a value
  // left on from another regime would otherwise make Presumido/Real look cheaper. A regime the
  // employee cannot be hired under (MEI above the floor) gets no figures.
  compare(input, { floor } = {}) {
    const relief = Boolean(input.payrollRelief) && Boolean(this.regimes.get(input.regime)?.allowsPayrollRelief);
    return this.regimes.sameKind(input.regime).map((regime) => {
      const eligible = !(regime.salaryCappedAtFloor && floor !== undefined && input.salary > floor);
      const result = this.calculator.calculate({ ...input, regime: regime.id, payrollRelief: relief });
      return {
        id: regime.id,
        label: regime.short,
        eligible,
        monthlyTotal: eligible ? result.monthlyTotal : null,
        yearlyTotal: eligible ? result.yearlyTotal : null,
      };
    });
  }
}
