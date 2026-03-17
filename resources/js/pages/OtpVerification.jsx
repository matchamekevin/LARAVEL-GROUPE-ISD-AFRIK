import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/otp.css";

export default function OtpVerification() {
  const [code, setCode] = useState("");
  const [displayCode, setDisplayCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const user_id = location.state?.user_id;
  const email = location.state?.email;

  const API_BASE = (() => {
    if (typeof window !== "undefined") {
      const { protocol, hostname } = window.location;
      if (["localhost", "127.0.0.1"].includes(hostname)) {
        return `${protocol}//${hostname}:8000`;
      }
      if (import.meta.env.VITE_API_BASE) return import.meta.env.VITE_API_BASE;
      return window.location.origin;
    }
    return import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
  })();

  // Format du code pour l'affichage (masqué ou visible)
  useEffect(() => {
    if (showCode) {
      setDisplayCode(code);
    } else {
      setDisplayCode(code.replace(/\d/g, "•"));
    }
  }, [code, showCode]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!code || code.length < 6) {
      setError("Veuillez entrer un code à 6 chiffres");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await axios.post(
        `${API_BASE}/api/auth/verify-2fa`,
        { user_id, code },
        { withCredentials: true }
      );

      console.log("Réponse verify-2fa:", res.data);

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        if (res.data.user?.id_pays) {
          localStorage.setItem("pays", res.data.user.id_pays);
        }
        window.dispatchEvent(new Event("userUpdated"));

        setSuccess("✓ Connexion réussie");
        setTimeout(() => navigate("/"), 1200);
      } else {
        setError("Réponse inattendue du serveur");
      }
    } catch (err) {
      console.error("Erreur verify-2fa:", err.response?.data || err.message);
      const errorMsg =
        err.response?.data?.message || "Code OTP invalide ou expiré";
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!user_id || resendCooldown > 0) return;
    setError(null);
    setSuccess(null);
    setResendLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE}/api/auth/resend-2fa`,
        { user_id },
        { withCredentials: true }
      );
      setSuccess(res.data.message || "Code renvoyé avec succès");

      if (res.data.code) {
        setSuccess(
          (prev) =>
            (prev ? prev + ` — code: ${res.data.code}` : `code: ${res.data.code}`)
        );
      }

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
      console.error("Erreur resend-2fa:", err.response?.data || err.message);
      setError(
        err.response?.data?.message || "Impossible de renvoyer le code"
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="otp-page-wrapper">
      <div className="otp-container">
        {/* 🎨 Décoration de fond */}
        <div className="otp-bg-decoration"></div>

        <div className="otp-box">
          <h1 className="otp-title">Vérification en deux étapes</h1>
          <p className="otp-subtitle">
            Vérifiez votre identité avec le code envoyé à:
          </p>
          <p className="otp-email">{email}</p>

          {/* Messages */}
          {success && (
            <div className="alert alert-success">
              <i className="fas fa-check-circle"></i>
              <span>{success}</span>
            </div>
          )}
          {error && (
            <div className="alert alert-error">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleVerifyOtp} className="otp-form">
            {/* Input avec toggle visibilité */}
            <div className="otp-input-wrapper">
              <div className="input-group">
                <i className="fas fa-key icon"></i>
                <input
                  type="text"
                  placeholder="000000"
                  value={displayCode}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="input"
                  maxLength="6"
                  inputMode="numeric"
                  required
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowCode(!showCode)}
                  title={showCode ? "Masquer" : "Afficher"}
                >
                  <i className={`fas fa-eye${showCode ? "" : "-slash"}`}></i>
                </button>
              </div>
              <div className="code-progress">
                <div className="progress-bar" style={{ width: `${(code.length / 6) * 100}%` }}></div>
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={isSubmitting || code.length < 6}>
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Vérification...
                </>
              ) : (
                <>
                  <i className="fas fa-check"></i>
                  Vérifier
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="otp-divider">
            <span>Besoin d'aide ?</span>
          </div>

          {/* Resend */}
          <div className="otp-resend">
            <p className="otp-resend-text">Vous n'avez pas reçu le code ?</p>
            <button
              type="button"
              className="otp-resend-btn"
              onClick={handleResend}
              disabled={resendLoading || resendCooldown > 0}
            >
              <i className={`fas fa-${resendLoading ? "spinner fa-spin" : "arrow-rotate-left"}`}></i>
              {resendCooldown > 0
                ? `Renvoyer dans ${resendCooldown}s`
                : "Renvoyer le code"}
            </button>
          </div>

          {/* Info de sécurité */}
          <div className="otp-footer-info">
            <i className="fas fa-shield-alt"></i>
            <p>Vos données sont sécurisées et chiffrées</p>
          </div>
        </div>
      </div>
    </div>
  );
}