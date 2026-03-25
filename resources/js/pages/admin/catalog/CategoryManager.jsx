import React, { useEffect, useState } from "react";
import api from "../../../axios";
import { buildCategoryPath, flattenCategoryTree } from "../../../utils/geovision";

const EMPTY_FORM = {
  nom: "",
  slug: "",
  description: "",
  parent_id: "",
  ordre: 0,
  actif: true,
  image_url: "",
};

function toCategoryPayload(form) {
  return {
    nom: form.nom.trim(),
    slug: form.slug.trim() || undefined,
    description: form.description.trim(),
    parent_id: form.parent_id ? Number(form.parent_id) : null,
    ordre: Number(form.ordre || 0),
    actif: Boolean(form.actif),
    image_url: form.image_url.trim(),
  };
}

export default function CategoryManager({ segment, title, description }) {
  const [itemsTree, setItemsTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const flatItems = flattenCategoryTree(itemsTree);
  const categoriesById = flatItems.reduce((accumulator, item) => {
    accumulator[item.id_categorie || item.id] = item;
    return accumulator;
  }, {});

  const filteredItems = flatItems.filter((item) => {
    if (!searchQuery.trim()) return true;

    const haystack = `${item.nom} ${item.slug || ""} ${item.description || ""}`.toLowerCase();
    return haystack.includes(searchQuery.trim().toLowerCase());
  });

  async function load() {
    setLoading(true);
    setMessage("");

    try {
      const response = await api.get("/admin/categories-produits", {
        params: {
          tree: 1,
          segment,
        },
      });

      const items = Array.isArray(response.data?.data) ? response.data.data : (response.data || []);
      setItemsTree(items);
    } catch (error) {
      setMessage(error.response?.data?.message || "Erreur de chargement des catégories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [segment]);

  useEffect(() => {
    if (showForm) document.body.classList.add("modal-open");
    else document.body.classList.remove("modal-open");

    return () => document.body.classList.remove("modal-open");
  }, [showForm]);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      nom: item.nom || "",
      slug: item.slug || "",
      description: item.description || "",
      parent_id: item.parent_id ? String(item.parent_id) : "",
      ordre: item.ordre ?? 0,
      actif: item.actif ?? true,
      image_url: item.image_url || item.image || "",
    });
    setShowForm(true);
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const payload = {
        ...toCategoryPayload(form),
        segment,
      };

      if (editing) {
        await api.put(`/categories-produits/${editing.id_categorie || editing.id}`, payload);
        setMessage("Catégorie mise à jour.");
      } else {
        await api.post("/categories-produits", payload);
        setMessage("Catégorie créée.");
      }

      setShowForm(false);
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || JSON.stringify(error.response?.data?.errors || "Erreur"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Supprimer la catégorie "${item.nom}" ?`)) return;

    try {
      await api.delete(`/categories-produits/${item.id_categorie || item.id}`);
      setMessage("Catégorie supprimée.");
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Erreur de suppression.");
    }
  }

  const availableParents = flatItems.filter((item) => {
    const itemId = item.id_categorie || item.id;
    const editingId = editing?.id_categorie || editing?.id;

    return !(editingId && itemId === editingId);
  });

  return (
    <div className="admin-page-stack">
      <section className="admin-card admin-page-hero">
        <div>
          <p className="admin-eyebrow">{segment === "geovision" ? "GeoVision" : "Catalogue général"}</p>
          <h2>{title}</h2>
          <p className="admin-muted">{description}</p>
        </div>
        <div className="admin-hero-metrics">
          <div className="admin-hero-metric">
            <strong>{flatItems.length}</strong>
            <span>Catégories</span>
          </div>
          <div className="admin-hero-metric">
            <strong>{flatItems.filter((item) => !item.parent_id).length}</strong>
            <span>Racines</span>
          </div>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-header admin-card-header--stack">
          <div>
            <h3>Arborescence</h3>
            <p className="admin-muted">Gestion hiérarchique lisible, avec séparation nette entre catalogue général et GeoVision.</p>
          </div>
          <div className="admin-toolbar">
            <input
              className="admin-input admin-search"
              placeholder="Rechercher une catégorie..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <button className="admin-btn" onClick={openNew}>+ Nouvelle catégorie</button>
          </div>
        </div>

        {message && <div className="admin-alert">{message}</div>}

        {loading ? (
          <div className="admin-muted">Chargement...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Catégorie</th>
                <th>Parent</th>
                <th>Ordre</th>
                <th>État</th>
                <th>Produits</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan="6" className="admin-muted">Aucune catégorie trouvée.</td>
                </tr>
              )}

              {filteredItems.map((item) => {
                const itemId = item.id_categorie || item.id;
                const parent = item.parent_id ? categoriesById[item.parent_id] : null;

                return (
                  <tr key={itemId}>
                    <td>
                      <div className="admin-tree-item">
                        <span className="admin-tree-item__label" style={{ paddingLeft: `${item.depth * 18}px` }}>
                          {item.depth > 0 ? "└ " : ""}
                          <strong>{item.nom}</strong>
                        </span>
                        <span className="admin-muted">{item.slug}</span>
                      </div>
                    </td>
                    <td className="admin-muted">{parent?.nom || "Racine"}</td>
                    <td>{item.ordre ?? 0}</td>
                    <td>
                      <span className={`admin-badge ${item.actif ? "admin-badge--success" : "admin-badge--danger"}`}>
                        {item.actif ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td><span className="admin-badge">{item.produits_count ?? 0}</span></td>
                    <td className="admin-actions-cell">
                      <button className="admin-btn-sm" onClick={() => openEdit(item)}>Modifier</button>
                      <button className="admin-btn-sm admin-btn--danger" onClick={() => handleDelete(item)}>Supprimer</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal admin-modal--wide" onClick={(event) => event.stopPropagation()}>
            <h3>{editing ? "Modifier la catégorie" : "Nouvelle catégorie"}</h3>
            <form className="admin-form" onSubmit={handleSave}>
              <div className="admin-form-row">
                <div>
                  <label>Nom *</label>
                  <input className="admin-input" required value={form.nom} onChange={(event) => setForm({ ...form, nom: event.target.value })} />
                </div>
                <div>
                  <label>Slug</label>
                  <input className="admin-input" placeholder="Auto si vide" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
                </div>
              </div>

              <div className="admin-form-row">
                <div>
                  <label>Parent</label>
                  <select className="admin-input" value={form.parent_id} onChange={(event) => setForm({ ...form, parent_id: event.target.value })}>
                    <option value="">Racine</option>
                    {availableParents.map((item) => {
                      const itemId = item.id_categorie || item.id;
                      return (
                        <option key={itemId} value={itemId}>
                          {buildCategoryPath(item, categoriesById)}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label>Ordre</label>
                  <input className="admin-input" type="number" min="0" value={form.ordre} onChange={(event) => setForm({ ...form, ordre: event.target.value })} />
                </div>
              </div>

              <div className="admin-form-row">
                <div>
                  <label>Image (URL)</label>
                  <input className="admin-input" value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} />
                </div>
                <div>
                  <label>Segment</label>
                  <input className="admin-input" value={segment} disabled />
                </div>
              </div>

              <div>
                <label>Description</label>
                <textarea className="admin-input" rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </div>

              <label className="admin-checkbox">
                <input type="checkbox" checked={form.actif} onChange={(event) => setForm({ ...form, actif: event.target.checked })} />
                Catégorie active
              </label>

              <div className="admin-form-actions">
                <button className="admin-btn" type="submit" disabled={saving}>{saving ? "..." : (editing ? "Mettre à jour" : "Créer")}</button>
                <button className="admin-btn admin-btn--secondary" type="button" onClick={() => setShowForm(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
