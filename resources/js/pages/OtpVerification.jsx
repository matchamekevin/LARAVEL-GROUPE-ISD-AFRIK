import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { tokenService } from "../services/tokenService";
import { apiClient } from "../api/axiosConfig";
import "../styles/otp.css";

export default function OtpVerification() {
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const lastAutoSubmittedCodeRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const user_id = location.state?.user_id;
  const email = location.state?.email;
  const portal = location.state?.portal || "client";
  const redirectTarget = useMemo(
    () => (String(location.state?.from || "/").startsWith("/") ? String(location.state?.from || "/") : "/"),
    [location.state?.from]
  );
  const postLoginState = useMemo(() => ({
    ...(location.state?.post_login_intent ? { post_login_intent: location.state.post_login_intent } : {}),
    ...(location.state?.post_login_payload !== undefined
      ? { post_login_payload: location.state.post_login_payload }
      : {}),
  }), [location.state?.post_login_intent, location.state?.post_login_payload]);

  const verifyOtp = useCallback(async (otpCode) => {
    setError(null);
    setSuccess(null);

    if (!otpCode || otpCode.length < 6) {
      setError("Veuillez entrer un code à 6 chiffres");
      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await apiClient.post(
        `/api/auth/verify-2fa`,
        { user_id, code: otpCode, portal }
      );

      if (res.data.token) {
        tokenService.setToken(res.data.token);
        tokenService.setUser(res.data.user);
        if (res.data.user?.id_pays) {
          tokenService.setPays(res.data.user.id_pays);
        }
        window.dispatchEvent(new Event("userUpdated"));

        setSuccess("✓ Connexion réussie");
        setTimeout(() => navigate(redirectTarget, { replace: true, state: postLoginState }), 500);
      } else {
        setError("Réponse inattendue du serveur");
      }
    } catch (err) {
      console.error("[OTP] ❌ Erreur verify-2fa:", err.response?.data || err.message);
      const errorMsg =
        err.response?.data?.message || "Code OTP invalide ou expiré";
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, navigate, portal, redirectTarget, postLoginState, user_id]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    await verifyOtp(code);
  };

  const handleResend = async () => {
    if (!user_id || resendCooldown > 0) return;
    setError(null);
    setSuccess(null);
    setResendLoading(true);

    try {
      console.log('[OTP] 📨 Demande de renvoi OTP');
      const res = await apiClient.post(
        `/api/auth/resend-2fa`,
        { user_id, portal }
      );
      console.log('[OTP] ✅ OTP renvoyé:', res.data);
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
      console.error("[OTP] ❌ Erreur resend-2fa:", err.response?.data || err.message);
      setError(
        err.response?.data?.message || "Impossible de renvoyer le code"
      );
    } finally {
      setResendLoading(false);
    }
  };

  const sanitizeOtp = (value) => value.replace(/\D/g, "").slice(0, 6);

  const handleCodeInput = (e) => {
    setCode(sanitizeOtp(e.target.value || ""));
  };

  const handleCodePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    setCode(sanitizeOtp(pastedText));
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const codeFromUrl = sanitizeOtp(params.get("code") || "");

    if (codeFromUrl.length === 6) {
      setCode(codeFromUrl);
    }
  }, [location.search]);

  useEffect(() => {
    if (code.length < 6) {
      lastAutoSubmittedCodeRef.current = null;
      return;
    }

    if (lastAutoSubmittedCodeRef.current === code || isSubmitting) {
      return;
    }

    lastAutoSubmittedCodeRef.current = code;
    verifyOtp(code);
  }, [code, isSubmitting, verifyOtp]);

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
              <div className="otp-input-group">
                <i className="fas fa-key icon"></i>
                <input
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={handleCodeInput}
                  onPaste={handleCodePaste}
                  className="otp-input"
                  maxLength="6"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  spellCheck="false"
                  style={{ WebkitTextSecurity: showCode ? "none" : "disc" }}
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

            <button type="submit" className="otp-submit-btn" disabled={isSubmitting || code.length < 6}>
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
