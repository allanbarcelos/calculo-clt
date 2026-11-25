import { describe, expect, it } from 'vitest';
import { jsonDatabase } from '../../repositories/database.js';
import { createServices } from '../container.js';

const services = createServices(jsonDatabase, '2026-11-25');
const defaults = services.formDefaults.defaults();
const domestic = { ...defaults, regime: 'domestic', salary: 1621 };
const calc = (patch) => services.calculator.calculate({ ...domestic, ...patch });
const item = (result, group, id) => result.groups.find((g) => g.id === group).items.find((i) => i.id === id);

describe('Domestic employee (LC 150/2015, eSocial Doméstico)', () => {
  it('charges 8% INSS, 0.8% accident insurance, 8% FGTS and 3.2% compensation, with no RAT/FAP or third parties', () => {
    const r = calc({});
    expect(item(r, 'charges', 'fgts').amount).toBeCloseTo(1621 * 0.08, 2);
    expect(item(r, 'charges', 'fgtsCompensation').amount).toBeCloseTo(1621 * 0.032, 2);
    expect(item(r, 'charges', 'inss').amount).toBeCloseTo(1621 * 0.08, 2);
    expect(item(r, 'charges', 'rat')).toMatchObject({ labelKey: 'accidentInsurance' });
    expect(item(r, 'charges', 'rat').amount).toBeCloseTo(1621 * 0.008, 2);
    expect(item(r, 'charges', 'third')).toBeUndefined();
  });

  it('has no 40% fine: the 3.2% is already monthly', () => {
    expect(item(calc({}), 'accruals', 'terminationFine')).toBeUndefined();
  });

  it('costs 1,411111 per R$ 1 of salary after 1 year (independent model)', () => {
    // 13th and 1/3 with charges (11.2% FGTS + 8.8%), plus a whole unused vacation at the end of
    // year 1 without charges, minus the charges accrued on its 1/3.
    const acc = 1 + 1 / 12 + 1 / 36;
    const expected = acc * 1.112 + (1 + 1 / 36) * 0.088 + 0.088 / 12 + (1 - (0.112 + 0.088) / 3) / 12;
    const r = calc({});
    expect(r.costPerReal).toBeCloseTo(expected, 10);
    expect(r.monthlyTotal).toBe(2287.41);
  });

  it('does not discount food nor pay PLR (LC 150/2015, art. 18)', () => {
    const r = calc({ mealEnabled: true, mealValue: 400, mealDiscountPct: 20, plrYearly: 1200 });
    expect(r.employee.meal).toBe(0);
    expect(item(r, 'benefits', 'meal').amount).toBe(400);
    expect(item(r, 'benefits', 'plr')).toBeUndefined();
  });

  it('INSS pays sickness from the first day and Empresa Cidadã does not apply', () => {
    const r = calc({ leaveFamilyProfile: 'female', leaveHealthReserve: true, companyCitizen: true });
    expect(r.leaveReserve.sicknessDays).toBe(0);
    expect(r.leaveReserve.maternityDays).toBe(120);
    expect(r.leaveReserve.companyCitizen).toBe(false);
  });

  it('keeps the employee payslip (INSS, IRRF, family allowance)', () => {
    const r = calc({ childrenUnder14: 1 });
    expect(r.employee.inss).toBe(121.58);
    expect(r.employee.familyAllowance).toBeGreaterThan(0);
  });

  it('is compared only with itself, not with company regimes', () => {
    expect(services.comparison.compare(domestic).map((c) => c.id)).toEqual(['domestic']);
    expect(services.comparison.compare({ ...domestic, regime: 'simples' }).some((c) => c.id === 'domestic')).toBe(false);
  });
});

describe('Switching to a household employer', () => {
  it('drops the apprentice contract and starts at the state band for domestic workers', () => {
    const data = { ...defaults, uf: 'SP', contractType: 'apprentice', weeklyHours: 30 };
    const patch = services.wageFloors.regimePatch(data, 'domestic', defaults);
    expect(patch).toMatchObject({ regime: 'domestic', contractType: 'standard', weeklyHours: 44, bandId: 'sp-1', salaryAuto: true });
    expect(patch.salary).toBe(services.wageFloors.domesticBand('SP').value);
  });

  it('uses the PR band for services (Grupo II) and the minimum wage where there is no state law', () => {
    expect(services.wageFloors.domesticBand('PR').id).toBe('pr-2');
    const patch = services.wageFloors.regimePatch({ ...defaults, uf: 'BA' }, 'domestic', defaults);
    expect(patch.bandId).toBe('');
  });

  it('follows the domestic band when the state changes', () => {
    const data = { ...defaults, regime: 'domestic', uf: 'SP', bandId: 'sp-1' };
    expect(services.wageFloors.statePatch(data, 'RS', defaults).bandId).toBe('rs-1');
  });

  it('back to a company, a day worker becomes a standard contract and the domestic band is dropped', () => {
    const data = { ...defaults, regime: 'domestic', uf: 'SP', bandId: 'sp-1', contractType: 'dayWorker' };
    expect(services.wageFloors.regimePatch(data, 'simples', defaults)).toMatchObject({ contractType: 'standard', bandId: '' });
  });

  it('restores a saved apprentice under a household as a standard contract', () => {
    expect(services.formState.restore({ ...defaults, regime: 'domestic', contractType: 'apprentice' }).contractType).toBe('standard');
  });
});

describe('Day worker (diarista)', () => {
  const day = (patch) => calc({ contractType: 'dayWorker', salary: 0, dayRate: 150, dayWorkerDaysPerWeek: 2, dayWorkerTransport: 10, ...patch });

  it('costs only the daily rates and transport, 52 weeks ÷ 12 months', () => {
    const r = day({});
    expect(r.dayWorker.daysPerMonth).toBeCloseTo(104 / 12, 10);
    expect(r.monthlyTotal).toBe(1386.67);
    expect(r.yearlyTotal).toBe(16640.04);
    expect(r.groups.find((g) => g.id === 'charges').items).toEqual([]);
    expect(r.groups.find((g) => g.id === 'accruals').items).toEqual([]);
  });

  it('has no wage floor', () => {
    expect(services.wageFloors.resolve({ ...domestic, contractType: 'dayWorker' })).toMatchObject({ value: 0, origin: 'dayWorker' });
  });

  it('flags an employment bond above 2 days a week', () => {
    expect(day({}).dayWorker.bond).toBe(false);
    expect(day({ dayWorkerDaysPerWeek: 3 }).dayWorker.bond).toBe(true);
  });

  it('is only offered to households', () => {
    expect(services.contract.isDayWorker({ ...defaults, regime: 'simples', contractType: 'dayWorker' })).toBe(false);
    expect(services.contract.types(domestic)).toEqual(['standard', 'dayWorker']);
  });
});
