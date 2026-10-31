import { ServicesContext } from './ServicesContext.js';

export default function ServicesProvider({ services, children }) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}
