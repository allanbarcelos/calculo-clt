import { useEffect, useState } from 'react';

// State mirrored in localStorage. Storage failures (private mode) are ignored.
export function usePersistentState(key, defaults) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // The calculator still works without storage.
    }
  }, [key, state]);

  return [state, setState];
}
