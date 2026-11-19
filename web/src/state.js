// Estado compartido entre la vista del círculo (main.js) y el resto del panel.
const listeners = new Set();
export const state = { circle: null, deployment: null, address: null, lang: "es" };

export function setState(patch) {
  Object.assign(state, patch);
  for (const fn of listeners) fn(state);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
