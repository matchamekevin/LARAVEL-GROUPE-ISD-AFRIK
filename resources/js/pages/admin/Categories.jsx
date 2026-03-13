import React, { useEffect, useState } from "react";
import api from "../../axios";

export default function Categories() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nom: "", description: "", segment: "", image_url: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setMessage("");
    try {
      const res = await api.get("/categories-produits");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setMessage(err.response?.data?.message || "Erreur chargement categories");
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
    setForm({ nom: "", description: "", segment: "", image_url: "" });
    setShowForm(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      nom: item.nom || "",
      description: item.description || "",
      segment: item.segment || "",
      image_url: item.image_url || "",
    });
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      if (editing) {
        await api.put(`/categories-produits/${editing.id_categorie || editing.id}`, form);
        setMessage("Categorie mise a jour");
      } else {
        await api.post("/categories-produits", form);
        setMessage("Categorie creee");
      }
      setShowForm(false);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || JSON.stringify(err.response?.data?.errors || "Erreur"));
    } finally { setSaving(false); }
  }

  async function handleDelete(item) {
    if (!confirm(`Supprimer la categorie "${item.nom}" ?`)) return;
    try {
      await api.delete(`/categories-produits/${item.id_categorie || item.id}`);
      setMessage("Categorie supprimee");
      load();
    } catch (err) { setMessage(err.response?.data?.message || "Erreur suppression"); }
  }

  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Categories produits</h3>
          <button className="admin-btn" onClick={openNew}>+ Nouvelle categorie</button>
        </div>
        {message && <div className="admin-alert">{message}</div>}
        {loading ? <div className="admin-muted">Chargement...</div> : (
          <table className="admin-table">
            <thead>
              <tr><th>Nom</th><th>Segment</th><th>Description</th><th>Image</th><th>Produits</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan="6" className="admin-muted">Aucune categorie</td></tr>}
              {items.map((item) => (
                <tr key={item.id_categorie || item.id}>
                  <td><strong>{item.nom}</strong></td>
                  <td>{item.segment || "-"}</td>
                  <td className="admin-muted">{item.description || "-"}</td>
                  <td className="admin-muted">{item.image_url ? "Oui" : "-"}</td>
                  <td><span className="admin-badge">{item.produits_count ?? 0}</span></td>
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
            <h3>{editing ? "Modifier la categorie" : "Nouvelle categorie"}</h3>
            <form className="admin-form" onSubmit={handleSave}>
              <div><label>Nom *</label><input className="admin-input" required value={form.nom} onChange={(e) => setForm({...form, nom: e.target.value})} /></div>
              <div><label>Segment</label><input className="admin-input" placeholder="ex: geovision" value={form.segment} onChange={(e) => setForm({...form, segment: e.target.value})} /></div>
              <div><label>Image (URL)</label><input className="admin-input" placeholder="https://..." value={form.image_url} onChange={(e) => setForm({...form, image_url: e.target.value})} /></div>
              <div><label>Description</label><textarea className="admin-input" rows="3" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></div>
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
