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

function createToast(type, message, options = {}) {
  notifyToast({
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    message: String(message || ""),
    duration: options.duration || (type === "success" ? 3500 : 5000),
  });
}

export function toastError(message, options = {}) {
  createToast("error", message || "Une erreur est survenue", options);
}

export function toastSuccess(message, options = {}) {
  createToast("success", message || "Opération réussie", options);
}

export function toastWarning(message, options = {}) {
  createToast("warning", message || "Attention", options);
}

export function toastInfo(message, options = {}) {
  createToast("info", message || "Information", options);
}

const toast = {
  subscribe: subscribeToast,
  notify: notifyToast,
  error: toastError,
  success: toastSuccess,
  warning: toastWarning,
  info: toastInfo,
};

export default toast;
