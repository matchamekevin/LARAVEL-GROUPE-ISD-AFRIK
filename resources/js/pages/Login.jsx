import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toastError, toastSuccess } from "../utils/toast";
import { tokenService } from "../services/tokenService";
import { apiClient, API_BASE } from "../api/axiosConfig";
// Styles imported globally in app.jsx

function getSafeRedirectTarget(locationState) {
  const target = String(locationState?.from || "/").trim();
  if (!target.startsWith("/") || target.startsWith("//")) {
    return "/";
  }
  return target;
}

function buildPostLoginState(locationState) {
  if (!locationState) return {};

  const payload = {};
  if (locationState.post_login_intent) {
    payload.post_login_intent = locationState.post_login_intent;
  }
  if (locationState.post_login_payload !== undefined) {
    payload.post_login_payload = locationState.post_login_payload;
  }
  return payload;
}

function normalizeAuthMessage(err, fallback) {
  const status = err?.response?.status;
  const raw = err?.response?.data?.message || err?.response?.data?.error || err?.response?.data?.errors || '';

  if (typeof raw === 'string') {
    if (raw.includes('These credentials do not match')) return 'Identifiants invalides';
    if (raw.includes('Ces identifiants ne correspondent pas')) return 'Identifiants invalides';
    if (raw.includes('Identifiants invalides')) return 'Identifiants invalides';
  }

  if (status === 401) return 'Identifiants invalides';
  if (status === 422) return 'Données invalides, veuillez vérifier vos informations';
  if (status === 500) return 'Erreur serveur, veuillez réessayer';

  return raw || err?.message || fallback;
}

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    mot_de_passe: ""
  });

  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.success) {
      toastSuccess(location.state.success);
    }
    if (location.state?.error) {
      toastError(location.state.error);
    }
  }, [location.state]);

  // Ensure inputs remain empty on mount (clear browser autofill if any)
  useEffect(() => {
    setFormData({ email: "", mot_de_passe: "" });
    const clearInputs = () => {
      const elEmail = document.getElementById("email");
      const elPass = document.getElementById("mot_de_passe");
      if (elEmail) elEmail.value = "";
      if (elPass) elPass.value = "";
    };
    // clear immediately and shortly after to counter browser autofill timing
    clearInputs();
    const t = setTimeout(clearInputs, 120);
    return () => clearTimeout(t);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const redirectTarget = getSafeRedirectTarget(location.state);
    const postLoginState = buildPostLoginState(location.state);

    try {
      // 🔐 Obtenir le cookie CSRF pour Sanctum
      await axios.get(`${API_BASE}/sanctum/csrf-cookie`, { withCredentials: true });

      // 📤 Envoi des credentials avec axios (avant le token)
      const res = await axios.post(`${API_BASE}/api/auth/login`, {
        ...formData,
        portal: "client",
      }, { withCredentials: true });

      // 🔐 Si 2FA est requis
      if (res.data.requires_2fa === true) {
        navigate("/verify-otp", { 
          state: { 
            user_id: res.data.user_id, 
            email: res.data.email, 
            portal: "client",
            from: redirectTarget,
            ...postLoginState,
          } 
        });
        return;
      }

      // ✅ Connexion classique - Stocker le token
      if (res.data.token) {
        tokenService.setToken(res.data.token);

        // 👤 Récupérer le profil complet
        const profileRes = await apiClient.get('/api/auth/profile', {
          params: { portal: "client" },
        });

        const user = profileRes.data?.user || profileRes.data;

        if (user) {
          tokenService.setUser(user);
          if (user.id_pays) {
            tokenService.setPays(user.id_pays);
          }
          window.dispatchEvent(new Event("userUpdated"));
        }

        toastSuccess("Connexion réussie ✅");
        setTimeout(() => navigate(redirectTarget, { replace: true, state: postLoginState }), 500);
      } else {
        throw new Error('No token in response');
      }
    } catch (err) {
      console.error("[Login] ❌ ERREUR DÉTAILS:");
      console.error("  Status:", err.response?.status);
      console.error("  Message:", err.response?.data?.message);
      console.error("  Errors:", err.response?.data?.errors);
      console.error("  Full Response:", err.response?.data);

      const errorMsg = normalizeAuthMessage(err, 'Erreur de connexion');
      toastError(errorMsg);
    }
  };

  return (
    <div className="login-page" role="main">
      <div className="login-panel" aria-labelledby="login-heading">
        <section className="login-box" aria-label="Formulaire de connexion">
          <h1 id="login-heading" className="login-title">Connexion</h1>
          <p className="login-subtitle">Accédez à votre espace en toute sécurité.</p>

          <form onSubmit={handleSubmit} className="login-form" noValidate autoComplete="off" spellCheck={false} autoCapitalize="off">
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
                autoComplete="off"
                inputMode="email"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
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
                autoComplete="new-password"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
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
        </section>
      </div>
    </div>
  );
}
