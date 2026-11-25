// Day worker (diarista): up to 2 days a week in the same home, with no employment bond
// (LC 150/2015, art. 1º). The cost is only the daily rate and the transport agreed.
export class DayWorkerService {
  constructor(ratesRepository) {
    this.rates = ratesRepository;
  }

  rules() { return this.rates.dayWorker(); }

  daysPerMonth(daysPerWeek) {
    return (Math.max(0, daysPerWeek || 0) * this.rules().weeksPerYear) / 12;
  }

  // More days a week than a day worker may work: it is a domestic employment.
  createsBond(input) {
    return input.dayWorkerDaysPerWeek > this.rules().maxDaysPerWeek;
  }

  compute(input) {
    const daysPerMonth = this.daysPerMonth(input.dayWorkerDaysPerWeek);
    const pay = (input.dayRate || 0) * daysPerMonth;
    const transport = (input.dayWorkerTransport || 0) * daysPerMonth;
    return {
      daysPerWeek: input.dayWorkerDaysPerWeek,
      daysPerMonth,
      pay,
      transport,
      bond: this.createsBond(input),
      payItems: [{ id: 'dayWorkerPay', amount: pay, params: { daysPerMonth, dayRate: input.dayRate } }],
      benefitItems: [{ id: 'dayWorkerTransport', amount: transport, params: { daysPerMonth, fare: input.dayWorkerTransport } }],
    };
  }
}
