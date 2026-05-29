import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const key = import.meta.env.VITE_REVERB_APP_KEY;
const host = import.meta.env.VITE_REVERB_HOST || 'localhost';
const port = import.meta.env.VITE_REVERB_PORT || '8080';
const scheme = import.meta.env.VITE_REVERB_SCHEME || 'http';

let echoInstance = null;

export function getEcho() {
  if (echoInstance) return echoInstance;

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key,
    wsHost: host,
    wsPort: Number(port),
    wssPort: Number(port),
    forceTLS: scheme === 'https',
    encrypted: scheme === 'https',
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
  });

  return echoInstance;
}

export function disconnectEcho() {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
}
