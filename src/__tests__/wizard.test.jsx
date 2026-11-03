// @vitest-environment jsdom
import { act } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ServicesProvider from '../context/ServicesProvider.jsx';
import Wizard from '../features/wizard/Wizard.jsx';
import { jsonDatabase } from '../repositories/database.js';
import { createServices } from '../services/container.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const services = createServices(jsonDatabase, '2026-11-02');
let container;
let root;

beforeEach(() => {
  localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<ServicesProvider services={services}><Wizard /></ServicesProvider>));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const heading = () => container.querySelector('#step-heading').textContent;
const stepCount = () => container.querySelector('.step__count').textContent;
const button = (label) => [...container.querySelectorAll('button')].find((b) => b.textContent.includes(label));
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
// Like a real user click: the browser runs the microtask checkpoint (where React re-renders)
// right after the event listeners and before the button's default action. A click dispatched
// from a script postpones that checkpoint, so we flush React from a listener that runs after
// React's own, which reproduces the real order.
const browserClick = async (el) => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  const flush = () => flushSync(() => {});
  document.addEventListener('click', flush);
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  document.removeEventListener('click', flush);
  await new Promise((r) => setTimeout(r, 0));
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
};

describe('Wizard navigation', () => {
  it('"Recomeçar" on the result goes back to the first step with a blank form', async () => {
    click(button('Resultado'));
    expect(stepCount()).toBe('Etapa 6 de 6');
    await browserClick(button('Recomeçar'));
    expect(stepCount()).toBe('Etapa 1 de 6');
    expect(heading()).toBe(services.repositories.formText.step('company').heading);
    expect(JSON.parse(localStorage.getItem('custo-claro:v3')).salary).toBe(0);
  });

  it('"Nova simulação" in the summary also goes back to the first step', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    click(button('Continuar'));
    click(button('Continuar'));
    expect(stepCount()).toBe('Etapa 3 de 6');
    await browserClick(button('Nova simulação'));
    expect(stepCount()).toBe('Etapa 1 de 6');
    expect(button('Nova simulação')).toBeUndefined();
  });
});
