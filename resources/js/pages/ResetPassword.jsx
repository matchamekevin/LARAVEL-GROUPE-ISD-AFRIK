import React, { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import api from "../axios";

export default function ResetPassword() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const translateMessage = (key) => {
    const messages = {
      "passwords.reset": "Votre mot de passe a été réinitialisé ✅",
      "passwords.token": "Le jeton de réinitialisation est invalide ❌",
      "passwords.user": "Aucun utilisateur trouvé avec cet email ❌",
    };
    return messages[key] || key;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await api.post("/auth/reset-password", {
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });

      setMessage(translateMessage(res.data.message));
      setPassword("");
      setPasswordConfirmation("");

      setTimeout(() => {
        navigate("/login", {
          state: { success: "Mot de passe réinitialisé ✅" },
        });
      }, 2000);
    } catch (err) {
      const msg = err.response?.data?.message || "Erreur inconnue ❌";
      setError(translateMessage(msg));
      setTimeout(() => setError(""), 4000);
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
          background: #ffffff;
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

        .field {
          position: relative;
        }

        .input {
          width: 100%;
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

        .toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
          font-size: 18px;
          color: #6b7280;
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
          <h2 className="title">Réinitialiser le mot de passe</h2>

          <form onSubmit={handleSubmit} className="form">
            {/* Mot de passe */}
            <div className="field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Nouveau mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input"
              />
              <span
                className="toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "👁️" : "🙈"}
              </span>
            </div>

            {/* Confirmation */}
            <div className="field">
              <input
                type={showConfirmation ? "text" : "password"}
                placeholder="Confirmer le mot de passe"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                className="input"
              />
              <span
                className="toggle"
                onClick={() => setShowConfirmation(!showConfirmation)}
              >
                {showConfirmation ? "👁️" : "🙈"}
              </span>
            </div>

            <button type="submit" className="button">
              Réinitialiser
            </button>
          </form>

          {message && <p className="success">{message}</p>}
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    </>
  );
}
