import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import AutoRefreshProvider from '../providers/AutoRefreshProvider';
import './admin.css';

const INIT_LOADER_MIN_MS = 800;

function waitForStylesheet(partialHref, timeout = 3000) {
  return new Promise((resolve) => {
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    const match = links.find((l) => l.href && l.href.includes(partialHref));
    if (match) {
      if (match.sheet) return resolve();
      match.addEventListener('load', () => resolve());
      setTimeout(() => resolve(), timeout);
      return;
    }
    resolve();
  });
}

function hideInitLoader() {
  const el = document.querySelector(".init-loader");
  if (!el) return;
  el.style.opacity = "0";
  setTimeout(() => {
    if (el.parentNode) el.remove();
  }, 400);
}

function BootstrappedApp() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), INIT_LOADER_MIN_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ready) hideInitLoader();
  }, [ready]);

  return (
    <React.StrictMode>
      <AutoRefreshProvider>
        <App />
      </AutoRefreshProvider>
    </React.StrictMode>
  );
}

const el = document.getElementById('admin-root');
if (el) {
  waitForStylesheet('admin.css', 3000).then(() => {
    const root = createRoot(el);
    root.render(<BootstrappedApp />);
  });
} else {
  console.warn('No #admin-root element found — create a blade view with <div id="admin-root"></div>');
}
