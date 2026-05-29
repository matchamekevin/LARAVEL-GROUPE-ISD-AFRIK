function isDevHostname(hostname) {
  if (!hostname) return false;
  
  // localhost, loopback, or local domains (.local, .test)
  if (["localhost", "127.0.0.1", "::1"].includes(hostname)) return true;
  if (hostname.endsWith(".local") || hostname.endsWith(".test")) return true;
  
  // ngrok tunnels
  if (hostname.endsWith(".ngrok-free.dev") || hostname.endsWith(".ngrok.io")) return true;
  
  // Local network IP addresses (192.168.x.x, 10.x.x.x, 172.16.x.x-172.31.x.x)
  if (/^192\.168\./.test(hostname)) return true;
  if (/^10\./.test(hostname)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) return true;
  
  return false;
}

export function getApiBase() {
  if (typeof window !== "undefined") {
    const { hostname, origin } = window.location;

    if (isDevHostname(hostname)) {
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
