import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import ServicesProvider from './context/ServicesProvider.jsx';
import './index.css';
import { resolveReferenceDate, todayInBrazil } from './lib/referenceDate.js';
import { jsonDatabase } from './repositories/database.js';
import { createServices } from './services/container.js';

// Repositories throw when a table has no version for the date; running the default form once
// surfaces that here instead of during render.
function checkedServices(date) {
  const services = createServices(jsonDatabase, date);
  services.calculator.calculate(services.formDefaults.defaults());
  return services;
}

// A ?data= outside the dates the database covers falls back to today instead of a blank page.
function servicesFor(search) {
  const requested = resolveReferenceDate(search);
  try {
    return checkedServices(requested);
  } catch (error) {
    const today = todayInBrazil();
    if (requested === today) throw error;
    console.warn(`Sem regras para ${requested}; usando ${today}.`, error);
    return checkedServices(today);
  }
}

const root = createRoot(document.getElementById('root'));

try {
  const services = servicesFor(window.location.search);
  root.render(
    <StrictMode>
      <ServicesProvider services={services}>
        <App />
      </ServicesProvider>
    </StrictMode>,
  );
} catch (error) {
  console.error(error);
  root.render(
    <main className="container">
      <h1>Não foi possível carregar a calculadora</h1>
      <p>Recarregue a página. Se o problema continuar, tente mais tarde.</p>
    </main>,
  );
}
