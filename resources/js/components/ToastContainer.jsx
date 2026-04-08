import React, { useEffect, useState } from "react";
import { subscribeToast } from "../utils/toast";
import "../styles/toast.css";

function ToastItem({ toast, onClose }) {
  const { id, type, message } = toast;

  return (
    <div className={`toast-item toast-${type || "info"}`} role="status" aria-live="polite">
      <div className="toast-body">
        <div className="toast-message">{message}</div>
        <button className="toast-close" onClick={() => onClose(id)} aria-label="Fermer">×</button>
      </div>
    </div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsub = subscribeToast((toast) => {
      setToasts((prev) => [...prev, toast]);
      const duration = toast.duration || 4000;
      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, duration);
      }
    });

    return () => unsub();
  }, []);

  const handleClose = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={handleClose} />
      ))}
    </div>
  );
}
