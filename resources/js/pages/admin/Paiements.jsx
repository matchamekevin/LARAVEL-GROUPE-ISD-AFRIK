import React, { useEffect, useState } from "react";
import api from "../../axios";

export default function Paiements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setMessage("");
    try {
      const res = await api.get("/admin/paiements");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setMessage(err.response?.data?.message || "Erreur chargement paiements");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function badgeColor(statut) {
    if (statut === "réussi" || statut === "reussi") return "admin-badge--success";
    if (statut === "échoué" || statut === "echoue") return "admin-badge--danger";
    return "";
  }

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h3>Paiements</h3>
        <span className="admin-muted">{items.length} paiement(s)</span>
      </div>
      {message && <div className="admin-alert">{message}</div>}
      {loading ? <div className="admin-muted">Chargement...</div> : (
        <table className="admin-table">
          <thead>
            <tr><th>Reference</th><th>Formation</th><th>Utilisateur</th><th>Montant (XOF)</th><th>Moyen</th><th>Statut</th><th>Date</th></tr>
          </thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan="7" className="admin-muted">Aucun paiement</td></tr>}
            {items.map((p) => (
              <tr key={p.id_paiement || p.id}>
                <td className="admin-muted" style={{fontSize: "12px"}}>{p.reference_transaction || "-"}</td>
                <td>{p.formation?.titre || "-"}</td>
                <td>{p.utilisateur ? `${p.utilisateur.prenom || ""} ${p.utilisateur.nom || ""}`.trim() : "-"}</td>
                <td><strong>{Number(p.montant).toLocaleString()}</strong></td>
                <td>{p.moyen_paiement || "-"}</td>
                <td><span className={`admin-badge ${badgeColor(p.statut_paiement)}`}>{p.statut_paiement}</span></td>
                <td className="admin-muted">{p.date_paiement ? new Date(p.date_paiement).toLocaleDateString("fr-FR") : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
