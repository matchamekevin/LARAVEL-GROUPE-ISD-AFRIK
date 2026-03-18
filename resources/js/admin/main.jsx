import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './admin.css';

const el = document.getElementById('admin-root');
if (el) {
  const root = createRoot(el);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.warn('No #admin-root element found — create a blade view with <div id="admin-root"></div>');
}
