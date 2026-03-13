import React, { useState } from "react";
import axios from "axios";

export default function ForgotPassword() {
  const API_BASE = "http://localhost:8000";
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
    setMessage("");
    setError("");

    try {
      const res = await axios.post(
        `${API_BASE}/api/auth/forgot-password`,
        { email }
      );
      setMessage(res.data.message);
      setEmail("");

      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || "Erreur inconnue ❌";
      setError(msg);

      setTimeout(() => setError(""), 3000);
    }
  };

  return (
    <>
      <style>{`
        .container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: #f3f4f6;
        }

        .card {
          width: 100%;
          max-width: 400px;
          background: white;
          padding: 32px;
          border-radius: 10px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .title {
          text-align: center;
          font-size: 24px;
          font-weight: bold;
          color: #1e3a8a;
          margin-bottom: 24px;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .input {
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 16px;
        }

        .input:focus {
          outline: none;
          border-color: #1e3a8a;
          box-shadow: 0 0 0 2px rgba(30, 58, 138, 0.2);
        }

        .button {
          background-color: #1e3a8a;
          color: white;
          padding: 14px;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .button:hover {
          background-color: #1d4ed8;
        }

        .success {
          color: #16a34a;
          margin-top: 16px;
          text-align: center;
        }

        .error {
          color: #dc2626;
          margin-top: 16px;
          text-align: center;
        }
      `}</style>

      <div className="container">
        <div className="card">
          <h2 className="title">Mot de passe oublié</h2>

          <form onSubmit={handleSubmit} className="form">
            <input
              type="email"
              placeholder="Votre email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input"
            />

            <button type="submit" className="button">
              Envoyer le lien
            </button>
          </form>

          {message && (
            <p className="success">{translateMessage(message)}</p>
          )}
          {error && (
            <p className="error">{translateMessage(error)}</p>
          )}
        </div>
      </div>
    </>
  );
}
