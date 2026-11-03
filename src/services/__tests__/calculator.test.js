import { describe, expect, it } from 'vitest';
import { jsonDatabase } from '../../repositories/database.js';
import { easterSunday } from '../CalendarService.js';
import { createServices } from '../container.js';

const services = createServices(jsonDatabase, '2026-10-30');
const base = { ...services.formDefaults.defaults(), salary: 1621 };
const calc = (patch) => services.calculator.calculate({ ...base, ...patch });

describe('CostCalculator — one minimum wage, termination reserve on', () => {
  it.each([
    // Checked against an independent model: 11 salaries + vacation (1 + 1/3) + 13th a year, with
    // charges, the FGTS fine and half a vacation paid at termination after 1 year.
    ['mei', 2146.93],
    ['simples', 2092.9],
    ['simplesIV', 2489.14],
    ['presumido', 2593.61],
    ['real', 2593.61],
  ])('%s costs %d per month', (regime, expected) => {
    expect(calc({ regime }).monthlyTotal).toBe(expected);
  });

  it('removes employer INSS from the 13th salary under payroll relief', () => {
    expect(calc({ regime: 'presumido', payrollRelief: true }).monthlyTotal).toBe(2399.99);
  });
});

describe('Notice reserve', () => {
  it('Simples, 1 year: 33 days', () => {
    const { notice } = calc({ includeNoticeReserve: true, expectedTenureYears: 1 });
    expect(notice).toEqual({ days: 33, total: 2346.16, monthly: 195.51 });
  });

  it('Presumido adds employer INSS on the notice 13th salary', () => {
    expect(calc({ regime: 'presumido', includeNoticeReserve: true, expectedTenureYears: 1 }).notice.total).toBe(2387.47);
  });
});

