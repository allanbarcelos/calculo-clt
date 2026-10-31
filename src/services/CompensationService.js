// Gross pay: base salary, legal allowances, overtime, night work and DSR.
export class CompensationService {
  constructor(ratesRepository, hazardRepository) {
    this.rates = ratesRepository;
    this.hazards = hazardRepository;
  }

  hourlyRate(input) {
    const { base, insalubrity, hazard } = this.allowances(input);
    return (base + insalubrity + hazard) / this.rates.workweekDivisor(input.weeklyHours);
  }

  // Insalubrity is calculated on the minimum wage (CLT art. 192) unless a collective
  // agreement sets the salary floor as its base.
  insalubrityBase(input) {
    return input.insalubrityBase === 'salary' ? input.salary : this.rates.minimumWage();
  }

  allowances(input) {
    const base = input.salary;
    const insalubrity = this.insalubrityBase(input) * (input.insalubrity / 100);
    const hazard = input.hazard ? base * this.hazards.hazardPay().rate : 0;
    return { base, insalubrity, hazard };
  }

  compute(input) {
    const { base, insalubrity, hazard } = this.allowances(input);
    const hourly = this.hourlyRate(input);
    const overtimeRules = this.rates.overtime();
    const night = this.rates.nightWorkType(input.nightType);
    // Night hours are entered as clock hours; a shorter night hour means more paid hours.
    const nightFactor = 60 / night.hourMinutes;

    const overtime = input.overtimeHours * hourly * (1 + input.overtimeRate / 100);
    const restDayOvertime = input.restDayOvertimeHours * hourly * (1 + overtimeRules.restDayRate / 100);
    const nightPaidHours = input.nightHours * nightFactor;
    const nightPremium = nightPaidHours * hourly * night.rate;
    // Night overtime stacks both: the overtime rate applies over the hour already raised by the night rate.
    const nightOvertimePaidHours = input.nightOvertimeHours * nightFactor;
    const nightOvertime = nightOvertimePaidHours * hourly * (1 + night.rate) * (1 + input.overtimeRate / 100);
    const dsr = (overtime + restDayOvertime + nightPremium + nightOvertime) * overtimeRules.dsrFactor;
    const gross = base + insalubrity + hazard + overtime + restDayOvertime + nightPremium + nightOvertime + dsr;

    return {
      hourly,
      gross,
      items: [
        { id: 'base', amount: base },
        {
          id: 'insalubrity',
          labelKey: input.insalubrityBase === 'salary' ? 'insalubritySalaryBase' : 'insalubrity',
          amount: insalubrity,
          params: { grade: input.insalubrity },
        },
        { id: 'hazard', amount: hazard, params: { rate: this.hazards.hazardPay().rate } },
        { id: 'overtime', amount: overtime, params: { hours: input.overtimeHours, rate: input.overtimeRate } },
        { id: 'restDay', amount: restDayOvertime, params: { hours: input.restDayOvertimeHours, rate: overtimeRules.restDayRate } },
        { id: 'night', amount: nightPremium, params: { clockHours: input.nightHours, paidHours: nightPaidHours, rate: night.rate } },
        {
          id: 'nightOvertime',
          amount: nightOvertime,
          params: { clockHours: input.nightOvertimeHours, paidHours: nightOvertimePaidHours, nightRate: night.rate, overtimeRate: input.overtimeRate },
        },
        { id: 'dsr', amount: dsr },
      ],
    };
  }
}
