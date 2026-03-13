import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/otp.css";

export default function OtpVerification() {
  const [code, setCode] = useState(""); // 🔹 champ OTP
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const API_BASE = "http://localhost:8000";

  // 🔹 Données récupérées depuis Login.jsx
  const user_id = location.state?.user_id;
  const email = location.state?.email;

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const res = await axios.post(`${API_BASE}/api/auth/verify-2fa`, {
        user_id,
        code,
      });

      console.log("Réponse verify-2fa:", res.data); // ✅ debug

      if (res.data.token) {
        // ✅ Sauvegarde du token et user
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        if (res.data.user?.id_pays) {
          localStorage.setItem("pays", res.data.user.id_pays);
        }
        window.dispatchEvent(new Event("userUpdated"));

        setSuccess("Connexion réussie ✅");
        setTimeout(() => navigate("/"), 1000);
      } else {
        setError("Réponse inattendue du serveur ❌");
      }
    } catch (err) {
      console.error("Erreur verify-2fa:", err.response?.data || err.message);
      setError(
        err.response?.data?.message || "Code OTP invalide ou expiré ❌"
      );
    }
  };

  const handleResend = async () => {
    if (!user_id || resendCooldown > 0) return;
    setError(null);
    setSuccess(null);
    setResendLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/api/auth/resend-2fa`, { user_id }, { withCredentials: true });
      setSuccess(res.data.message || 'Code renvoyé');

      // Si en dev, afficher le code reçu dans la réponse
      if (res.data.code) {
        setSuccess((prev) => (prev ? prev + ` — code: ${res.data.code}` : `code: ${res.data.code}`));
      }

      // Activer cooldown de 30s
      setResendCooldown(30);
      const interval = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) {
            clearInterval(interval);
            return 0;
          }
          return c - 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Erreur resend-2fa:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Impossible de renvoyer le code');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    // 🎯 WRAPPER D'ISOLATION AJOUTÉ ICI
    <div className="otp-page-wrapper">
      <div className="otp-container">
        <div className="otp-box">
          <h1 className="otp-title">Vérification en deux étapes</h1>
          <p>Un code a été envoyé à {email}</p>

          {success && <div className="success-msg">✅ {success}</div>}
          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleVerifyOtp} className="otp-form">
            <div className="input-group">
              <i className="fas fa-key icon"></i>
              <input
                type="text"
                placeholder="Entrez votre code OTP"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="input"
                required
              />
            </div>

            <button type="submit" className="submit-btn">
              <i className="fas fa-check"></i> Vérifier
            </button>
          </form>
          <div className="otp-resend">
            <p className="otp-resend-text">Vous n'avez pas recu le code ?</p>
            <button
              type="button"
              className="otp-resend-btn"
              onClick={handleResend}
              disabled={resendLoading || resendCooldown > 0}
            >
              <i className="fas fa-redo"></i>
              {resendCooldown > 0
                ? ` Renvoyer l'OTP (${resendCooldown}s)`
                : " Renvoyer l'OTP"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}