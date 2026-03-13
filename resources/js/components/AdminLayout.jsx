import React from "react";
import { Outlet, NavLink } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <div>
          <div className="admin-logo">ISD AFRIK Admin</div>
          <small>Plateforme de gestion</small>
        </div>

        <nav className="admin-nav">
          <NavLink to="/admin/dashboard" className="admin-link">
            🧭 Vue globale
          </NavLink>
          <NavLink to="/admin/produits" className="admin-link">
            🛒 Produits
          </NavLink>
          <NavLink to="/admin/categories" className="admin-link">
            🗂️ Categories
          </NavLink>
          <NavLink to="/admin/formations" className="admin-link">
            🎓 Formations
          </NavLink>
          <NavLink to="/admin/paiements" className="admin-link">
            💳 Paiements
          </NavLink>
          <NavLink to="/admin/commandes" className="admin-link">
            📦 Commandes
          </NavLink>
          <NavLink to="/admin/users" className="admin-link">
            👥 Utilisateurs
          </NavLink>
          <NavLink to="/admin/logs" className="admin-link">
            🧾 Journaux
          </NavLink>
          <NavLink to="/admin/settings" className="admin-link">
            ⚙️ Parametres
          </NavLink>
        </nav>

        <div className="admin-muted">
          <p>Version interne</p>
        </div>
      </aside>

      <div className="admin-shell">
        <header className="admin-topbar">
          <div>
            <h1>Console d'administration</h1>
            <div className="admin-muted">Suivi et pilotage de la plateforme</div>
          </div>
          <div className="admin-actions">
            <span className="admin-pill">Admin</span>
            <button
              className="admin-btn"
              onClick={() => {
                localStorage.removeItem("adminToken");
                window.location.href = "/admin/login";
              }}
            >
              Deconnexion
            </button>
          </div>
        </header>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}