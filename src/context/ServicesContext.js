import { createContext } from 'react';

// Components depend on this abstraction, not on concrete repositories (dependency inversion).
export const ServicesContext = createContext(null);
