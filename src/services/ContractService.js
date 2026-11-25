// Rules that change with the type of contract:
// - companies: the standard CLT contract or the apprentice contract (CLT arts. 428–433), which
//   has FGTS at 2% and, when it ends on its term, no FGTS fine and no notice;
// - households (LC 150/2015): a domestic employee, with FGTS + 3,2% compensation instead of the
//   40% fine, or a day worker (diarista, up to 2 days a week), who is not an employee.
export const CONTRACT_TYPES = ['standard', 'apprentice', 'dayWorker'];

export class ContractService {
  constructor(ratesRepository, regimeRepository) {
    this.rates = ratesRepository;
    this.regimes = regimeRepository;
  }

  isHousehold(input) { return Boolean(this.regimes?.isHousehold(input.regime)); }

  isApprentice(input) { return input.contractType === 'apprentice' && !this.isHousehold(input); }

  isDayWorker(input) { return input.contractType === 'dayWorker' && this.isHousehold(input); }

  // Contract types offered for the chosen employer.
  types(input) { return this.isHousehold(input) ? ['standard', 'dayWorker'] : ['standard', 'apprentice']; }

  apprentice() { return this.rates.apprentice(); }

  dayWorkerRules() { return this.rates.dayWorker(); }

  // FGTS deposit rate and termination fine for this contract. Domestic employers deposit the
  // 3,2% compensation every month instead of paying the 40% fine (LC 150/2015, art. 22): it is
  // charged on the same base as the FGTS, so it is added to the monthly rate.
  fgts(input) {
    const fgts = this.rates.fgts();
    if (this.isHousehold(input)) {
      const compensationRate = this.regimes.get(input.regime).fgtsCompensationRate ?? 0;
      return { ...fgts, monthlyRate: fgts.monthlyRate + compensationRate, depositRate: fgts.monthlyRate, compensationRate, terminationFine: 0 };
    }
    if (!this.isApprentice(input)) return fgts;
    const rules = this.apprentice();
    return { ...fgts, monthlyRate: rules.fgtsRate, terminationFine: rules.terminationFineOnTerm ? fgts.terminationFine : 0 };
  }

  noticeApplies(input) {
    return !this.isApprentice(input) || this.apprentice().noticeOnTerm;
  }

  // Apprentices earn at least the hourly minimum wage for the hours worked (CLT art. 428, §2º).
  // MTE (Manual da Aprendizagem, q. 104): hourly × weekly hours × weeks of the month × 7/6, using
  // the 31-day month for a fixed salary, which is the most favourable to the apprentice.
  apprenticeMonthlyHours(weeklyHours) {
    const { monthDays } = this.apprentice();
    return (weeklyHours * monthDays) / 6;
  }

  apprenticeHourly() {
    return this.rates.minimumWage() / this.apprentice().minimumWageDivisor;
  }

  apprenticeFloor(weeklyHours) {
    return this.apprenticeHourly() * this.apprenticeMonthlyHours(weeklyHours);
  }

  // Things the law does not allow for apprentices, to warn the user.
  apprenticeIssues(input) {
    if (!this.isApprentice(input)) return [];
    const rules = this.apprentice();
    const issues = [];
    if (input.weeklyHours > rules.maxWeeklyHoursWithSchooling) issues.push('hours');
    else if (input.weeklyHours > rules.maxWeeklyHours) issues.push('schooling');
    if (!rules.overtimeAllowed && (input.overtimeHours > 0 || input.restDayOvertimeHours > 0 || input.nightOvertimeHours > 0)) issues.push('overtime');
    // Under-18 apprentices cannot work in unhealthy, dangerous or night conditions.
    if (input.insalubrity > 0 || input.hazard || input.nightHours > 0) issues.push('risk');
    return issues;
  }

  // A contract type the new employer does not offer falls back to the standard one.
  regimePatch(data, regime) {
    const next = { ...data, regime };
    return this.types(next).includes(data.contractType) ? { regime } : { regime, ...this.switchPatch(data, 'standard') };
  }

  // Switching contract type: apprentices start at the default apprentice workweek.
  switchPatch(data, contractType) {
    const patch = { contractType };
    if (contractType === 'apprentice') patch.weeklyHours = this.apprentice().defaultWeeklyHours;
    else if (data.contractType === 'apprentice') patch.weeklyHours = this.rates.workweek().default;
    return patch;
  }
}
