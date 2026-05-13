import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import "../styles/register.css";

const COUNTRY_DIAL_BY_ID = {
  "1": "+228",
  "2": "+229",
  "3": "+226",
  "4": "+225",
  "5": "+227",
};

function normalizePhoneForCountry(rawPhone, idPays) {
  const digits = String(rawPhone || "").replace(/\D/g, "");
  if (!digits) return "";

  const dialCode = COUNTRY_DIAL_BY_ID[String(idPays || "")];
  if (!dialCode) {
    return `+${digits}`;
  }

  const codeDigits = dialCode.replace(/\D/g, "");
  let national = digits;

  if (digits.startsWith(codeDigits)) {
    national = digits.slice(codeDigits.length);
  } else if (digits.startsWith("0")) {
    national = digits.slice(1);
  }

  return `+${codeDigits}${national}`;
}

export default function Register() {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    mot_de_passe: "",
    mot_de_passe_confirmation: "",
    role: "client",
    id_pays: ""
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const normalizedPhone = normalizePhoneForCountry(formData.telephone, formData.id_pays);
      if (!normalizedPhone) {
        toast.error("Numéro de téléphone invalide");
        return;
      }

      const payload = {
        ...formData,
        telephone: normalizedPhone,
      };

      // Ensure cookies & CSRF cookie are set for stateful SPA requests (Sanctum)
      await axios.get("/sanctum/csrf-cookie", { withCredentials: true });
      const res = await axios.post("/api/auth/register", payload, { withCredentials: true });

      toast.success(res.data.message || "Inscription réussie ✅");
      setShowOverlay(true);

      setTimeout(() => {
        setShowOverlay(false);
        navigate("/login", {
          state: { success: "Compte créé avec succès ✅" },
        });
      }, 2000);

      setFormData({
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        mot_de_passe: "",
        mot_de_passe_confirmation: "",
        role: "client",
        id_pays: ""
      });
    } catch (err) {
      if (err.response?.data) {
        const errorMsg =
          err.response.data.errors ||
          err.response.data.message ||
          "Erreur serveur";
        setError(errorMsg);
        toast.error(typeof errorMsg === "object" ? JSON.stringify(errorMsg) : errorMsg);
      } else {
        setError("Erreur réseau");
        toast.error("Erreur réseau");
      }
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h1 className="register-title">Créer un compte</h1>
        <form onSubmit={handleSubmit} className="register-form">
          {/* Nom */}
          <div className="input-group">
            <i className="fas fa-user icon"></i>
            <input
              name="nom"
              placeholder="Nom"
              value={formData.nom}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          {/* Prénom */}
          <div className="input-group">
            <i className="fas fa-user icon"></i>
            <input
              name="prenom"
              placeholder="Prénom"
              value={formData.prenom}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          {/* Email */}
          <div className="input-group">
            <i className="fas fa-envelope icon"></i>
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          {/* Téléphone */}
          <div className="input-group">
            <i className="fas fa-phone icon"></i>
            <input
              name="telephone"
              placeholder="Téléphone"
              value={formData.telephone}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          {/* Pays */}
          <div className="input-group">
            <i className="fas fa-globe icon"></i>
            <select
              name="id_pays"
              value={formData.id_pays}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="">-- Sélectionnez votre pays --</option>
              <option value="1">Togo</option>
              <option value="2">Bénin</option>
              <option value="3">Burkina Faso</option>
              <option value="4">Côte d’Ivoire</option>
              <option value="5">Niger</option>
              <option value="6">Autres</option>
            </select>
          </div>

          {/* Mot de passe */}
          <div className="input-group">
            <i className="fas fa-lock icon"></i>
            <input
              type={showPassword ? "text" : "password"}
              name="mot_de_passe"
              placeholder="Mot de passe"
              value={formData.mot_de_passe}
              onChange={handleChange}
              className="input"
              required
            />
            <i
              className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} toggle-icon`}
              onClick={() => setShowPassword(!showPassword)}
            ></i>
          </div>

          {/* Confirmation mot de passe */}
          <div className="input-group">
            <i className="fas fa-lock icon"></i>
            <input
              type={showConfirm ? "text" : "password"}
              name="mot_de_passe_confirmation"
              placeholder="Confirmer mot de passe"
              value={formData.mot_de_passe_confirmation}
              onChange={handleChange}
              className="input"
              required
            />
            <i
              className={`fas ${showConfirm ? "fa-eye-slash" : "fa-eye"} toggle-icon`}
              onClick={() => setShowConfirm(!showConfirm)}
            ></i>
          </div>

          <input type="hidden" name="role" value="client" />
          <button type="submit" className="submit-btn">Inscription</button>
        </form>

        <div className="login-redirect">
          Vous avez déjà un compte ?{" "}
          <Link to="/login" className="login-link">Connectez-vous ici</Link>
        </div>

        {/* Overlay de succès */}
        {showOverlay && (
          <div className="overlay-success">
            <i className="fas fa-check-circle"></i>
            <p>Inscription réussie !</p>
          </div>
        )}
      </div>
    </div>
  );
}
