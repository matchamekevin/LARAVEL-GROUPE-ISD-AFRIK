import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const API_BASE = (() => {
    if (typeof window !== "undefined") {
      const { protocol, hostname } = window.location;
      if (["localhost", "127.0.0.1"].includes(hostname)) {
        return `${protocol}//${hostname}:8000`;
      }
      if (import.meta.env.VITE_API_BASE) {
        const envBase = import.meta.env.VITE_API_BASE.replace(/\/$/, "");
        const envLooksLocal = /localhost|127\.0\.0\.1/i.test(envBase);
        const hostIsLocal = ["localhost", "127.0.0.1"].includes(hostname);
        if (!envLooksLocal || hostIsLocal) return envBase;
      }
      return window.location.origin;
    }
    return "";
  })();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const translateMessage = (key) => {
    const messages = {
      "passwords.sent": "Lien envoyé à votre email ✅",
      "passwords.user": "Aucun utilisateur trouvé avec cet email ❌",
      "passwords.throttled": "Veuillez patienter avant de réessayer ❌",
      "passwords.token": "Le jeton de réinitialisation est invalide ❌",
      "passwords.reset": "Votre mot de passe a été réinitialisé ✅",
    };
    return messages[key] || key;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        `${API_BASE}/api/auth/forgot-password`,
        { email },
        { withCredentials: true }
      );
      const msg = res.data.message || "passwords.sent";
      toast.success(translateMessage(msg));
      setEmail("");
    } catch (err) {
      const msg = err.response?.data?.message || "passwords.user";
      toast.error(translateMessage(msg));
    }
  };

  return (
    <div className="login-page" role="main">
      <div className="login-panel" aria-labelledby="forgot-heading">
        <section className="login-box" aria-label="Mot de passe oublié">
          <h1 id="forgot-heading" className="login-title">Mot de passe oublié</h1>
          <p className="login-subtitle">Entrez votre email pour recevoir le lien de réinitialisation.</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <i className="fas fa-envelope icon" aria-hidden="true"></i>
              <input
                type="email"
                name="email"
                placeholder="Votre email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <button type="submit" className="submit-btn">Envoyer le lien</button>
          </form>

          <div className="forgot-row">
            <Link to="/login" className="forgot-link">Retour à la connexion</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
