const round = (n) => Math.round(n * 100) / 100;

function group(id, items) {
  // Credits (e.g. INSS reimbursements) are negative and stay visible.
  const visible = items.filter((i) => Math.abs(i.amount) > 0.004).map((i) => ({ ...i, amount: round(i.amount) }));
  return { id, items: visible, total: round(visible.reduce((sum, i) => sum + i.amount, 0)) };
}

// Orchestrates the specialised services into the full monthly cost of one employee.
export class CostCalculator {
  constructor({ ratesRepository, contractService, compensationService, employerChargesService, provisionService, benefitService, employeeDeductionService, leaveReserveService }) {
    this.rates = ratesRepository;
    this.contract = contractService;
    this.compensation = compensationService;
    this.charges = employerChargesService;
    this.provisions = provisionService;
    this.benefits = benefitService;
    this.deductions = employeeDeductionService;
    this.leaveReserves = leaveReserveService;
  }

  calculate(input) {
    const pay = this.compensation.compute(input);
    const { gross } = pay;
    const rates = this.charges.rates(input);
    const fgtsRate = this.contract.fgts(input).monthlyRate;
    const provisions = this.provisions.compute(gross, input);
    const benefits = this.benefits.compute(input);
    const leaveReserve = this.leaveReserves.compute(gross, input);
    // Education aid above the legal limit becomes part of the contribution base (Lei 8.212, art. 28, §9º, t).
    const educationExcess = Math.max(0, input.education - this.benefits.educationLimit(gross));

    const groups = [
      group('pay', pay.items),
      group('charges', [
        { id: 'fgts', amount: gross * fgtsRate, params: { rate: fgtsRate } },
        { id: 'inss', amount: gross * rates.inss, params: { rate: rates.inss } },
        { id: 'rat', amount: gross * rates.ratFap, params: { rate: rates.ratFap } },
        { id: 'third', amount: gross * rates.thirdParties, params: { rate: rates.thirdParties } },
        { id: 'educationExcess', amount: educationExcess * (rates.total + fgtsRate), params: { excess: educationExcess } },
      ]),
      group('accruals', provisions.items),
      group('benefits', benefits.items),
      group('other', [
        { id: 'sst', amount: input.sstYearly / 12 },
        { id: 'accounting', amount: input.accountingMonthly },
        { id: 'ppe', amount: input.ppeMonthly },
        ...leaveReserve.items,
      ]),
    ];

    const monthlyTotal = round(groups.reduce((sum, g) => sum + g.total, 0));
    const benefitsTotal = groups.find((g) => g.id === 'benefits').total;
    const costPerReal = this.provisions.costPerSalaryReal(input);
    const benefitsAsSalary = round(benefitsTotal * costPerReal);

    const inss = round(this.deductions.inss(gross));
    const irrf = this.deductions.irrf(gross, inss, input.dependents);
    const familyAllowance = this.deductions.familyAllowance(gross, input.childrenUnder14);
    const { transport, meal } = benefits.employeeDiscounts;

    return {
      rates,
      gross: round(gross),
      hourly: round(pay.hourly),
      groups,
      monthlyTotal,
      yearlyTotal: round(monthlyTotal * 12),
      hiringOneTime: input.hiringOneTime,
      multiplier: gross > 0 ? monthlyTotal / gross : 0,
      costPerReal,
      notice: { days: provisions.notice.days, total: round(provisions.notice.total), monthly: round(provisions.notice.monthly) },
      leaveReserve,
      benefitsTotal,
      benefitsAsSalary,
      benefitsSavings: round(benefitsAsSalary - benefitsTotal),
      employee: {
        gross: round(gross),
        inss,
        irrf: { tax: round(irrf.tax), taxBeforeReduction: round(irrf.taxBeforeReduction) },
        transport: round(transport),
        meal: round(meal),
        familyAllowance: round(familyAllowance),
        net: round(gross - inss - irrf.tax - transport - meal + familyAllowance),
      },
    };
  }
}
