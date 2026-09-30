// Tiny pub/sub so pages can tell the floating Sarthi assistant what the
// student is looking at, without prop drilling or a new state library.
let context = {};

export const CONTEXT_EVENT = "shikshasetu:sarthi-context";
export const OPEN_EVENT = "shikshasetu:sarthi-open";

export const publishSarthiContext = (patch) => {
  context = { ...context, ...patch };
  window.dispatchEvent(new CustomEvent(CONTEXT_EVENT));
};

export const clearSarthiContext = (keys) => {
  const next = { ...context };
  keys.forEach((k) => delete next[k]);
  context = next;
  window.dispatchEvent(new CustomEvent(CONTEXT_EVENT));
};

export const getSarthiContext = () => context;

export const openSarthi = (message = "") =>
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { message } }));
