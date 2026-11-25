// @vitest-environment jsdom
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import NumberField from '../components/ui/NumberField.jsx';
import { parseInput } from '../lib/parseNumber.js';
import { isValidIsoDate, resolveReferenceDate, todayInBrazil } from '../lib/referenceDate.js';
import { jsonDatabase } from '../repositories/database.js';
import { createServices } from '../services/container.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('parseInput', () => {
  it.each([
    ['2.500', 2500],
    ['1.000.000', 1000000],
    ['R$ 3.000', 3000],
    ['1.874,36', 1874.36],
    ['1874.36', 1874.36],
    ['1.5', 1.5],
    ['0.500', 0.5],
    ['12,5', 12.5],
    ['', 0],
  ])('%s → %d', (text, value) => expect(parseInput(text)).toBe(value));
});

describe('NumberField while typing', () => {
  let container;
  let root;
  let latest;
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function Harness({ initial, ...props }) {
    const [value, setValue] = useState(initial);
    const onChange = (next) => {
      latest = next;
      setValue(next);
    };
    return <NumberField label="Campo" value={value} onChange={onChange} {...props} />;
  }

  const type = (input, text) => act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, text);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });

  it('does not write the minimum into the text when the field is cleared', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<Harness initial={75} min={50} />));
    const input = container.querySelector('input');
    for (const text of ['', '1', '10', '100']) type(input, text);
    expect(input.value).toBe('100');
    expect(latest).toBe(100);
  });
});

describe('reference date', () => {
  it('uses the Brazilian day, not the UTC one', () => {
    // 22:30 in São Paulo on Dec 31 is already Jan 1 in UTC.
    expect(todayInBrazil(new Date('2027-01-01T01:30:00Z'))).toBe('2026-12-31');
    expect(resolveReferenceDate('', new Date('2027-01-01T01:30:00Z'))).toBe('2026-12-31');
  });

  it('ignores impossible dates in ?data=', () => {
    expect(isValidIsoDate('2026-13-45')).toBe(false);
    expect(isValidIsoDate('2026-02-30')).toBe(false);
    expect(isValidIsoDate('2028-02-29')).toBe(true);
    expect(resolveReferenceDate('?data=2026-02-30', new Date('2026-06-01T12:00:00Z'))).toBe('2026-06-01');
    expect(resolveReferenceDate('?data=2027-01-01')).toBe('2027-01-01');
  });
});

describe('FormStateService.restore', () => {
  const services = createServices(jsonDatabase, '2026-11-25');
  const defaults = services.formDefaults.defaults();

  it('drops values of the wrong type or not finite', () => {
    const data = services.formState.restore({ weeklyHours: null, salary: '5', overtimeHours: 3, unknown: 1, fap: 'x' });
    expect(data.weeklyHours).toBe(defaults.weeklyHours);
    expect(data.salary).toBe(0);
    expect(data.overtimeHours).toBe(3);
    expect(data.fap).toBe(defaults.fap);
    expect('unknown' in data).toBe(false);
  });

  it('moves a salary filled from the floor to the current floor', () => {
    const data = services.formState.restore({ ...defaults, salary: 1518, salaryAuto: true });
    expect(data.salary).toBe(services.repositories.rates.minimumWage());
  });

  it('keeps a salary the user typed', () => {
    expect(services.formState.restore({ ...defaults, salary: 1500, salaryAuto: false }).salary).toBe(1500);
  });

  it('drops a wage-floor band that no longer exists', () => {
    expect(services.formState.restore({ ...defaults, uf: 'SP', bandId: 'gone' }).bandId).toBe('');
  });

  it('moves a replaced agreement to its successor and its new floor', () => {
    const old = jsonDatabase.collectiveAgreements.agreements.find((a) => a.id === 'sp-asseio-2026');
    const successor = {
      ...old,
      id: 'sp-asseio-2027',
      validFrom: '2026-11-01',
      validTo: '2027-10-31',
      roles: old.roles.map((r) => ({ ...r, floor: r.floor + 100 })),
    };
    const db = { ...jsonDatabase, collectiveAgreements: { ...jsonDatabase.collectiveAgreements, agreements: [...jsonDatabase.collectiveAgreements.agreements, successor] } };
    const later = createServices(db, '2026-11-25');
    const saved = { ...later.formDefaults.defaults(), uf: 'SP', ...later.agreements.applyPatch('sp-asseio-2026', 'servente') };
    // The old agreement is no longer offered.
    expect(later.agreements.selection(saved)).toBeNull();
    const data = later.formState.restore(saved);
    expect(data.agreementId).toBe('sp-asseio-2027');
    expect(data.agreementRoleId).toBe('servente');
    expect(data.salary).toBe(old.roles[0].floor + 100);
  });

  it('clears an agreement no longer offered (expired past the grace period) and undoes what it filled in', () => {
    const saved = { ...defaults, uf: 'SP', ...services.agreements.applyPatch('sp-asseio-2026', 'servente') };
    const later = createServices(jsonDatabase, '2028-06-01');
    expect(later.agreements.get('sp-asseio-2026')).toBeNull();
    const data = later.formState.restore(saved);
    expect(data.agreementId).toBe('');
    expect(data.mealValue).toBe(defaults.mealValue);
    expect(data.salary).toBe(0);
  });
});

describe('RegimeComparisonService', () => {
  const services = createServices(jsonDatabase, '2026-11-25');
  const base = { ...services.formDefaults.defaults(), salary: 3000 };
  const row = (rows, id) => rows.find((r) => r.id === id);

  it('ignores payroll relief left on from a regime that cannot use it', () => {
    const rows = services.comparison.compare({ ...base, regime: 'simples', payrollRelief: true });
    const plain = services.comparison.compare({ ...base, regime: 'simples', payrollRelief: false });
    expect(row(rows, 'presumido').monthlyTotal).toBe(row(plain, 'presumido').monthlyTotal);
  });

  it('applies relief when the user chose it in an eligible regime', () => {
    const rows = services.comparison.compare({ ...base, regime: 'presumido', payrollRelief: true });
    const plain = services.comparison.compare({ ...base, regime: 'presumido', payrollRelief: false });
    expect(row(rows, 'real').monthlyTotal).toBeLessThan(row(plain, 'real').monthlyTotal);
  });

  it('gives no MEI figures when the salary is above the floor', () => {
    const rows = services.comparison.compare(base, { floor: 1621 });
    expect(row(rows, 'mei')).toMatchObject({ eligible: false, monthlyTotal: null });
    expect(row(services.comparison.compare({ ...base, salary: 1621 }, { floor: 1621 }), 'mei').eligible).toBe(true);
  });
});
