import React, { useEffect, useState } from "react";
import axios from "axios";

export default function MesProduits() {
  const [produits, setProduits] = useState([]);
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

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
        },
      })
      .then((res) => setProduits(res.data.produits || []))
      .catch((err) => console.error("Erreur API :", err));
  }, []);

  return (
    <div className="profile-card">
      <h2>Mes Produits 📦</h2>
      {produits.length > 0 ? (
        <ul>
          {produits.map((p, i) => (
            <li key={i}>
              {p.nom} — {p.prix} FCFA
            </li>
          ))}
        </ul>
      ) : (
        <p>Aucun produit enregistré.</p>
      )}
    </div>
  );
}
