import React, { useEffect, useState } from "react";
import api from "../../axios";

export default function Formations() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ titre: "", description: "", duree: "", prix: "", categorie: "particulier", date_debut: "", places_disponibles: "", id_pays: 1 });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setMessage("");
    try {
      const res = await api.get("/formations");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setMessage(err.response?.data?.message || "Erreur chargement formations");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (showForm) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [showForm]);

  function openNew() {
    setEditing(null);
    setForm({ titre: "", description: "", duree: "", prix: "", categorie: "particulier", date_debut: "", places_disponibles: "", id_pays: 1 });
    setShowForm(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      titre: item.titre || "", description: item.description || "", duree: item.duree || "",
      prix: item.prix || "", categorie: item.categorie || "particulier",
      date_debut: item.date_debut ? item.date_debut.slice(0, 10) : "",
      places_disponibles: item.places_disponibles || "", id_pays: item.id_pays || 1,
    });
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      if (editing) {
        await api.put(`/formations/${editing.id_formation || editing.id}`, form);
        setMessage("Formation mise a jour");
      } else {
        await api.post("/formations", form);
        setMessage("Formation creee");
      }
      setShowForm(false);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || JSON.stringify(err.response?.data?.errors || "Erreur"));
    } finally { setSaving(false); }
  }

  async function handleDelete(item) {
    if (!confirm(`Supprimer "${item.titre}" ?`)) return;
    try {
      await api.delete(`/formations/${item.id_formation || item.id}`);
      setMessage("Formation supprimee");
      load();
    } catch (err) { setMessage(err.response?.data?.message || "Erreur suppression"); }
  }

  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Formations</h3>
          <button className="admin-btn" onClick={openNew}>+ Nouvelle formation</button>
        </div>
        {message && <div className="admin-alert">{message}</div>}
        {loading ? <div className="admin-muted">Chargement...</div> : (
          <table className="admin-table">
            <thead>
              <tr><th>Titre</th><th>Categorie</th><th>Prix (XOF)</th><th>Duree (h)</th><th>Places</th><th>Debut</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan="7" className="admin-muted">Aucune formation</td></tr>}
              {items.map((item) => (
                <tr key={item.id_formation || item.id}>
                  <td><strong>{item.titre}</strong></td>
                  <td><span className="admin-badge">{item.categorie}</span></td>
                  <td>{Number(item.prix).toLocaleString()}</td>
                  <td>{item.duree}</td>
                  <td>{item.places_disponibles}</td>
                  <td>{item.date_debut ? item.date_debut.slice(0, 10) : "-"}</td>
                  <td className="admin-actions-cell">
                    <button className="admin-btn-sm" onClick={() => openEdit(item)}>Modifier</button>
                    <button className="admin-btn-sm admin-btn--danger" onClick={() => handleDelete(item)}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? "Modifier la formation" : "Nouvelle formation"}</h3>
            <form className="admin-form" onSubmit={handleSave}>
              <div><label>Titre *</label><input className="admin-input" required value={form.titre} onChange={(e) => setForm({...form, titre: e.target.value})} /></div>
              <div><label>Description *</label><textarea className="admin-input" rows="3" required value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></div>
              <div className="admin-form-row">
                <div><label>Prix (XOF) *</label><input className="admin-input" type="number" required value={form.prix} onChange={(e) => setForm({...form, prix: e.target.value})} /></div>
                <div><label>Duree (heures) *</label><input className="admin-input" type="number" required value={form.duree} onChange={(e) => setForm({...form, duree: e.target.value})} /></div>
              </div>
              <div className="admin-form-row">
                <div><label>Categorie *</label>
                  <select className="admin-input" value={form.categorie} onChange={(e) => setForm({...form, categorie: e.target.value})}>
                    <option value="particulier">Particulier</option><option value="etudiant">Etudiant</option><option value="entreprise">Entreprise</option>
                  </select>
                </div>
                <div><label>Places *</label><input className="admin-input" type="number" required value={form.places_disponibles} onChange={(e) => setForm({...form, places_disponibles: e.target.value})} /></div>
              </div>
              <div className="admin-form-row">
                <div><label>Date debut *</label><input className="admin-input" type="date" required value={form.date_debut} onChange={(e) => setForm({...form, date_debut: e.target.value})} /></div>
                <div><label>ID Pays</label><input className="admin-input" type="number" value={form.id_pays} onChange={(e) => setForm({...form, id_pays: e.target.value})} /></div>
              </div>
              <div className="admin-form-actions">
                <button className="admin-btn" type="submit" disabled={saving}>{saving ? "..." : (editing ? "Mettre a jour" : "Creer")}</button>
                <button className="admin-btn admin-btn--secondary" type="button" onClick={() => setShowForm(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
