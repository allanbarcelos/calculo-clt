import { useEffect, useState } from 'react';

// State mirrored in localStorage. Storage failures (private mode) are ignored. restore turns
// what was stored (possibly from an older version of the site) into valid state.
export function usePersistentState(key, defaults, restore = (stored) => ({ ...defaults, ...stored })) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? restore(JSON.parse(raw)) : defaults;
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
