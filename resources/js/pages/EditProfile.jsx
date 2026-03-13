import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function EditProfile() {
  const API_BASE = "http://localhost:8000";
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
        },
      })
      .then((res) => setForm(res.data))
      .catch(() => setError("Impossible de charger le profil"));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await axios.put(`${API_BASE}/api/auth/update-profile`, form, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
        },
      });
      alert("Profil mis à jour avec succès !");
      navigate("/profile");
    } catch {
      setError("Erreur lors de la mise à jour du profil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ===== CSS INTÉGRÉ ===== */}
      <style>{`
        .page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: #f3f4f6;
        }

        .card {
          width: 100%;
          max-width: 500px;
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

        .error {
          color: #dc2626;
          font-weight: 600;
          margin-bottom: 16px;
          text-align: center;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .field label {
          display: block;
          margin-bottom: 6px;
          font-weight: 600;
          color: #374151;
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

        .button:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>

      <div className="page">
        <div className="card">
          <h2 className="title">Modifier mon profil</h2>

          {error && <p className="error">{error}</p>}

          <form onSubmit={handleSubmit} className="form">
            <div className="field">
              <label>Nom</label>
              <input
                type="text"
                name="nom"
                value={form.nom}
                onChange={handleChange}
                required
                className="input"
              />
            </div>

            <div className="field">
              <label>Prénom</label>
              <input
                type="text"
                name="prenom"
                value={form.prenom}
                onChange={handleChange}
                required
                className="input"
              />
            </div>

            <div className="field">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="input"
              />
            </div>

            <div className="field">
              <label>Téléphone</label>
              <input
                type="text"
                name="telephone"
                value={form.telephone || ""}
                onChange={handleChange}
                className="input"
              />
            </div>

            <button type="submit" disabled={loading} className="button">
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
