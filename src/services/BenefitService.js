// Benefits without salary nature (no INSS/FGTS): company share and employee discounts.
export class BenefitService {
  constructor(ratesRepository, regimeRepository) {
    this.rates = ratesRepository;
    this.regimes = regimeRepository;
  }

  // Domestic employers cannot discount food given at work (LC 150/2015, art. 18).
  allowsFoodDiscount(input) {
    return this.regimes?.get(input.regime).allowsFoodDiscount !== false;
  }

  allowsPlr(input) {
    return this.regimes?.get(input.regime).allowsPlr !== false;
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
    const mealEmployee = this.allowsFoodDiscount(input) ? mealGross * (input.mealDiscountPct / 100) : 0;

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
        { id: 'plr', amount: this.allowsPlr(input) ? input.plrYearly / 12 : 0 },
        { id: 'otherBenefits', amount: input.otherBenefits },
      ],
    };
  }
}
