// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import ServicesProvider from '../context/ServicesProvider.jsx';
import Wizard from '../features/wizard/Wizard.jsx';
import { jsonDatabase } from '../repositories/database.js';
import { createServices } from '../services/container.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const services = createServices(jsonDatabase, '2026-11-25');
let container;
let root;

function render(saved) {
  localStorage.clear();
  if (saved) localStorage.setItem('custo-claro:v3', JSON.stringify({ ...services.formDefaults.defaults(), ...saved }));
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<ServicesProvider services={services}><Wizard /></ServicesProvider>));
}

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
const radio = (value) => container.querySelector(`input[type="radio"][value="${value}"]`);
const text = () => container.textContent;

describe('Hiring as a person', () => {
  it('offers the household employer and, then, domestic employee or day worker', () => {
    render();
    expect(text()).toContain('Pessoa física: empregador doméstico');
    click(radio('domestic'));
    expect(text()).toContain('Contratando como pessoa física');
    act(() => container.querySelector('form').requestSubmit());
    expect(container.querySelector('.step__count').textContent).toBe('Etapa 2 de 6');
    expect(radio('dayWorker')).not.toBeNull();
    expect(radio('apprentice')).toBeNull();
  });

  it('a day worker skips benefits and accruals: 4 steps', () => {
    render({ regime: 'domestic', contractType: 'dayWorker', dayRate: 150, dayWorkerDaysPerWeek: 2 });
    expect(container.querySelector('.step__count').textContent).toBe('Etapa 1 de 4');
    expect(container.querySelector('.live-summary__value').textContent).toContain('1.300,00');
  });

  it('a domestic employee keeps every step', () => {
    render({ regime: 'domestic', contractType: 'standard', salary: 1874.36 });
    expect(container.querySelector('.step__count').textContent).toBe('Etapa 1 de 6');
  });
});
