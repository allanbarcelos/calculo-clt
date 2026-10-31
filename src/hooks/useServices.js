import { useContext } from 'react';
import { ServicesContext } from '../context/ServicesContext.js';

export function useServices() {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices must be used inside <ServicesProvider>');
  return services;
}
