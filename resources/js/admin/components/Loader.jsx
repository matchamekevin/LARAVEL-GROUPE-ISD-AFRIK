import React from 'react';

export default function Loader({ text = 'Chargement...' }) {
  return (
    <div className="loader-container">
      <div className="spinner"></div>
      <p className="spinner-text">{text}</p>
    </div>
  );
}
