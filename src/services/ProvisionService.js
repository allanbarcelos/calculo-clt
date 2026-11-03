// Monthly accruals: 13th salary, vacation + 1/3, FGTS fine and paid notice reserves.
const THIRTEENTH = 1 / 12;
const VACATION = 1 / 12;
const VACATION_BONUS = 1 / 36;
export const ACCRUAL_FACTOR = THIRTEENTH + VACATION + VACATION_BONUS;

export class ProvisionService {
  constructor(ratesRepository, employerChargesService, contractService) {
    this.rates = ratesRepository;
    this.charges = employerChargesService;
    this.contract = contractService;
  }

  // Paid notice (aviso prévio indenizado): days grow with tenure. Charges per item:
  // notice pay → FGTS (and its fine), no INSS; its 13th salary → FGTS and employer INSS;
  // indemnified vacation + 1/3 → neither.
  noticeReserve(input) {
    const rules = this.rates.notice();
    const fgts = this.contract.fgts(input);
    const years = Math.max(0, input.expectedTenureYears);
    // An apprentice contract ends on its term: there is no notice to provision.
    if (!this.contract.noticeApplies(input)) return { days: 0, months: Math.max(1, years * 12), totalPerReal: 0, monthlyPerReal: 0 };
    const days = Math.min(rules.maxDays, rules.baseDays + rules.daysPerYear * Math.floor(years));
    const months = Math.max(1, years * 12);
    const fgtsShare = fgts.monthlyRate * (1 + (input.includeTerminationReserve ? fgts.terminationFine : 0));
    const noticeMonths = days / 30;
    const totalPerReal =
      noticeMonths * (1 + fgtsShare) +
      noticeMonths * THIRTEENTH * (1 + fgtsShare + this.charges.rates(input).onThirteenth) +
      noticeMonths * (VACATION + VACATION_BONUS);
    return { days, months, totalPerReal, monthlyPerReal: input.includeNoticeReserve ? totalPerReal / months : 0 };
  }

  // What each R$ 1 of salary really costs the company.
  costPerSalaryReal(input) {
    const { total, onThirteenth } = this.charges.rates(input);
    const fgts = this.contract.fgts(input);
    const withAccruals = 1 + ACCRUAL_FACTOR;
    const termination = input.includeTerminationReserve ? fgts.terminationFine * fgts.monthlyRate * withAccruals : 0;
    const employerCharges = (1 + VACATION + VACATION_BONUS) * total + THIRTEENTH * onThirteenth;
    return withAccruals * (1 + fgts.monthlyRate) + employerCharges + termination + this.noticeReserve(input).monthlyPerReal;
  }

  compute(gross, input) {
    const rates = this.charges.rates(input);
    const fgts = this.contract.fgts(input);
    const thirteenth = gross * THIRTEENTH;
    const vacation = gross * VACATION;
    const vacationBonus = gross * VACATION_BONUS;
    const accrualFgts = (thirteenth + vacation + vacationBonus) * fgts.monthlyRate;
    const accrualCharges = (vacation + vacationBonus) * rates.total + thirteenth * rates.onThirteenth;
    const monthlyFgts = gross * fgts.monthlyRate;
    const terminationFine = input.includeTerminationReserve ? fgts.terminationFine * (monthlyFgts + accrualFgts) : 0;
    const notice = this.noticeReserve(input);
    const noticeMonthly = gross * notice.monthlyPerReal;

    return {
      notice: { days: notice.days, total: gross * notice.totalPerReal, monthly: noticeMonthly },
      items: [
        { id: 'thirteenth', amount: thirteenth },
        { id: 'vacation', amount: vacation },
        { id: 'vacationBonus', amount: vacationBonus },
        { id: 'accrualFgts', amount: accrualFgts },
        { id: 'accrualCharges', amount: accrualCharges },
        { id: 'terminationFine', amount: terminationFine, params: { rate: fgts.terminationFine } },
        { id: 'notice', amount: noticeMonthly, params: { days: notice.days } },
      ],
    };
  }

  // FGTS fine owed after one year, for the explanatory text.
  terminationFineAfterOneYear(gross, input = {}) {
    const fgts = this.contract.fgts(input);
    return gross * fgts.monthlyRate * (1 + ACCRUAL_FACTOR) * 12 * fgts.terminationFine;
  }
}
