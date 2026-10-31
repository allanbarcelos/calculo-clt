// Runs the same employee through every tax regime in force.
export class RegimeComparisonService {
  constructor(regimeRepository, costCalculator) {
    this.regimes = regimeRepository;
    this.calculator = costCalculator;
  }

  compare(input) {
    return this.regimes.list().map((regime) => {
      const result = this.calculator.calculate({ ...input, regime: regime.id });
      return { id: regime.id, label: regime.short, monthlyTotal: result.monthlyTotal, yearlyTotal: result.yearlyTotal };
    });
  }
}
