import React, { useEffect, useState } from "react";
import api from "../../axios";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nom: "", prenom: "", email: "", telephone: "", role: "client" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setMessage("");
    try {
      const res = await api.get("/utilisateurs");
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setMessage(err.response?.data?.message || "Erreur chargement utilisateurs");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (showForm) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [showForm]);

  function openEdit(u) {
    setEditing(u);
    setForm({ nom: u.nom || "", prenom: u.prenom || "", email: u.email || "", telephone: u.telephone || "", role: u.role || "client" });
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await api.put(`/utilisateurs/${editing.id_utilisateur}`, form);
      setMessage("Utilisateur mis a jour");
      setShowForm(false);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Erreur mise a jour");
    } finally { setSaving(false); }
  }

  async function handleDelete(u) {
    if (!confirm(`Supprimer ${u.prenom} ${u.nom} ?`)) return;
    try {
      await api.delete(`/utilisateurs/${u.id_utilisateur}`);
      setMessage("Utilisateur supprime");
      load();
    } catch (err) { setMessage(err.response?.data?.message || "Erreur suppression"); }
  }

  async function handleRestore(u) {
    try {
      await api.patch(`/utilisateurs/${u.id_utilisateur}/restore`);
      setMessage("Utilisateur restaure");
      load();
    } catch (err) { setMessage(err.response?.data?.message || "Erreur restauration"); }
  }

  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Utilisateurs</h3>
          <span className="admin-muted">{users.length} utilisateur(s)</span>
        </div>
        {message && <div className="admin-alert">{message}</div>}
        {loading ? <div className="admin-muted">Chargement...</div> : (
          <table className="admin-table">
            <thead>
              <tr><th>Nom</th><th>Email</th><th>Telephone</th><th>Role</th><th>Statut</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.length === 0 && <tr><td colSpan="6" className="admin-muted">Aucun utilisateur</td></tr>}
              {users.map((u) => (
                <tr key={u.id_utilisateur}>
                  <td><strong>{u.prenom} {u.nom}</strong></td>
                  <td>{u.email}</td>
                  <td>{u.telephone || "-"}</td>
                  <td><span className="admin-badge">{u.role}</span></td>
                  <td><span className={`admin-badge ${u.statut === "actif" ? "admin-badge--success" : "admin-badge--danger"}`}>{u.statut || "actif"}</span></td>
                  <td className="admin-actions-cell">
                    <button className="admin-btn-sm" onClick={() => openEdit(u)}>Modifier</button>
                    <button className="admin-btn-sm admin-btn--danger" onClick={() => handleDelete(u)}>Supprimer</button>
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
            <h3>Modifier l'utilisateur</h3>
            <form className="admin-form" onSubmit={handleSave}>
              <div className="admin-form-row">
                <div><label>Prenom</label><input className="admin-input" value={form.prenom} onChange={(e) => setForm({...form, prenom: e.target.value})} /></div>
                <div><label>Nom</label><input className="admin-input" value={form.nom} onChange={(e) => setForm({...form, nom: e.target.value})} /></div>
              </div>
              <div><label>Email</label><input className="admin-input" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></div>
              <div className="admin-form-row">
                <div><label>Telephone</label><input className="admin-input" value={form.telephone} onChange={(e) => setForm({...form, telephone: e.target.value})} /></div>
                <div><label>Role</label>
                  <select className="admin-input" value={form.role} onChange={(e) => setForm({...form, role: e.target.value})}>
                    <option value="client">Client</option><option value="admin_pays">Admin pays</option><option value="admin_national">Admin national</option><option value="superadmin">Super admin</option>
                  </select>
                </div>
              </div>
              <div className="admin-form-actions">
                <button className="admin-btn" type="submit" disabled={saving}>{saving ? "..." : "Mettre a jour"}</button>
                <button className="admin-btn admin-btn--secondary" type="button" onClick={() => setShowForm(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}