describe('Leave reserve', () => {
  const stats = services.repositories.rates.leaveStatistics();
  const perEmployee = stats.maternityAwards / stats.averageContributors;
  const femaleShare = stats.femaleContributors / stats.averageContributors;
  const temporaryFactor = (input) => services.provisions.costPerSalaryReal({ ...input, includeTerminationReserve: false, includeNoticeReserve: false });
  const item = (result, id) => result.groups.find((g) => g.id === 'other').items.find((i) => i.id === id);

  it('reads paternity leave days from the database by reference date', () => {
    const days = (date, patch = {}) => {
      const s = createServices(jsonDatabase, date);
      return s.calculator.calculate({ ...s.formDefaults.defaults(), salary: 1621, leaveFamilyProfile: 'male', ...patch }).leaveReserve.paternityDays;
    };
    expect(days('2026-10-30')).toBe(5);
    expect(days('2027-06-01')).toBe(10);
    expect(days('2028-06-01')).toBe(15);
    expect(days('2029-06-01')).toBe(15);
    expect(days('2029-06-01', { paternity20DaysConfirmed: true })).toBe(20);
  });

  it('uses the per-woman event rate for a female employee and credits the INSS reimbursement', () => {
    const result = calc({ leaveFamilyProfile: 'female' });
    const rate = perEmployee / femaleShare;
    const coverage = 1621 * rate * (120 / stats.daysPerYear) * temporaryFactor(base);
    const reimbursement = 1621 * rate * (120 / stats.daysPerYear);

    expect(item(result, 'leaveMaternityCoverage').amount).toBeCloseTo(coverage, 2);
    expect(item(result, 'leaveReimbursement').amount).toBeCloseTo(-reimbursement, 2);
    expect(result.leaveReserve.amount).toBeCloseTo(coverage - reimbursement, 6);
    expect(item(result, 'leavePaternityCoverage')).toBeUndefined();
  });

  it('uses the per-man proxy rate for a male employee; paternity pay is not reimbursed in 2026', () => {
    const result = calc({ leaveFamilyProfile: 'male' });
    const rate = perEmployee / (1 - femaleShare);
    expect(result.leaveReserve.amount).toBeCloseTo(1621 * rate * (5 / stats.daysPerYear) * temporaryFactor(base), 6);
    expect(result.leaveReserve.cashFlow.reimbursement).toBe(0);
  });

  it('averages both leaves over the whole workforce when the sex is unknown', () => {
    const result = calc({ leaveFamilyProfile: 'unknown' });
    const coverage = 1621 * perEmployee * ((120 + 5) / stats.daysPerYear) * temporaryFactor(base);
    const reimbursement = 1621 * perEmployee * (120 / stats.daysPerYear);
    expect(result.leaveReserve.amount).toBeCloseTo(coverage - reimbursement, 6);
  });

  it('labels each option with the same net rate the calculation uses', () => {
    const { options } = calc({}).leaveReserve;
    expect(options.female).toBeCloseTo(calc({ leaveFamilyProfile: 'female' }).leaveReserve.rate, 10);
    expect(options.unknown).toBeCloseTo(calc({ leaveFamilyProfile: 'unknown' }).leaveReserve.rate, 10);
    expect(options.health).toBeCloseTo(calc({ leaveHealthReserve: true }).leaveReserve.rate, 10);
  });

  it('adds Empresa Cidadã days, paid by the company and not reimbursed', () => {
    const result = calc({ regime: 'real', leaveFamilyProfile: 'unknown', companyCitizen: true });
    expect(result.leaveReserve.maternityDays).toBe(180);
    expect(result.leaveReserve.paternityDays).toBe(20);
    // Lucro Real: the reimbursed pay plus the employer INSS (20%) not due on it (STF, Tema 72).
    expect(result.leaveReserve.cashFlow.reimbursement).toBeCloseTo(1621 * perEmployee * (120 / stats.daysPerYear) * 1.2, 6);
    expect(result.leaveReserve.cashFlow.potentialIrpjDeduction).toBe(result.leaveReserve.cashFlow.companyCitizenExtraRemuneration);
    expect(calc({ regime: 'simples', leaveFamilyProfile: 'unknown', companyCitizen: true }).leaveReserve.cashFlow.potentialIrpjDeduction).toBe(0);
  });

  it('applies the chosen coverage mode to sickness leave too', () => {
    const sickness = stats.sicknessAwards / stats.averageContributors;
    const internal = calc({ leaveHealthReserve: true, leaveReplacementMode: 'internal', leaveInternalBonusRate: 20 });
    expect(internal.leaveReserve.amount).toBeCloseTo(1621 * sickness * (15 / stats.daysPerYear) * 0.2 * temporaryFactor(base), 6);
    expect(calc({ leaveHealthReserve: true, leaveReplacementMode: 'internal' }).leaveReserve.amount).toBe(0);
  });

  it('spreads the per-hire agency cost over 12 months, for maternity leave only', () => {
    const cost = 6000;
    const without = calc({ leaveFamilyProfile: 'unknown' }).leaveReserve.amount;
    const withCost = calc({ leaveFamilyProfile: 'unknown', leaveExternalHiringCost: cost }).leaveReserve.amount;
    expect(withCost - without).toBeCloseTo((perEmployee * cost) / 12, 8);
    expect(calc({ leaveFamilyProfile: 'male', leaveExternalHiringCost: cost }).leaveReserve.amount)
      .toBe(calc({ leaveFamilyProfile: 'male' }).leaveReserve.amount);
  });


  it('ignores the agency cost under internal coverage', () => {
    const a = calc({ leaveFamilyProfile: 'female', leaveReplacementMode: 'internal', leaveInternalBonusRate: 10 });
    const b = calc({ leaveFamilyProfile: 'female', leaveReplacementMode: 'internal', leaveInternalBonusRate: 10, leaveExternalHiringCost: 5000 });
    expect(b.leaveReserve.amount).toBe(a.leaveReserve.amount);
  });

  it('adds nothing when disabled, and stays finite with no salary', () => {
    const off = calc({});
    expect(off.leaveReserve.amount).toBe(0);
    expect(off.groups.find((g) => g.id === 'other').items.some((i) => i.id.startsWith('leave'))).toBe(false);
    const zero = calc({ salary: 0, leaveFamilyProfile: 'unknown', leaveHealthReserve: true, leaveExternalHiringCost: 3000 });
    expect(Number.isFinite(zero.leaveReserve.amount)).toBe(true);
    expect(zero.leaveReserve.rate).toBe(0);
  });

  it('ignores a stale Empresa Cidadã flag when no family leave is selected', () => {
    expect(calc({ leaveHealthReserve: true, companyCitizen: true }).leaveReserve.amount)
      .toBe(calc({ leaveHealthReserve: true }).leaveReserve.amount);
  });
});

describe('Night work', () => {
  const pay = (patch) => calc({ salary: 2200, ...patch }).groups.find((g) => g.id === 'pay').items;

  it('urban night hour: 7 clock hours are paid as 8', () => {
    expect(pay({ nightHours: 7 }).find((i) => i.id === 'night').amount).toBe(16);
  });

  it('night overtime stacks both premiums', () => {
    const items = pay({ nightOvertimeHours: 7 });
    expect(items.find((i) => i.id === 'nightOvertime').amount).toBe(144);
    // 2026: 60 paid rest days (52 Sundays + 8 national holidays on weekdays) over 305 working days.
    expect(items.find((i) => i.id === 'dsr').amount).toBe(28.33);
  });
});

describe('Insalubrity and hazard pay', () => {
  const pay = (patch) => calc({ salary: 3000, ...patch }).groups.find((g) => g.id === 'pay').items;

  it('pays only the larger allowance when both are selected', () => {
    const items = pay({ insalubrity: 40, hazard: true });
    expect(items.find((i) => i.id === 'hazard').amount).toBe(900);
    expect(items.find((i) => i.id === 'insalubrity')).toBeUndefined();
  });

  it('keeps insalubrity when it is worth more', () => {
    const items = pay({ salary: 1621, insalubrity: 40, insalubrityBase: 'salary', hazard: true });
    expect(items.find((i) => i.id === 'insalubrity').amount).toBe(648.4);
    expect(items.find((i) => i.id === 'hazard')).toBeUndefined();
  });
});

