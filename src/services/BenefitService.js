// Benefits without salary nature (no INSS/FGTS): company share and employee discounts.
export class BenefitService {
  constructor(ratesRepository) {
    this.rates = ratesRepository;
  }

  transportCap(baseSalary) {
    return baseSalary * this.rates.transportVoucher().employeeShare;
  }

  // Education aid stays free of INSS up to the greater of a share of pay or a multiple of the minimum wage.
  educationLimit(gross) {
    const rules = this.rates.educationAid();
    return Math.max(gross * rules.payShare, this.rates.minimumWage() * rules.minWageMultiple);
  }

  compute(input) {
    const transportCost = input.transportEnabled ? input.transportDays * input.transportDailyFare : 0;
    const transportEmployee = Math.min(transportCost, this.transportCap(input.salary));
    const mealGross = input.mealEnabled ? input.mealValue : 0;
    const mealEmployee = mealGross * (input.mealDiscountPct / 100);

    return {
      employeeDiscounts: { transport: transportEmployee, meal: mealEmployee },
      items: [
        { id: 'transport', amount: transportCost - transportEmployee },
        { id: 'meal', amount: mealGross - mealEmployee },
        { id: 'healthPlan', amount: input.healthPlan },
        { id: 'dentalPlan', amount: input.dentalPlan },
        { id: 'lifeInsurance', amount: input.lifeInsurance },
        { id: 'education', amount: input.education },
        { id: 'childcare', amount: input.childcare ?? 0 },
        { id: 'pension', amount: input.pension },
        { id: 'plr', amount: input.plrYearly / 12 },
        { id: 'otherBenefits', amount: input.otherBenefits },
      ],
    };
  }
}
