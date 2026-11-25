// Monthly accruals: 13th salary, vacation bonus (1/3), FGTS fine, vacation paid at termination,
// paid notice and, optionally, the cost of covering the vacation month.
//
// The monthly gross already counts 12 salaries a year. In the vacation month the employee is
// paid the vacation (that month's salary + 1/3) instead of the salary, so the only extra pay
// is the 1/3 bonus: 11 salaries + vacation (1 + 1/3) + 13th = 13,33 salaries a year
// (CLT arts. 129, 142 and 7º, XVII of the Constitution). FGTS and INSS on the vacation month's
// salary are already in the monthly charges. A full extra month only exists if someone covers
// the absence (optional item) or if vacation is paid out at termination without being taken.
const THIRTEENTH = 1 / 12;
const VACATION = 1 / 12;
const VACATION_BONUS = 1 / 36;
export const ACCRUAL_FACTOR = THIRTEENTH + VACATION_BONUS;
// Each vacation is assumed to be taken halfway through its 12-month granting period
// (CLT art. 134), i.e. 6 months after it is earned.
const VACATION_TAKEN_AFTER_MONTHS = 6;

export class ProvisionService {
  constructor(ratesRepository, employerChargesService, contractService) {
    this.rates = ratesRepository;
    this.charges = employerChargesService;
    this.contract = contractService;
  }

  // Expected tenure in years. An empty or zero field (e.g. while typing) means the default year.
  tenureYears(input) {
    const years = Number(input.expectedTenureYears);
    return Number.isFinite(years) && years > 0 ? years : 1;
  }

  tenureMonths(input) {
    return Math.max(1, this.tenureYears(input) * 12);
  }

  // Vacation still owed when the contract ends, in salaries: the proportional twelfths of the
  // period in progress (a fraction of 15 days or more counts as a month, CLT art. 146) plus the
  // last complete period when it has not been taken yet.
  unusedVacation(input) {
    const months = this.tenureMonths(input);
    const complete = Math.floor(months / 12 + 1e-9);
    const remainder = months - complete * 12;
    const pending = complete >= 1 && remainder < VACATION_TAKEN_AFTER_MONTHS ? 1 : 0;
    return pending + Math.round(remainder) / 12;
  }

  // Paid notice (aviso prévio indenizado): days grow with tenure. Charges per item:
  // notice pay → FGTS (and its fine), no INSS; its 13th salary → FGTS and employer INSS;
  // indemnified vacation + 1/3 on the notice period → neither.
  noticeReserve(input) {
    const rules = this.rates.notice();
    const fgts = this.contract.fgts(input);
    const years = this.tenureYears(input);
    const months = this.tenureMonths(input);
    // An apprentice contract ends on its term: there is no notice to provision.
    if (!this.contract.noticeApplies(input)) return { days: 0, months, totalPerReal: 0, monthlyPerReal: 0 };
    const days = Math.min(rules.maxDays, rules.baseDays + rules.daysPerYear * Math.floor(years));
    const fgtsShare = fgts.monthlyRate * (1 + (input.includeTerminationReserve ? fgts.terminationFine : 0));
    const noticeMonths = days / 30;
    // 13th and vacation count twelfths: a fraction of 15 days or more is a full month.
    const twelfths = Math.floor(days / 30) + (days % 30 >= 15 ? 1 : 0);
    const totalPerReal =
      noticeMonths * (1 + fgtsShare) +
      twelfths * THIRTEENTH * (1 + fgtsShare + this.charges.rates(input).onThirteenth) +
      twelfths * (VACATION + VACATION_BONUS);
    return { days, months, totalPerReal, monthlyPerReal: input.includeNoticeReserve ? totalPerReal / months : 0 };
  }

  // Vacation paid out at the end of the contract, spread over the tenure. Only the vacation pay
  // itself is new cost: its 1/3 is already accrued every month. Paid out, neither has FGTS or
  // INSS (TST OJ 195 SDI-1; Lei 8.212/1991, art. 28, §9º, "d"), so the charges accrued on that
  // 1/3 come off.
  terminationVacationPerReal(input) {
    if (!input.includeTerminationReserve) return 0;
    const owed = this.unusedVacation(input);
    const fgts = this.contract.fgts(input);
    const chargesOnBonus = fgts.monthlyRate * (1 + fgts.terminationFine) + this.charges.rates(input).total;
    return (owed - (owed / 3) * chargesOnBonus) / this.tenureMonths(input);
  }

  // Someone covering the employee during the vacation month: one month of a standard
  // employee's loaded cost per year.
  vacationCoverPerReal(input) {
    if (!input.includeVacationCover) return 0;
    const cover = { ...input, contractType: 'standard', includeTerminationReserve: false, includeNoticeReserve: false, includeVacationCover: false };
    return this.costPerSalaryReal(cover) / 12;
  }

  // What each R$ 1 of salary really costs the company.
  costPerSalaryReal(input) {
    const { total, onThirteenth } = this.charges.rates(input);
    const fgts = this.contract.fgts(input);
    const withAccruals = 1 + ACCRUAL_FACTOR;
    const termination = input.includeTerminationReserve ? fgts.terminationFine * fgts.monthlyRate * withAccruals : 0;
    const employerCharges = (1 + VACATION_BONUS) * total + THIRTEENTH * onThirteenth;
    return withAccruals * (1 + fgts.monthlyRate) + employerCharges + termination
      + this.terminationVacationPerReal(input) + this.noticeReserve(input).monthlyPerReal + this.vacationCoverPerReal(input);
  }

  compute(gross, input) {
    const rates = this.charges.rates(input);
    const fgts = this.contract.fgts(input);
    const thirteenth = gross * THIRTEENTH;
    const vacationBonus = gross * VACATION_BONUS;
    const accrualFgts = (thirteenth + vacationBonus) * fgts.monthlyRate;
    const accrualCharges = vacationBonus * rates.total + thirteenth * rates.onThirteenth;
    const monthlyFgts = gross * fgts.monthlyRate;
    const terminationFine = input.includeTerminationReserve ? fgts.terminationFine * (monthlyFgts + accrualFgts) : 0;
    const notice = this.noticeReserve(input);
    const noticeMonthly = gross * notice.monthlyPerReal;

    return {
      notice: { days: notice.days, total: gross * notice.totalPerReal, monthly: noticeMonthly },
      items: [
        { id: 'thirteenth', amount: thirteenth },
        { id: 'vacationBonus', amount: vacationBonus },
        { id: 'accrualFgts', amount: accrualFgts },
        { id: 'accrualCharges', amount: accrualCharges },
        { id: 'terminationFine', amount: terminationFine, params: { rate: fgts.terminationFine } },
        { id: 'terminationVacation', amount: gross * this.terminationVacationPerReal(input), params: { months: this.tenureMonths(input), owed: this.unusedVacation(input) } },
        { id: 'notice', amount: noticeMonthly, params: { days: notice.days } },
        { id: 'vacationCover', amount: gross * this.vacationCoverPerReal(input) },
      ],
    };
  }

  // FGTS fine owed after one year, for the explanatory text: 12 salaries + 13th of deposits
  // (the first vacation and its 1/3 are only paid in the following year).
  terminationFineAfterOneYear(gross, input = {}) {
    const fgts = this.contract.fgts(input);
    return gross * fgts.monthlyRate * (12 + 1) * fgts.terminationFine;
  }
}
