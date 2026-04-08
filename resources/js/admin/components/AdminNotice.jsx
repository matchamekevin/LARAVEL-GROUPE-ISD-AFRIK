import React from 'react';

export default function AdminNotice({ type = 'info', message, className = '' }) {
  if (!message) return null;

  const safeType = ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info';
  const extraClass = className ? ` ${className}` : '';

  return <div className={`admin-notice ${safeType}${extraClass}`}>{message}</div>;
}
