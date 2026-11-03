import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import App from '../App.jsx';
import ServicesProvider from '../context/ServicesProvider.jsx';
import LiveSummary from '../features/wizard/LiveSummary.jsx';
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
    expect(html).toContain('Cálculo CLT');
    expect(html).toContain('Fontes oficiais');
    expect(html).toContain('Developed by');
    expect(html).toContain('href="https://barcelos.dev"');
    expect(html).toContain('href="https://github.com/allanbarcelos/calculo-clt"');
    expect(html).toContain('aria-label="Código-fonte no GitHub"');
    // A blank form has nothing to reset.
    expect(html).not.toContain('Nova simulação');
  });

  it('offers a new simulation once something was filled in', () => {
    const live = (onReset) => render(<LiveSummary started result={result} onReset={onReset} />);
    expect(live(() => {})).toContain('Nova simulação');
    expect(live(null)).not.toContain('Nova simulação');
  });

  const scenarios = {
    full: data,
    empty: services.formDefaults.defaults(),
    agreementSC: {
      ...services.formDefaults.defaults(),
      uf: 'SC',
      ...services.agreements.applyPatch('sc-asseio-2026', 'servente'),
    },
    automated: {
      ...data,
      regime: 'presumido',
      rat: 3,
      fpas: '507',
      uf: 'SC',
      bandId: '',
      overtimeHours: 80,
      restDayOvertimeHours: 60,
      nightHours: 300,
      leaveFamilyProfile: 'unknown',
      leaveHealthReserve: true,
      companyCitizen: true,
      leaveExternalHiringCost: 3000,
    },
    apprenticeReal: {
      ...data,
      regime: 'real',
      contractType: 'apprentice',
      weeklyHours: 44,
      overtimeHours: 4,
      cleaningServicesCompany: true,
      ppeMonthly: 30,
      childcare: 250,
      realProfitBracket: 'basic',
    },
    internalLeave: { ...data, leaveFamilyProfile: 'female', leaveReplacementMode: 'internal', leaveInternalBonusRate: 15 },
    simplesRural: { ...data, regime: 'simples', uf: 'BA', bandId: 'fed-eng-6h', nightType: 'ruralCrop', hasAgreementFloor: true, agreementFloor: 2500, includeNoticeReserve: true },
  };
  const cases = STEPS.flatMap((s) => Object.keys(scenarios).map((name) => [s.id, name, s.Component]));

  it.each(cases)('renders step "%s" (%s) with texts from the database', (_, name, Component) => {
    const input = scenarios[name];
    const html = render(<Component data={input} set={() => {}} result={services.calculator.calculate(input)} errors={{ salary: 'erro' }} />);
    expect(html.length).toBeGreaterThan(300);
    expect(html).not.toContain('{{');
    expect(html).not.toContain('](source:');
    expect(html).not.toContain('—</');
  });

  it('shows explainers, tables and callouts stored in content.json', () => {
    const step = (id) => STEPS.find((s) => s.id === id).Component;
    const PayStep = step('pay');
    const BenefitsStep = step('benefits');
    const pay = render(<PayStep data={data} set={() => {}} result={result} errors={{}} />);
    expect(pay).toContain('Anexos da NR-15');
    expect(pay).toContain('Os adicionais não se acumulam');
    expect(pay).toContain('O cálculo considera só <strong>a periculosidade</strong>');
    const benefits = render(<BenefitsStep data={data} set={() => {}} result={result} errors={{}} />);
    expect(benefits).toContain('Auxílio-educação acima do limite');
  });

  it('warns about expired, unofficial and calculated agreements as soon as one is chosen, and on the result', () => {
    const step = (id) => STEPS.find((s) => s.id === id).Component;
    const Floor = step('floor');
    const Result = step('result');
    const pick = (uf, agreementId, roleId) => ({ ...services.formDefaults.defaults(), uf, ...services.agreements.applyPatch(agreementId, roleId) });
    const view = (input) => {
      const out = services.calculator.calculate(input);
      return { floor: render(<Floor data={input} set={() => {}} result={out} errors={{}} />), result: render(<Result data={input} result={out} />) };
    };

    const expired = view(pick('SP', 'sp-comercio-capital-2025', 'empregados-em-geral'));
    expect(expired.floor).toContain('venceu em 31/08/2026');
    expect(expired.floor).toContain('⚠ Comércio varejista/lojista — São Paulo (capital) 2025/2026 (vencida em 31/08/2026)');
    expect(expired.result).toContain('Confira a convenção no texto oficial');
    expect(expired.result).toContain('pesquise as convenções de <strong>SP</strong>');

    const summary = view(pick('SP', 'sp-transporte-cargas-capital-2026', 'motorista-carreta'));
    expect(summary.floor).toContain('Fonte não oficial: os valores vêm de notícia ou resumo');
    expect(summary.floor).toContain('Parte dos pisos foi calculada por nós');
    const Pay = step('pay');
    const cargo = pick('SP', 'sp-transporte-cargas-capital-2026', 'motorista-carreta');
    expect(render(<Pay data={cargo} set={() => {}} result={services.calculator.calculate(cargo)} errors={{}} />))
      .toContain('Confira no texto oficial: esta convenção está com aviso.');

    const copy = view(pick('PR', 'pr-condominios-curitiba-2026-2027', 'porteiro'));
    expect(copy.floor).toContain('cópia do texto registrado publicada por um site particular');
    expect(copy.floor).toContain('pesquise o registro <strong>PR001790/2026</strong>');

    const registered = view(pick('SC', 'sc-asseio-2026', 'servente'));
    expect(registered.floor).toContain('Fonte: texto registrado no Ministério do Trabalho (registro SC000124/2026).');
    expect(registered.floor).toContain('não é a fonte oficial');
    expect(registered.result).not.toContain('Confira a convenção no texto oficial');
  });

  it('explains the apprentice contract and the Lucro Real tax savings', () => {
    const input = scenarios.apprenticeReal;
    const out = services.calculator.calculate(input);
    const step = (id) => STEPS.find((s) => s.id === id).Component;
    const page = (id) => render(createElement(step(id), { data: input, set: () => {}, result: out, errors: {} }));
    expect(page('floor')).toContain('Salário mínimo do aprendiz');
    expect(page('pay')).toContain('não pode fazer horas extras');
    expect(page('pay')).toContain('passa até do limite maior (40h)');
    expect(page('pay')).toContain('menos de 18 anos');
    expect(page('other')).toContain('Fim do contrato de aprendiz');
    expect(page('company')).toContain('Situação de lucro da empresa');
    const res = page('result');
    expect(res).toContain('Vantagem do contrato de aprendiz');
    expect(res).toContain('Vantagens tributárias (Lucro Real)');
    expect(res).toContain('Dedução no IRPJ e na CSLL: 24%');
    expect(res).toContain('Crédito de PIS/COFINS: 9,25%');
    expect(res).toContain('Custo líquido estimado do funcionário');
    expect(res).toContain('Se a empresa se inscrever no PAT');
    const presumido = { ...input, regime: 'presumido' };
    expect(render(createElement(step('result'), { data: presumido, result: services.calculator.calculate(presumido) })))
      .toContain('E as vantagens tributárias no Lucro Presumido?');
  });

  it('links legal citations in field hints to their sources', () => {
    const Company = STEPS.find((s) => s.id === 'company').Component;
    const input = { ...data, regime: 'presumido' };
    const html = render(<Company data={input} set={() => {}} result={services.calculator.calculate(input)} errors={{}} />);
    const rat = services.repositories.sources.get('rat').url;
    expect(html).toContain(`3% grave. Está no <a class="source-link" href="${rat}"`);
    expect(html).toContain('>Anexo V do Decreto 3.048/1999<');
    expect(html).not.toContain('](source:');
  });

  it('shows the ANS health plan reference once the age band is chosen', () => {
    const BenefitsStep = STEPS.find((s) => s.id === 'benefits').Component;
    const input = { ...data, uf: 'SP', employeeAgeBand: '4', healthPlanAccommodation: 'ward' };
    const html = render(<BenefitsStep data={input} set={() => {}} result={services.calculator.calculate(input)} errors={{}} />);
    expect(html).toContain('Valor típico em São Paulo');
    expect(html).toContain('Usar R$');
    expect(html).toContain('até 30% acima ou abaixo');
    expect(html).toContain('ANS, valor comercial dos planos');
    const blank = render(<BenefitsStep data={data} set={() => {}} result={result} errors={{}} />);
    expect(blank).not.toContain('Valor típico em');
  });

  it('shows the FPAS composition and warns about values above the legal limits', () => {
    const input = scenarios.automated;
    const out = services.calculator.calculate(input);
    const step = (id) => STEPS.find((s) => s.id === id).Component;
    const Company = step('company');
    const company = render(<Company data={input} set={() => {}} result={out} errors={{}} />);
    expect(company).not.toContain('CNPJ');
    expect(company).toContain('Total de 5,8%: salário-educação 2,5%, INCRA 0,2%, SENAI 1%, SESI 1,5%, SEBRAE 0,6%.');
    const Pay = step('pay');
    const pay = render(<Pay data={input} set={() => {}} result={out} errors={{}} />);
    expect(pay).toContain('Acima do limite legal');
    expect(pay).toContain('O período noturno tem 7h por dia');
    const Result = step('result');
    const res = render(<Result data={input} result={out} />);
    expect(res).toContain('Reserva para licenças e afastamentos');
    expect(res).toContain('Empresa Cidadã: 180 dias');
    expect(res).toContain('(−) Salário de licença reembolsado pelo INSS');
  });
});
