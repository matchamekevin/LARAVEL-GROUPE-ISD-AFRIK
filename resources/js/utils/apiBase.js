export function getApiBase() {
  if (typeof window !== "undefined") {
    const { hostname, origin } = window.location;
    const hostIsLocal = ["localhost", "127.0.0.1"].includes(hostname);

    if (hostIsLocal) {
      return origin;
    }

    const envBaseRaw = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL || "";
    if (envBaseRaw) {
      return envBaseRaw.replace(/\/$/, "");
    }

    return origin;
  }

  return "";
}
