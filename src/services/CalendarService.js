// Working days and paid rest days (Sundays + national holidays) of the reference year.
// The DSR on overtime and night premiums uses the yearly average: rest days ÷ working days.

// Gregorian Easter (anonymous algorithm), as a UTC date.
export function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

const DAY_MS = 86_400_000;
const iso = (date) => date.toISOString().slice(0, 10);

export class CalendarService {
  constructor(ratesRepository, referenceDate) {
    this.rates = ratesRepository;
    this.year = Number(referenceDate.slice(0, 4));
  }

  holidays(year = this.year) {
    const rules = this.rates.nationalHolidays();
    const easter = easterSunday(year).getTime();
    return [
      ...rules.fixed.map((h) => ({ date: `${year}-${h.date}`, name: h.name })),
      ...rules.easterBased.map((h) => ({ date: iso(new Date(easter + h.offset * DAY_MS)), name: h.name })),
    ].sort((a, b) => a.date.localeCompare(b.date));
  }

  yearSummary(year = this.year) {
    this.cache ??= new Map();
    if (!this.cache.has(year)) this.cache.set(year, this.computeYear(year));
    return this.cache.get(year);
  }

  computeYear(year) {
    const holidayDates = new Set(this.holidays(year).map((h) => h.date));
    let restDays = 0;
    let days = 0;
    for (let t = Date.UTC(year, 0, 1); t < Date.UTC(year + 1, 0, 1); t += DAY_MS) {
      const date = new Date(t);
      days += 1;
      if (date.getUTCDay() === 0 || holidayDates.has(iso(date))) restDays += 1;
    }
    const workingDays = days - restDays;
    return { year, days, restDays, workingDays, dsrFactor: restDays / workingDays, monthlyWorkingDays: workingDays / 12, monthlyRestDays: restDays / 12 };
  }
}
