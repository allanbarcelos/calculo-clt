// Initial form values. Rule-driven defaults come from the database; everything that
// costs money starts at zero so the estimate only begins once the user provides data.
export class FormDefaultsService {
  constructor({ ratesRepository, regimeRepository, wageFloorRepository }) {
    this.rates = ratesRepository;
    this.regimes = regimeRepository;
    this.floors = wageFloorRepository;
  }

  defaults() {
    const rat = this.regimes.rat();
    return {
      regime: this.regimes.defaultId(),
      rat: rat.default,
      fap: rat.fap.default,
      fpas: this.regimes.fpas().default,
      thirdParties: this.regimes.thirdParties().default,
      payrollRelief: false,
      realProfitBracket: 'surcharge',
      cleaningServicesCompany: false,
      patRegistered: false,
      uf: this.floors.defaultState(),
      bandId: '',
      agreementId: '',
      agreementRoleId: '',
      hasAgreementFloor: false,
      agreementFloor: 0,
      // 0 = calculation not started. It starts on the "Salário" step or when a floor is picked.
      salary: 0,
      // true while the salary was filled from the legal floor and not typed by the user
      salaryAuto: false,
      contractType: 'standard',
      weeklyHours: this.rates.workweek().default,
      insalubrity: 0,
      insalubrityBase: 'minimumWage',
      hazard: false,
      overtimeHours: 0,
      overtimeRate: this.rates.overtime().minRate,
      restDayOvertimeHours: 0,
      nightType: this.rates.nightWork().default,
      nightHours: 0,
      nightOvertimeHours: 0,
      dependents: 0,
      childrenUnder14: 0,
      transportEnabled: false,
      transportDays: this.rates.transportVoucher().defaultDays,
      transportDailyFare: 0,
      mealEnabled: false,
      mealValue: 0,
      mealDiscountPct: 0,
      healthPlan: 0,
      employeeAgeBand: '',
      healthPlanAccommodation: 'ward',
      dentalPlan: 0,
      lifeInsurance: 0,
      education: 0,
      childcare: 0,
      pension: 0,
      otherBenefits: 0,
      plrYearly: 0,
      includeTerminationReserve: true,
      includeNoticeReserve: false,
      includeVacationCover: false,
      expectedTenureYears: 1,
      sstYearly: 0,
      accountingMonthly: 0,
      ppeMonthly: 0,
      leaveFamilyProfile: 'none',
      leaveHealthReserve: false,
      leaveReplacementMode: 'external',
      leaveInternalBonusRate: 0,
      leaveExternalHiringCost: 0,
      companyCitizen: false,
      paternity20DaysConfirmed: false,
      hiringOneTime: 0,
    };
  }
}
