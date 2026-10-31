import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import App from '../App.jsx';
import ServicesProvider from '../context/ServicesProvider.jsx';
import { STEPS } from '../features/wizard/steps.js';
import { jsonDatabase } from '../repositories/database.js';
import { createServices } from '../services/container.js';

const services = createServices(jsonDatabase, '2026-10-30');
const render = (node) => renderToString(<ServicesProvider services={services}>{node}</ServicesProvider>);

const data = {
  ...services.formDefaults.defaults(),
  regime: 'presumido',
  uf: 'RJ',
  bandId: 'rj-1',
  salary: 1621,
  insalubrity: 20,
  hazard: true,
  overtimeHours: 10,
  nightHours: 7,
  nightOvertimeHours: 3,
  transportEnabled: true,
  transportDailyFare: 10,
  mealEnabled: true,
  mealValue: 400,
  education: 3000,
  plrYearly: 1200,
  includeNoticeReserve: true,
};
const result = services.calculator.calculate(data);

describe('rendering', () => {
  it('renders the whole page', () => {
    globalThis.localStorage = { getItem: () => null, setItem: () => {} };
    const html = render(<App />);
    expect(html).toContain('Custo Claro');
    expect(html).toContain('Fontes oficiais');
  });

  const scenarios = {
    full: data,
    empty: services.formDefaults.defaults(),
    agreementSC: {
      ...services.formDefaults.defaults(),
      uf: 'SC',
      ...services.agreements.applyPatch('sc-asseio-2026', 'servente'),
    },
    simplesRural: { ...data, regime: 'simples', uf: 'BA', bandId: 'fed-eng-6h', nightType: 'ruralCrop', hasAgreementFloor: true, agreementFloor: 2500, includeNoticeReserve: true },
  };
  const cases = STEPS.flatMap((s) => Object.keys(scenarios).map((name) => [s.id, name, s.Component]));

  it.each(cases)('renders step "%s" (%s) with texts from the database', (_, name, Component) => {
    const input = scenarios[name];
    const html = render(<Component data={input} set={() => {}} result={services.calculator.calculate(input)} errors={{ salary: 'erro' }} />);
    expect(html.length).toBeGreaterThan(300);
    expect(html).not.toContain('{{');
    expect(html).not.toContain('—</');
  });

  it('shows explainers, tables and callouts stored in content.json', () => {
    const step = (id) => STEPS.find((s) => s.id === id).Component;
    const PayStep = step('pay');
    const BenefitsStep = step('benefits');
    const pay = render(<PayStep data={data} set={() => {}} result={result} errors={{}} />);
    expect(pay).toContain('Anexos da NR-15');
    expect(pay).toContain('Insalubridade e periculosidade não se acumulam');
    const benefits = render(<BenefitsStep data={data} set={() => {}} result={result} errors={{}} />);
    expect(benefits).toContain('Auxílio-educação acima do limite');
  });
});
