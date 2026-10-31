// Employee side of the payslip: INSS, income tax and family allowance.
export class EmployeeDeductionService {
  constructor(ratesRepository) {
    this.rates = ratesRepository;
  }

  inss(gross) {
    const { ceiling, brackets } = this.rates.inssEmployee();
    const base = Math.min(gross, ceiling);
    let previous = 0;
    let total = 0;
    for (const { upTo, rate } of brackets) {
      if (base <= previous) break;
      total += (Math.min(base, upTo) - previous) * rate;
      previous = upTo;
    }
    return total;
  }

  irrf(gross, inss, dependents) {
    const table = this.rates.irrf();
    const legalDeductions = inss + dependents * table.dependentDeduction;
    const base = Math.max(0, gross - Math.max(legalDeductions, table.simplifiedDiscount));
    const bracket = table.brackets.find((b) => b.upTo === null || base <= b.upTo);
    const tax = Math.max(0, base * bracket.rate - bracket.deduct);

    const r = table.reduction;
    let reduction = 0;
    if (gross <= r.fullUpTo) reduction = r.fullAmount;
    else if (gross <= r.phaseOutUpTo) reduction = r.constant - r.factor * gross;

    return { base, taxBeforeReduction: tax, tax: Math.max(0, tax - Math.min(tax, reduction)) };
  }

  familyAllowance(gross, children) {
    const { incomeLimit, perChild } = this.rates.familyAllowance();
    return gross <= incomeLimit ? children * perChild : 0;
  }
}