describe('Education aid', () => {
  it('charges INSS, RAT, third parties and FGTS on the part above the limit', () => {
    const limit = services.benefits.educationLimit(1621);
    const result = calc({ regime: 'presumido', education: limit + 100 });
    const { total } = result.rates;
    const item = result.groups.find((g) => g.id === 'charges').items.find((i) => i.id === 'educationExcess');
    expect(item.amount).toBeCloseTo(100 * (total + 0.08), 2);
    expect(calc({ education: limit }).groups.find((g) => g.id === 'charges').items.some((i) => i.id === 'educationExcess')).toBe(false);
  });
});

describe('CalendarService', () => {
  it('computes Easter (for holidays defined relative to it)', () => {
    expect(easterSunday(2026).toISOString().slice(0, 10)).toBe('2026-04-05');
    expect(easterSunday(2027).toISOString().slice(0, 10)).toBe('2027-03-28');
  });

  it('lists only the federal national holidays (Good Friday is municipal, Lei 9.093/1995)', () => {
    expect(services.calendar.holidays()).toHaveLength(9);
  });

  it('counts Sundays and weekday holidays as paid rest days', () => {
    expect(services.calendar.yearSummary()).toMatchObject({ restDays: 60, workingDays: 305 });
    expect(createServices(jsonDatabase, '2027-05-01').calendar.yearSummary()).toMatchObject({ restDays: 61, workingDays: 304 });
  });
});

describe('EmployeeDeductionService', () => {
  const { deductions } = services;
  it('progressive INSS', () => {
    expect(deductions.inss(1621)).toBeCloseTo(121.575, 2);
    expect(deductions.inss(3000)).toBeCloseTo(248.6, 1);
  });

  it.each([
    [5000, 0],
    [6000, 385.1],
    [10000, 1569.55],
  ])('IRRF on %d is %d', (gross, tax) => {
    expect(deductions.irrf(gross, deductions.inss(gross), 0).tax).toBeCloseTo(tax, 1);
  });
});

describe('WageFloorService', () => {
  const { wageFloors } = services;
  it('engineering floors are frozen at the 2022 values (STF, ADPFs 53, 149 and 171)', () => {
    expect(wageFloors.findBand('SP', 'fed-eng-6h').value).toBe(7272);
  });

  it('nursing floors are proportional to the workweek (STF, ADI 7222)', () => {
    expect(wageFloors.findBand('SP', 'fed-nurse', 44).value).toBe(4750);
    expect(wageFloors.findBand('SP', 'fed-nurse', 36).value).toBeCloseTo(4750 * 36 / 44, 6);
  });

  it('an agreement never goes below a federal-law floor', () => {
    const db = structuredClone(jsonDatabase);
    db.collectiveAgreements.agreements.push({ id: 'low-cct', validFrom: '2026-01-01', validTo: '2026-12-31', kind: 'CCT', ufs: ['SP'], name: 'Teste', territory: 'SP', source: 'mediador', sourceKind: 'registry', roles: [{ id: 'enf', label: 'Enfermeiro', floor: 3000, clause: '3ª' }] });
    const s = createServices(db, '2026-10-30');
    const input = { ...s.formDefaults.defaults(), uf: 'SP', bandId: 'fed-nurse', weeklyHours: 44, agreementId: 'low-cct', agreementRoleId: 'enf' };
    expect(s.wageFloors.resolve(input).value).toBe(4750);
  });

  it('a state band below the minimum wage falls back to the national minimum', () => {
    expect(wageFloors.resolve({ uf: 'RJ', bandId: 'rj-1' })).toMatchObject({ value: 1621, origin: 'national' });
  });

  it('the collective agreement prevails', () => {
    expect(wageFloors.resolve({ uf: 'PR', bandId: 'pr-4', hasAgreementFloor: true, agreementFloor: 3000 }).value).toBe(3000);
  });
});

describe('Versioning by reference date', () => {
  it('payroll relief disappears after the transition ends', () => {
    expect(createServices(jsonDatabase, '2028-01-01').repositories.regimes.payrollRelief()).toBeNull();
    expect(createServices(jsonDatabase, '2027-06-01').repositories.regimes.payrollRelief().payrollRate).toBe(0.15);
  });

  it('a new database version takes over on its validFrom date', () => {
    const db = structuredClone(jsonDatabase);
    db.federalRates.minimumWage.push({ validFrom: '2027-01-01', value: 1700, source: 'minWage' });
    expect(createServices(db, '2026-12-31').repositories.rates.minimumWage()).toBe(1621);
    expect(createServices(db, '2027-01-01').repositories.rates.minimumWage()).toBe(1700);
  });

  it('a retired state floor stops being offered', () => {
    expect(createServices(jsonDatabase, '2027-01-01').wageFloors.stateFloor('PR')).toBeNull();
  });
});
