import { describe, expect, it } from 'vitest';
import { jsonDatabase } from '../../repositories/database.js';
import { createServices } from '../container.js';

const services = createServices(jsonDatabase, '2026-11-02');
const base = { ...services.formDefaults.defaults(), salary: 1621 };
const calc = (patch) => services.calculator.calculate({ ...base, ...patch });
const item = (result, group, id) => result.groups.find((g) => g.id === group).items.find((i) => i.id === id);

describe('Apprentice contract', () => {
  const apprentice = { contractType: 'apprentice', weeklyHours: 30, salary: 1105.23, includeTerminationReserve: true, includeNoticeReserve: true };

  it('deposits FGTS at 2% on pay and accruals', () => {
    const result = calc(apprentice);
    expect(item(result, 'charges', 'fgts').amount).toBeCloseTo(1105.23 * 0.02, 2);
    expect(item(result, 'charges', 'fgts').params.rate).toBe(0.02);
  });

  it('has no FGTS fine and no notice when the contract ends on its term', () => {
    const result = calc(apprentice);
    expect(item(result, 'accruals', 'terminationFine')).toBeUndefined();
    expect(item(result, 'accruals', 'notice')).toBeUndefined();
    expect(result.notice.days).toBe(0);
  });

  it('floor is the hourly minimum wage times the contracted hours', () => {
    const floor = services.wageFloors.resolve({ ...base, ...apprentice });
    expect(floor).toMatchObject({ origin: 'apprentice' });
    expect(floor.value).toBeCloseTo((1621 / 220) * 150, 6);
  });

  it('switching to apprentice sets the 30-hour workweek, and back to the standard 44 hours', () => {
    expect(services.contract.switchPatch(base, 'apprentice')).toEqual({ contractType: 'apprentice', weeklyHours: 30 });
    expect(services.contract.switchPatch({ ...base, contractType: 'apprentice' }, 'standard')).toEqual({ contractType: 'standard', weeklyHours: 44 });
  });

  it('flags overtime and long workweeks, which apprentices cannot have', () => {
    expect(services.contract.apprenticeIssues({ ...base, ...apprentice })).toEqual([]);
    expect(services.contract.apprenticeIssues({ ...base, ...apprentice, weeklyHours: 44, overtimeHours: 5 })).toEqual(['hours', 'overtime']);
    expect(services.contract.apprenticeIssues({ ...base, weeklyHours: 44, overtimeHours: 5 })).toEqual([]);
  });

  it('a collective agreement keeps the apprentice salary', () => {
    expect(services.agreements.applyPatch('sc-asseio-2026', 'servente', { keepSalary: true }).salary).toBeUndefined();
  });

  it('costs less than a standard contract with the same pay', () => {
    expect(calc(apprentice).monthlyTotal).toBeLessThan(calc({ ...apprentice, contractType: 'standard' }).monthlyTotal);
  });
});

describe('Childcare reimbursement', () => {
  it('is a benefit without payroll charges', () => {
    const result = calc({ childcare: 300 });
    expect(item(result, 'benefits', 'childcare').amount).toBe(300);
    expect(result.monthlyTotal - calc({}).monthlyTotal).toBeCloseTo(300, 2);
  });
});

describe('TaxAdvantageService', () => {
  const tax = (patch) => {
    const input = { ...base, regime: 'real', ...patch };
    return services.taxAdvantages.compute(input, services.calculator.calculate(input));
  };

  it('only applies to Lucro Real', () => {
    const input = { ...base, regime: 'presumido' };
    expect(services.taxAdvantages.compute(input, services.calculator.calculate(input)).applies).toBe(false);
  });

  it('deducts IRPJ + surcharge + CSLL (34%) or IRPJ + CSLL (24%) from the whole monthly cost', () => {
    const full = tax({ realProfitBracket: 'surcharge' });
    const monthly = services.calculator.calculate({ ...base, regime: 'real' }).monthlyTotal;
    expect(full.items.find((i) => i.id === 'incomeTaxDeduction').amount).toBeCloseTo(monthly * 0.34, 6);
    expect(tax({ realProfitBracket: 'basic' }).items.find((i) => i.id === 'incomeTaxDeduction').amount).toBeCloseTo(monthly * 0.24, 6);
    expect(full.net).toBeCloseTo(monthly - full.total, 6);
  });

  it('has no immediate saving with a tax loss', () => {
    expect(tax({ realProfitBracket: 'loss' }).items).toEqual([]);
  });

  it('gives cleaning companies 9.25% PIS/COFINS credit on transport, meals and uniforms', () => {
    const patch = { cleaningServicesCompany: true, transportEnabled: true, transportDailyFare: 12, mealEnabled: true, mealValue: 500, ppeMonthly: 40 };
    const input = { ...base, regime: 'real', ...patch };
    const result = services.calculator.calculate(input);
    const credit = services.taxAdvantages.compute(input, result).items.find((i) => i.id === 'pisCofinsCredit');
    const creditBase = item(result, 'benefits', 'transport').amount + item(result, 'benefits', 'meal').amount + 40;
    expect(credit.amount).toBeCloseTo(creditBase * 0.0925, 6);
    expect(tax({ ...patch, cleaningServicesCompany: false }).items.some((i) => i.id === 'pisCofinsCredit')).toBe(false);
  });

  it('PAT: 15% of the meal benefit off the IRPJ, cut by 10% in 2026 (13.5%), only when registered', () => {
    const meals = { mealEnabled: true, mealValue: 600 };
    const registered = tax({ ...meals, patRegistered: true });
    const meal = services.calculator.calculate({ ...base, regime: 'real', ...meals }).groups.find((g) => g.id === 'benefits').items.find((i) => i.id === 'meal').amount;
    expect(registered.items.find((i) => i.id === 'patIncentive').amount).toBeCloseTo(meal * 0.135, 6);
    const notRegistered = tax(meals);
    expect(notRegistered.items.some((i) => i.id === 'patIncentive')).toBe(false);
    expect(notRegistered.pat.potential).toBeCloseTo(meal * 0.135, 6);
    expect(tax({ ...meals, patRegistered: true, realProfitBracket: 'loss' }).items).toEqual([]);
  });

  it('PIS/COFINS credits end with 2026 (CBS from 2027)', () => {
    const later = createServices(jsonDatabase, '2027-03-01');
    expect(later.taxAdvantages.pisCofinsRate()).toBeNull();
    const input = { ...later.formDefaults.defaults(), salary: 1621, regime: 'real', cleaningServicesCompany: true, ppeMonthly: 50 };
    expect(later.taxAdvantages.compute(input, later.calculator.calculate(input)).items.some((i) => i.id === 'pisCofinsCredit')).toBe(false);
  });
});

describe('Apprentice risk warning', () => {
  it('warns when an apprentice works with insalubrity, hazard or at night', () => {
    expect(services.contract.apprenticeIssues({ ...base, contractType: 'apprentice', weeklyHours: 30, hazard: true })).toEqual(['risk']);
  });
});
