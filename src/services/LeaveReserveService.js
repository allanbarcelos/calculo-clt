// Expected monthly cost of covering legal leaves (maternity/adoption, paternity, sickness).
// Every parameter (event rates, durations, who pays) comes from federal-rates.json.
export const FAMILY_PROFILES = ['female', 'male', 'unknown'];

export class LeaveReserveService {
  constructor(ratesRepository, provisionService, benefitService) {
    this.rates = ratesRepository;
    this.provisions = provisionService;
    this.benefits = benefitService;
  }

  // Annual chance of a maternity (or adoption) and of a paternity event for one employee.
  // AEPS counts maternity awards over all contributors. For a woman the rate is divided by the
  // female share; for a man we assume the same number of events among male employees (proxy);
  // with unknown sex both apply over the whole workforce, which is the national average.
  eventRates(profile) {
    const s = this.rates.leaveStatistics();
    const perEmployee = s.maternityAwards / s.averageContributors;
    const femaleShare = s.femaleContributors / s.averageContributors;
    if (profile === 'female') return { maternity: perEmployee / femaleShare, paternity: 0 };
    if (profile === 'male') return { maternity: 0, paternity: perEmployee / (1 - femaleShare) };
    if (profile === 'unknown') return { maternity: perEmployee, paternity: perEmployee };
    return { maternity: 0, paternity: 0 };
  }

  sicknessRate() {
    const s = this.rates.leaveStatistics();
    return s.sicknessAwards / s.averageContributors;
  }

  durations(input) {
    const maternity = this.rates.maternityLeave();
    const paternity = this.rates.paternityLeave();
    const paternityBase = paternity.conditionalDays && input.paternity20DaysConfirmed ? paternity.conditionalDays : paternity.days;
    const extra = (rule) => (input.companyCitizen ? rule.companyCitizenExtraDays : 0);
    return {
      maternityPaid: maternity.paidBySocialSecurity ? maternity.days : 0,
      maternity: maternity.days + extra(maternity),
      maternityExtra: extra(maternity),
      paternityPaid: paternity.paidBySocialSecurity ? paternityBase : 0,
      paternity: paternityBase + extra(paternity),
      paternityExtra: extra(paternity),
      paternityConditional: Boolean(paternity.conditionalDays),
      sickness: this.rates.sicknessLeave().employerDays,
    };
  }

  // Cost of covering one month of absence, per R$ 1 of the absent employee's pay.
  // External: a temporary worker with salary, charges, accruals (no termination reserves) and
  // the same benefits. Internal: only the bonus paid to whoever takes over, with its charges.
  replacementFactor(gross, input) {
    // The temporary replacement is hired on a standard contract.
    const temporary = this.provisions.costPerSalaryReal({ ...input, contractType: 'standard', includeTerminationReserve: false, includeNoticeReserve: false });
    if (input.leaveReplacementMode === 'internal') return ((input.leaveInternalBonusRate || 0) / 100) * temporary;
    if (gross <= 0) return temporary;
    const benefits = this.benefits.compute(input).items.reduce((sum, item) => sum + item.amount, 0);
    return temporary + benefits / gross;
  }

  // Monthly amounts for a given family profile and health choice.
  amounts(gross, input, profile, includesHealth) {
    const { daysPerYear } = this.rates.leaveStatistics();
    const days = this.durations(input);
    const events = this.eventRates(profile);
    const sickness = includesHealth ? this.sicknessRate() : 0;
    const factor = this.replacementFactor(gross, input);
    const external = input.leaveReplacementMode !== 'internal';
    const hiringCost = external ? Math.max(0, input.leaveExternalHiringCost || 0) : 0;
    const share = (rate, d) => (gross * rate * d) / daysPerYear;

    return {
      maternity: share(events.maternity, days.maternity) * factor,
      paternity: share(events.paternity, days.paternity) * factor,
      health: share(sickness, days.sickness) * factor,
      // Agency/training costs per hire, spread over 12 months. Only for maternity leave: nobody
      // hires a temporary worker for a few days of paternity or the first 15 days of sickness.
      hiring: (events.maternity * hiringCost) / 12,
      // Leave pay is paid by INSS (directly for MEI employees, or advanced by the company and
      // offset against its contributions). It is already in the base salary, so it lowers the
      // yearly cost. Employer INSS on salário-maternidade is also not due (STF, Tema 72).
      reimbursement: share(events.maternity, days.maternityPaid) * (1 + this.provisions.charges.rates(input).inss)
        + share(events.paternity, days.paternityPaid),
      companyCitizenExtra: share(events.maternity, days.maternityExtra) + share(events.paternity, days.paternityExtra),
      events: { ...events, sickness },
      days,
    };
  }

  // Figures quoted by the methodology text.
  statistics() {
    const s = this.rates.leaveStatistics();
    const perEmployee = s.maternityAwards / s.averageContributors;
    const femaleShare = s.femaleContributors / s.averageContributors;
    return {
      ...s,
      femaleShare,
      maternityRate: perEmployee,
      femaleRate: perEmployee / femaleShare,
      maleRate: perEmployee / (1 - femaleShare),
      sicknessRate: this.sicknessRate(),
    };
  }

  static net(a) {
    return a.maternity + a.paternity + a.health + a.hiring - a.reimbursement;
  }

  compute(gross, input) {
    const profile = FAMILY_PROFILES.includes(input.leaveFamilyProfile) ? input.leaveFamilyProfile : 'none';
    const includesHealth = Boolean(input.leaveHealthReserve);
    const a = this.amounts(gross, input, profile, includesHealth);
    const amount = LeaveReserveService.net(a);
    const percentOf = (value) => (gross > 0 ? value / gross : 0);
    const familyNet = (p) => percentOf(LeaveReserveService.net(this.amounts(gross, input, p, false)));
    const healthOnly = this.amounts(gross, input, 'none', true);

    return {
      profile,
      includesHealth,
      includesFamily: profile !== 'none',
      enabled: profile !== 'none' || includesHealth,
      coverageMode: input.leaveReplacementMode === 'internal' ? 'internal' : 'external',
      amount,
      rate: percentOf(amount),
      maternityDays: a.days.maternity,
      paternityDays: a.days.paternity,
      sicknessDays: a.days.sickness,
      paternityConditional: a.days.paternityConditional,
      companyCitizen: Boolean(input.companyCitizen) && profile !== 'none',
      events: a.events,
      statistics: this.statistics(),
      // Net rate of each choice, for the option labels.
      options: {
        female: familyNet('female'),
        male: familyNet('male'),
        unknown: familyNet('unknown'),
        health: percentOf(LeaveReserveService.net(healthOnly)),
      },
      items: [
        { id: 'leaveMaternityCoverage', amount: a.maternity, params: { days: a.days.maternity } },
        { id: 'leavePaternityCoverage', amount: a.paternity, params: { days: a.days.paternity } },
        { id: 'leaveHealthCoverage', amount: a.health, params: { days: a.days.sickness } },
        { id: 'leaveExternalHiring', amount: a.hiring },
        { id: 'leaveReimbursement', amount: -a.reimbursement },
      ],
      cashFlow: {
        reimbursement: a.reimbursement,
        companyCitizenExtraRemuneration: a.companyCitizenExtra,
        potentialIrpjDeduction: input.regime === 'real' ? a.companyCitizenExtra : 0,
      },
    };
  }
}
