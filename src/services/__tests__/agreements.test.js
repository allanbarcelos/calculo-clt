import { describe, expect, it } from 'vitest';
import { jsonDatabase } from '../../repositories/database.js';
import { createServices } from '../container.js';

// Fixture agreement so the tests do not depend on the real data in the database.
function servicesWithFixture() {
  const db = structuredClone(jsonDatabase);
  db.collectiveAgreements.agreements.push({
    id: 'test-cct',
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    kind: 'CCT',
    ufs: ['SC'],
    name: 'CCT de teste',
    territory: 'Florianópolis/SC',
    source: 'mediador',
    presets: {
      overtimeRate: { value: 60, clause: 'Cláusula 10ª' },
      mealValue: { daily: 30, clause: 'Cláusula 15ª' },
      lifeInsurance: { value: 12.5, clause: 'Cláusula 20ª' },
    },
    roles: [
      { id: 'aux', label: 'Auxiliar', floor: 2000, clause: 'Cláusula 3ª' },
      { id: 'enc', label: 'Encarregado', floor: 2600, clause: 'Cláusula 3ª', presets: { overtimeRate: { value: 70, clause: 'Cláusula 11ª' } } },
    ],
  });
  return createServices(db, '2026-10-30');
}

const services = servicesWithFixture();
const { agreements, wageFloors, formDefaults } = services;
const defaults = formDefaults.defaults();

describe('Real agreements in the database', () => {
  const real = createServices(jsonDatabase, '2026-10-30');
  const base = real.formDefaults.defaults();

  it('SC asseio: servente gets 20% insalubrity on the floor, as in the CCT (R$ 2.103,42)', () => {
    const data = { ...base, uf: 'SC', ...real.agreements.applyPatch('sc-asseio-2026', 'servente') };
    const pay = real.calculator.calculate(data).groups.find((g) => g.id === 'pay');
    expect(pay.total).toBe(2103.42);
  });

  it('SC asseio: dedetização gets 40% on the national minimum wage (R$ 648,40)', () => {
    const data = { ...base, uf: 'SC', ...real.agreements.applyPatch('sc-asseio-2026', 'dedetizacao') };
    const pay = real.calculator.calculate(data).groups.find((g) => g.id === 'pay');
    expect(pay.items.find((i) => i.id === 'insalubrity').amount).toBe(648.4);
  });

  it('ES asseio pre-fills the benefits of the CCT', () => {
    expect(real.agreements.applyPatch('es-asseio-2026', 'asg')).toMatchObject({
      salary: 1682.7, overtimeRate: 60, mealValue: 525.14, healthPlan: 110.17, dentalPlan: 11.03, lifeInsurance: 5,
    });
  });

  it('keeps an expired agreement, flagged, until the grace period ends', () => {
    const asseio = (date) => createServices(jsonDatabase, date).agreements.forState('SC').filter((a) => a.id.startsWith('sc-asseio'));
    expect(asseio('2027-01-01').map((a) => [a.id, a.expired])).toEqual([['sc-asseio-2026', true]]);
    expect(asseio('2028-01-02')).toEqual([]);
  });

  it('the newest agreement of a series replaces the previous one', () => {
    const db = structuredClone(jsonDatabase);
    const previous = db.collectiveAgreements.agreements.find((a) => a.id === 'sc-asseio-2026');
    db.collectiveAgreements.agreements.push({ ...previous, id: 'sc-asseio-2027', validFrom: '2027-01-01', validTo: '2027-12-31' });
    const list = createServices(db, '2027-02-01').agreements.forState('SC').filter((a) => a.id.startsWith('sc-asseio'));
    expect(list.map((a) => [a.id, a.expired])).toEqual([['sc-asseio-2027', false]]);
  });

  it('changing the state undoes an agreement that does not cover it', () => {
    const data = { ...base, uf: 'SC', ...real.agreements.applyPatch('sc-asseio-2026', 'servente') };
    const patch = real.wageFloors.statePatch(data, 'PR', base);
    expect(patch).toMatchObject({ uf: 'PR', agreementId: '', agreementRoleId: '', salary: 0, salaryAuto: false });
  });
});

describe('CollectiveAgreementService', () => {
  it('lists agreements only for the states they cover', () => {
    expect(agreements.forState('SC').map((a) => a.id)).toContain('test-cct');
    expect(agreements.forState('SP').map((a) => a.id)).not.toContain('test-cct');
  });

  it('pre-fills salary and benefits, converting daily meal values to monthly', () => {
    const patch = agreements.applyPatch('test-cct', 'aux');
    expect(patch).toMatchObject({ salary: 2000, salaryAuto: true, overtimeRate: 60, mealValue: 660, mealEnabled: true, lifeInsurance: 12.5 });
  });

  it('role presets override agreement presets', () => {
    expect(agreements.applyPatch('test-cct', 'enc').overtimeRate).toBe(70);
  });

  it('the agreement role floor prevails over the state floor', () => {
    const data = { ...defaults, uf: 'SC', bandId: 'sc-4', agreementId: 'test-cct', agreementRoleId: 'enc' };
    expect(wageFloors.resolve(data)).toMatchObject({ value: 2600, origin: 'agreementRole' });
  });

  it('undoing an agreement restores untouched fields and keeps edited ones', () => {
    const data = { ...defaults, uf: 'SC', ...agreements.applyPatch('test-cct', 'aux') };
    data.lifeInsurance = 50; // edited by the user
    const reverted = { ...data, ...agreements.revertPatch(data, defaults) };
    expect(reverted).toMatchObject({ agreementId: '', overtimeRate: defaults.overtimeRate, mealValue: 0, mealEnabled: false, lifeInsurance: 50, salary: 0 });
  });

  it('an agreement out of its validity is not offered', () => {
    const db = structuredClone(jsonDatabase);
    db.collectiveAgreements.agreements.push({ id: 'old', validFrom: '2024-01-01', validTo: '2024-12-31', kind: 'CCT', ufs: ['*'], name: 'Antiga', territory: 'Brasil', source: 'mediador', roles: [] });
    expect(createServices(db, '2026-10-30').agreements.forState('SP').map((a) => a.id)).not.toContain('old');
  });
});
