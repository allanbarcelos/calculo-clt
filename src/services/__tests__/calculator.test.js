import { describe, expect, it } from 'vitest';
import { jsonDatabase } from '../../repositories/database.js';
import { createServices } from '../container.js';

const services = createServices(jsonDatabase, '2026-10-30');
const base = { ...services.formDefaults.defaults(), salary: 1621 };
const calc = (patch) => services.calculator.calculate({ ...base, ...patch });

describe('CostCalculator — one minimum wage, termination reserve on', () => {
  it.each([
    ['mei', 2211.14],
    ['simples', 2153.05],
    ['simplesIV', 2579.01],
    ['presumido', 2691.31],
    ['real', 2691.31],
  ])('%s costs %d per month', (regime, expected) => {
    expect(calc({ regime }).monthlyTotal).toBe(expected);
  });

  it('removes employer INSS from the 13th salary under payroll relief', () => {
    expect(calc({ regime: 'presumido', payrollRelief: true }).monthlyTotal).toBe(2484.19);
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

describe('Night work', () => {
  const pay = (patch) => calc({ salary: 2200, ...patch }).groups.find((g) => g.id === 'pay').items;

  it('urban night hour: 7 clock hours are paid as 8', () => {
    expect(pay({ nightHours: 7 }).find((i) => i.id === 'night').amount).toBe(16);
  });

  it('night overtime stacks both premiums', () => {
    const items = pay({ nightOvertimeHours: 7 });
    expect(items.find((i) => i.id === 'nightOvertime').amount).toBe(144);
    expect(items.find((i) => i.id === 'dsr').amount).toBe(24);
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
  it('federal floors in minimum-wage multiples follow the minimum wage', () => {
    expect(wageFloors.findBand('SP', 'fed-eng-6h').value).toBe(1621 * 6);
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
