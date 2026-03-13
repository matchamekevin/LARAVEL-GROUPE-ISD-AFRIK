import React, { useEffect, useState } from "react";
import api from "../../axios";

export default function Commandes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setMessage("");
    try {
      const res = await api.get("/admin/commandes");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setMessage(err.response?.data?.message || "Erreur chargement commandes");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function badgeColor(statut) {
    if (statut === "payée" || statut === "payee") return "admin-badge--success";
    if (statut === "annulée" || statut === "annulee") return "admin-badge--danger";
    return "";
  }

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h3>Commandes</h3>
        <span className="admin-muted">{items.length} commande(s)</span>
      </div>
      {message && <div className="admin-alert">{message}</div>}
      {loading ? <div className="admin-muted">Chargement...</div> : (
        <table className="admin-table">
          <thead>
            <tr><th>N° Commande</th><th>Client</th><th>Montant (XOF)</th><th>Statut</th><th>Date</th></tr>
          </thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan="5" className="admin-muted">Aucune commande</td></tr>}
            {items.map((c) => (
              <tr key={c.id_commande || c.id}>
                <td><strong>{c.numero_commande || `CMD-${c.id_commande}`}</strong></td>
                <td>{c.utilisateur ? `${c.utilisateur.prenom || ""} ${c.utilisateur.nom || ""}`.trim() : "-"}</td>
                <td>{Number(c.montant_total || 0).toLocaleString()}</td>
                <td><span className={`admin-badge ${badgeColor(c.statut)}`}>{c.statut || "en_attente"}</span></td>
                <td className="admin-muted">{c.date_commande ? new Date(c.date_commande).toLocaleDateString("fr-FR") : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
