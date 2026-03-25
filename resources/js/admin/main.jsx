import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './admin.css';

function waitForStylesheet(partialHref, timeout = 3000) {
  return new Promise((resolve) => {
    // Try to find a matching <link rel="stylesheet"> first
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    const match = links.find((l) => l.href && l.href.includes(partialHref));
    if (match) {
      if (match.sheet) return resolve();
      match.addEventListener('load', () => resolve());
      // Fallback: resolve after timeout
      setTimeout(() => resolve(), timeout);
      return;
    }

    // If no link found, styles may be inlined by Vite — resolve immediately
    resolve();
  });
}

const el = document.getElementById('admin-root');
if (el) {
  // Wait for admin.css to be loaded to avoid FOUC (flash of unstyled content)
  waitForStylesheet('admin.css', 3000).then(() => {
    const root = createRoot(el);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });
} else {
  console.warn('No #admin-root element found — create a blade view with <div id="admin-root"></div>');
}
