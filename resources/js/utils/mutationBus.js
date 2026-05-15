const MUTATION_KEY = "_isd_mutation";

export function notifyMutation() {
  const ts = String(Date.now());
  try {
    localStorage.setItem(MUTATION_KEY, ts);
  } catch {
    // localStorage may be unavailable
  }
  try {
    window.dispatchEvent(new CustomEvent("isd-mutation", { detail: { ts } }));
  } catch {
    // CustomEvent may fail in some environments
  }
}

export function getMutationTimestamp() {
  try {
    return Number(localStorage.getItem(MUTATION_KEY) || 0);
  } catch {
    return 0;
  }
}
