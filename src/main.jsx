import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import ServicesProvider from './context/ServicesProvider.jsx';
import './index.css';
import { resolveReferenceDate } from './lib/referenceDate.js';
import { jsonDatabase } from './repositories/database.js';
import { createServices } from './services/container.js';

const services = createServices(jsonDatabase, resolveReferenceDate(window.location.search));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ServicesProvider services={services}>
      <App />
    </ServicesProvider>
  </StrictMode>,
);
