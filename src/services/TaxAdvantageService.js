// Tax savings the company gets from this employee, outside the payroll cost. They only exist
// in Lucro Real, where salaries and benefits are deductible expenses, and depend on the
// company having taxable profit, so they are shown apart from the monthly cost.
export const PROFIT_BRACKETS = ['surcharge', 'basic', 'loss'];

export class TaxAdvantageService {
  constructor(regimeRepository, ratesRepository) {
    this.regimes = regimeRepository;
    this.rates = ratesRepository;
  }

  applies(input) { return input.regime === 'real'; }

  // Marginal IRPJ + CSLL rate on each R$ 1 of deductible expense.
  incomeTaxRate(bracket) {
    const t = this.regimes.corporateIncomeTax();
    if (bracket === 'loss') return 0;
    return t.irpj + t.csll + (bracket === 'basic' ? 0 : t.irpjSurcharge);
  }

  // null once PIS/COFINS are replaced by CBS (2027).
  // Share of IRPJ incentives kept after the LC 224/2025 cut (1 when no cut is in force).
  keptShare() {
    return this.regimes.incentiveReduction()?.keptShare ?? 1;
  }

  pisCofinsRate() {
    const r = this.regimes.pisCofinsNonCumulative();
    return r ? r.pis + r.cofins : null;
  }

  // PAT: 15% of the meal benefit straight off the IRPJ (Lei 6.321/1976), cut by 10% from 2026
  // (LC 224/2025), capped by a share of the company's IRPJ that we cannot see. No per-worker
  // limit since SC COSIT 3/2026. Only for companies registered in PAT with IRPJ to pay.
  pat(input, result) {
    const rules = this.regimes.patIncentive();
    const meal = result.groups.find((g) => g.id === 'benefits')?.items.find((i) => i.id === 'meal')?.amount ?? 0;
    if (!rules || !meal || input.realProfitBracket === 'loss') return { amount: 0, potential: 0, meal, rules };
    const rate = rules.deductionRate * this.keptShare();
    const value = meal * rate;
    return { amount: input.patRegistered ? value : 0, potential: input.patRegistered ? 0 : value, meal, rate, rules };
  }

  compute(input, result) {
    if (!this.applies(input)) return { applies: false, items: [], total: 0, net: result.monthlyTotal };
    const bracket = PROFIT_BRACKETS.includes(input.realProfitBracket) ? input.realProfitBracket : 'surcharge';
    const rate = this.incomeTaxRate(bracket);
    const benefits = result.groups.find((g) => g.id === 'benefits')?.items ?? [];
    const other = result.groups.find((g) => g.id === 'other')?.items ?? [];
    const pisCofins = this.pisCofinsRate();
    const creditBase = input.cleaningServicesCompany && pisCofins
      ? ['transport', 'meal'].reduce((s, id) => s + (benefits.find((i) => i.id === id)?.amount ?? 0), 0) + (other.find((i) => i.id === 'ppe')?.amount ?? 0)
      : 0;
    const pat = this.pat({ ...input, realProfitBracket: bracket }, result);
    const credit = creditBase * (pisCofins ?? 0);
    // Empresa Cidadã: the extension pay is deducted from IRPJ itself (cut by LC 224/2025), so it
    // cannot also be an IRPJ-deductible expense (Lei 11.770/2008, art. 5º). Nothing without IRPJ due.
    const companyCitizenExtra = result.leaveReserve.cashFlow.potentialIrpjDeduction;
    const companyCitizen = bracket === 'loss' ? 0 : companyCitizenExtra * this.keptShare();
    const t = this.regimes.corporateIncomeTax();
    const irpjMarginal = t.irpj + (bracket === 'surcharge' ? t.irpjSurcharge : 0);
    // PIS/COFINS credits come back to the company, so they are not a deductible expense.
    const deductible = result.monthlyTotal - credit;
    const items = [
      { id: 'incomeTaxDeduction', amount: Math.max(0, deductible * rate - (bracket === 'loss' ? 0 : companyCitizenExtra * irpjMarginal)), params: { rate, base: deductible } },
      { id: 'patIncentive', amount: pat.amount, params: { base: pat.meal, rate: pat.rate, cap: pat.rules ? pat.rules.irpjCapShare * this.keptShare() : 0 } },
      { id: 'pisCofinsCredit', amount: credit, params: { rate: pisCofins, base: creditBase } },
      { id: 'companyCitizenIrpj', amount: companyCitizen, params: { share: this.keptShare() } },
    ].filter((i) => i.amount > 0.004);
    const total = items.reduce((s, i) => s + i.amount, 0);
    return { applies: true, bracket, rate, items, total, net: result.monthlyTotal - total, pat };
  }
}
