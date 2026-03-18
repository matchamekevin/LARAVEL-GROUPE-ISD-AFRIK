export function getApiBase() {
  const envBaseRaw = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL || "";
  const envBase = envBaseRaw ? envBaseRaw.replace(/\/$/, "") : "";

  if (typeof window !== "undefined") {
    const { protocol, hostname, origin } = window.location;
    const hostIsLocal = ["localhost", "127.0.0.1"].includes(hostname);

    if (hostIsLocal) {
      return `${protocol}//${hostname}:8000`;
    }

    if (envBase) {
      const envLooksLocal = /localhost|127\.0\.0\.1/i.test(envBase);
      if (!envLooksLocal) {
        return envBase;
      }
    }

    return origin;
  }

  return envBase;
}
