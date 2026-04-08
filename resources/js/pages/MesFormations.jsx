import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/formation.css";

export default function MesFormations() {
  const [formations, setFormations] = useState([]);
  const API_BASE = (() => {
    if (typeof window !== "undefined") {
      const { protocol, hostname } = window.location;
      if (["localhost", "127.0.0.1"].includes(hostname)) {
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
    axios
      .get(`${API_BASE}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
        },
      })
      .then((res) => {
        console.log("Réponse API :", res.data); // ✅ Vérifie ce qui arrive
        setFormations(res.data.formations || []);
      })
      .catch((err) => console.error("Erreur chargement formations :", err));
  }, []);

  return (
    <div className="formations-container">
      <h1>🎓 Mes Formations</h1>
      {formations.length > 0 ? (
        <div className="formation-grid">
          {formations.map((f) => (
            <div key={f.id_formation} className="formation-card">
              <h3>{f.titre}</h3>
              <p>{f.description}</p>
              <p><strong>📅 Début :</strong> {new Date(f.date_debut).toLocaleDateString()}</p>
              <p><strong>⏱ Durée :</strong> {f.duree}h</p>
              <p><strong>💰 Prix :</strong> {parseInt(f.prix).toLocaleString()} FCFA</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-state">Aucune formation enregistrée.</p>
      )}
    </div>
  );
}
