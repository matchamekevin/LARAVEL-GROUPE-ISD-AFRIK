import React, { useEffect } from "react";

export default function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onCancel?.(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-title">{title || "Confirmation"}</h3>
        <p className="confirm-message">{message || "Voulez-vous continuer ?"}</p>
        <div className="confirm-actions">
          <button type="button" className="confirm-btn confirm-btn--cancel" onClick={onCancel}>
            {cancelLabel || "Annuler"}
          </button>
          <button type="button" className="confirm-btn confirm-btn--confirm" onClick={onConfirm}>
            {confirmLabel || "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  );
}
