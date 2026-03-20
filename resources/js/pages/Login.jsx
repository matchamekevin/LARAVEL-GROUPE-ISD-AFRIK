import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation, Link } from "react-router-dom";
// Styles imported globally in app.jsx

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    mot_de_passe: ""
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const API_BASE = (() => {
    if (typeof window !== "undefined") {
      const { protocol, hostname } = window.location;
      if (["localhost", "127.0.0.1"].includes(hostname)) {
        // In local dev, always stick to the current host to avoid localhost/127 cross-site issues.
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

  useEffect(() => {
    if (location.state?.success) {
      setSuccess(location.state.success);
      setTimeout(() => setSuccess(null), 3000);
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Obtenir le cookie CSRF pour les requêtes stateful (Sanctum)
      await axios.get(`${API_BASE}/sanctum/csrf-cookie`, { withCredentials: true });

      const res = await axios.post(`${API_BASE}/api/auth/login`, formData, { withCredentials: true });

      console.log("Réponse login:", res.data); // ✅ debug

      // 🔐 Si 2FA est requis, rediriger vers la page OTP
      if (res.data.requires_2fa === true) {
        navigate("/verify-otp", { state: { user_id: res.data.user_id, email: res.data.email } });
        return;
      }

      // ✅ Connexion classique
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);

        const profil = await axios.get(`${API_BASE}/api/auth/profile`, {
          headers: {
            Authorization: `Bearer ${res.data.token}`,
          },
        });

        const user = profil.data.user ? profil.data.user : profil.data;

        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
          if (user.id_pays) {
            localStorage.setItem("pays", user.id_pays);
          }
          window.dispatchEvent(new Event("userUpdated"));
        }

        setSuccess("Connexion réussie ✅");
        setTimeout(() => navigate("/"), 1000);
      }
    } catch (err) {
      console.error("Erreur Axios:", err);
      if (err.response && err.response.data) {
        setError(
          err.response.data.errors ||
          err.response.data.message ||
          "Erreur serveur"
        );
      } else {
        setError("Erreur réseau");
      }
    }
  };

  return (
    <div className="login-page" role="main">
      <div className="login-panel" aria-labelledby="login-heading">
        <section className="login-box" aria-label="Formulaire de connexion">
          <h1 id="login-heading" className="login-title">Connexion</h1>
          <p className="login-subtitle">Accédez à votre espace en toute sécurité.</p>

          {success && <div className="success-msg">✅ {success}</div>}

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <label className="sr-only" htmlFor="email">Email</label>
            <div className="input-group">
              <i className="fas fa-envelope icon" aria-hidden="true"></i>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                required
                aria-required="true"
                aria-label="Email"
                autoComplete="email"
                inputMode="email"
              />
            </div>

            <label className="sr-only" htmlFor="mot_de_passe">Mot de passe</label>
            <div className="input-group">
              <i className="fas fa-lock icon" aria-hidden="true"></i>
              <input
                id="mot_de_passe"
                type={showPassword ? "text" : "password"}
                name="mot_de_passe"
                placeholder="Mot de passe"
                value={formData.mot_de_passe}
                onChange={handleChange}
                className="input"
                required
                aria-required="true"
                aria-label="Mot de passe"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="icon-button toggle-icon"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
              </button>
            </div>

            <button type="submit" className="submit-btn">
              <i className="fas fa-sign-in-alt" aria-hidden="true"></i>
              <span>Se connecter</span>
            </button>
          </form>

          <div className="forgot-row">
            <Link to="/forgot-password" className="forgot-link">Mot de passe oublié ?</Link>
          </div>

          <div className="register-row">
            <Link to="/register" className="register-link">Créer un compte</Link>
          </div>

          {error && (
            <div className="error-msg" role="alert">
              ❌ {typeof error === "object" ? JSON.stringify(error) : error}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}