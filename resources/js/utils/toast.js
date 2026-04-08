const subscribers = new Set();

export function subscribeToast(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function notifyToast(toast) {
  try {
    subscribers.forEach((fn) => fn(toast));
  } catch (e) {
    // ignore
  }
}

export function toastError(message, options = {}) {
  notifyToast({
    id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: "error",
    message: String(message || "Erreur"),
    duration: options.duration || 5000,
  });
}

export function toastSuccess(message, options = {}) {
  notifyToast({
    id: `ok-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: "success",
    message: String(message || "Succès"),
    duration: options.duration || 3500,
  });
}

export default {
  subscribe: subscribeToast,
  notify: notifyToast,
  error: toastError,
  success: toastSuccess,
};
