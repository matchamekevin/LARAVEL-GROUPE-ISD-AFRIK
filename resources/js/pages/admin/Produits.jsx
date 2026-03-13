import React, { useEffect, useState } from "react";
import api from "../../axios";

export default function Produits() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ titre: "", description: "", prix: "", stock: "", statut: "disponible", id_pays: 1, id_categorie: "", marque: "" });
  const [saving, setSaving] = useState(false);

  async function load(p = page) {
    setLoading(true);
    setMessage("");
    try {
      const res = await api.get("/produits", { params: { par_page: 15, page: p, statut: "" } });
      setItems(res.data?.data || []);
      setMeta(res.data?.meta || {});
    } catch (err) {
      setMessage(err.response?.data?.message || "Erreur chargement produits");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(page); }, [page]);

  useEffect(() => {
    api.get("/categories-produits")
      .then((res) => setCategories(res.data?.data || res.data || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (showForm && !editing && !form.id_categorie && categories.length > 0) {
      const firstId = categories[0].id_categorie || categories[0].id || "";
      setForm((prev) => ({ ...prev, id_categorie: firstId }));
    }
  }, [categories, showForm, editing, form.id_categorie]);

  useEffect(() => {
    if (showForm) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [showForm]);

  function openNew() {
    setEditing(null);
    setForm({ titre: "", description: "", prix: "", stock: "", statut: "disponible", id_pays: 1, id_categorie: "", marque: "" });
    setShowForm(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      titre: item.titre || "", description: item.description || "", prix: item.prix || "",
      stock: item.stock || "", statut: item.statut || "disponible", id_pays: item.id_pays || 1,
      id_categorie: item.id_categorie || "", marque: item.marque || "",
    });
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      if (editing) {
        await api.put(`/produits/${editing.id_produit || editing.id}`, form);
        setMessage("Produit mis a jour");
      } else {
        await api.post("/produits", form);
        setMessage("Produit cree");
      }
      setShowForm(false);
      load(page);
    } catch (err) {
      setMessage(err.response?.data?.message || JSON.stringify(err.response?.data?.errors || "Erreur"));
    } finally { setSaving(false); }
  }

  async function handleDelete(item) {
    if (!confirm(`Supprimer "${item.titre}" ?`)) return;
    try {
      await api.delete(`/produits/${item.id_produit || item.id}`);
      setMessage("Produit supprime");
      load(page);
    } catch (err) { setMessage(err.response?.data?.message || "Erreur suppression"); }
  }

  async function toggleVedette(item) {
    try {
      await api.patch(`/produits/${item.id_produit || item.id}/vedette`);
      load(page);
    } catch (err) { setMessage(err.response?.data?.message || "Erreur vedette"); }
  }

  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Catalogue produits</h3>
          <button className="admin-btn" onClick={openNew}>+ Nouveau produit</button>
        </div>
        {message && <div className="admin-alert">{message}</div>}
        {loading ? <div className="admin-muted">Chargement...</div> : (
          <>
            <table className="admin-table">
              <thead>
                <tr><th>Produit</th><th>Prix (XOF)</th><th>Stock</th><th>Statut</th><th>Vedette</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {items.length === 0 && <tr><td colSpan="6" className="admin-muted">Aucun produit</td></tr>}
                {items.map((item) => (
                  <tr key={item.id_produit || item.id}>
                    <td><strong>{item.titre}</strong><br/><span className="admin-muted">{item.marque}</span></td>
                    <td>{Number(item.prix).toLocaleString()}</td>
                    <td>{item.stock ?? "-"}</td>
                    <td><span className={`admin-badge ${item.statut === "disponible" ? "admin-badge--success" : "admin-badge--danger"}`}>{item.statut}</span></td>
                    <td><button className="admin-btn-sm" onClick={() => toggleVedette(item)}>{item.est_en_vedette ? "\u2605" : "\u2606"}</button></td>
                    <td className="admin-actions-cell">
                      <button className="admin-btn-sm" onClick={() => openEdit(item)}>Modifier</button>
                      <button className="admin-btn-sm admin-btn--danger" onClick={() => handleDelete(item)}>Supprimer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {meta.derniere_page > 1 && (
              <div className="admin-pagination">
                <button className="admin-btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>&larr; Prec</button>
                <span className="admin-muted">Page {meta.page_actuelle} / {meta.derniere_page} &mdash; {meta.total} produit(s)</span>
                <button className="admin-btn-sm" disabled={page >= meta.derniere_page} onClick={() => setPage(page + 1)}>Suiv &rarr;</button>
              </div>
            )}
          </>
        )}
      </div>

      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? "Modifier le produit" : "Nouveau produit"}</h3>
            <form className="admin-form" onSubmit={handleSave}>
              <div><label>Titre *</label><input className="admin-input" required value={form.titre} onChange={(e) => setForm({...form, titre: e.target.value})} /></div>
              <div><label>Description</label><textarea className="admin-input" rows="3" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></div>
              <div className="admin-form-row">
                <div><label>Prix (XOF) *</label><input className="admin-input" type="number" required value={form.prix} onChange={(e) => setForm({...form, prix: e.target.value})} /></div>
                <div><label>Stock</label><input className="admin-input" type="number" value={form.stock} onChange={(e) => setForm({...form, stock: e.target.value})} /></div>
              </div>
              <div className="admin-form-row">
                <div><label>Marque</label><input className="admin-input" value={form.marque} onChange={(e) => setForm({...form, marque: e.target.value})} /></div>
                <div><label>Statut</label><select className="admin-input" value={form.statut} onChange={(e) => setForm({...form, statut: e.target.value})}><option value="disponible">Disponible</option><option value="indisponible">Indisponible</option></select></div>
              </div>
              <div className="admin-form-row">
                <div>
                  <label>Categorie</label>
                  <select className="admin-input" value={form.id_categorie} onChange={(e) => setForm({...form, id_categorie: e.target.value})}>
                    <option value="">-- Choisir --</option>
                    {categories.map((cat) => (
                      <option key={cat.id_categorie || cat.id} value={cat.id_categorie || cat.id}>{cat.nom}</option>
                    ))}
                  </select>
                </div>
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
