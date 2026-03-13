import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const API_BASE = "http://localhost:8000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setLoading(true);

      const res = await axios.post(
        `${API_BASE}/api/auth/change-password`,
        {
          old: oldPassword,
          new: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            Accept: "application/json",
          },
        }
      );

      setSuccess(res.data.message);

      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Erreur lors du changement du mot de passe"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ===== CSS INTÉGRÉ ===== */}
      <style>{`
        .page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #f3f4f6;
          padding: 16px;
        }

        .card {
          width: 100%;
          max-width: 420px;
          background: #ffffff;
          border-radius: 14px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          padding: 24px;
        }

        .title {
          text-align: center;
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 24px;
          color: #1f2937;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 4px;
          display: block;
        }

        .input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
        }

        .input:focus {
          outline: none;
          border-color: #1e3a8a;
          box-shadow: 0 0 0 2px rgba(30, 58, 138, 0.2);
        }

        .show {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #4b5563;
        }

        .message-error {
          background: #fee2e2;
          color: #b91c1c;
          padding: 10px;
          border-radius: 6px;
          font-size: 13px;
        }

        .message-success {
          background: #dcfce7;
          color: #15803d;
          padding: 10px;
          border-radius: 6px;
          font-size: 13px;
        }

        .actions {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }

        .btn-primary {
          flex: 1;
          background-color: #1e3a8a;
          color: white;
          padding: 10px;
          border-radius: 8px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-primary:hover {
          background-color: #1e40af;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          flex: 1;
          background-color: #e0e7ff;
          color: #1e3a8a;
          padding: 10px;
          border-radius: 8px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-secondary:hover {
          background-color: #c7d2fe;
        }
      `}</style>

      <div className="page">
        <div className="card">
          <h2 className="title">🔐 Changer le mot de passe</h2>

          <form onSubmit={handleSubmit} className="form">
            <div>
              <label>Ancien mot de passe</label>
              <input
                type={show ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                className="input"
              />
            </div>

            <div>
              <label>Nouveau mot de passe</label>
              <input
                type={show ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="input"
              />
            </div>

            <div className="show">
              <input
                type="checkbox"
                checked={show}
                onChange={() => setShow(!show)}
              />
              <span>Afficher les mots de passe</span>
            </div>

            {error && <div className="message-error">❌ {error}</div>}
            {success && <div className="message-success">✅ {success}</div>}

            <div className="actions">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? "Modification..." : "Changer"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="btn-secondary"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
