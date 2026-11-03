// Rules that change with the type of employment contract. Today: the standard CLT contract
// and the apprentice contract (CLT arts. 428–433), which has FGTS at 2% and, when it ends on
// its term, no FGTS fine and no notice.
export const CONTRACT_TYPES = ['standard', 'apprentice'];

export class ContractService {
  constructor(ratesRepository) {
    this.rates = ratesRepository;
  }

  isApprentice(input) { return input.contractType === 'apprentice'; }

  apprentice() { return this.rates.apprentice(); }

  // FGTS deposit rate and termination fine for this contract.
  fgts(input) {
    const fgts = this.rates.fgts();
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

  // Switching contract type: apprentices start at the default apprentice workweek.
  switchPatch(data, contractType) {
    const patch = { contractType };
    if (contractType === 'apprentice') patch.weeklyHours = this.apprentice().defaultWeeklyHours;
    else if (data.contractType === 'apprentice') patch.weeklyHours = this.rates.workweek().default;
    return patch;
  }
}
