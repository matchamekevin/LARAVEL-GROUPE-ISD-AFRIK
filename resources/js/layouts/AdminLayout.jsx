import React from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";

export default function AdminLayout() {
  const location = useLocation();
  const navigation = [
    {
      title: "Pilotage",
      links: [
        { to: "/admin/dashboard", label: "Vue globale", hint: "Synthèse", badge: "01" },
      ],
    },
    {
      title: "Catalogue général",
      links: [
        { to: "/admin/catalogue/produits", label: "Produits", hint: "Catalogue site", badge: "CG" },
        { to: "/admin/catalogue/categories", label: "Catégories", hint: "Arborescence", badge: "CC" },
      ],
    },
    {
      title: "GeoVision",
      links: [
        { to: "/admin/geovision/produits", label: "Produits", hint: "Constructeur", badge: "GV" },
        { to: "/admin/geovision/categories", label: "Catégories", hint: "Familles & types", badge: "GC" },
      ],
    },
    {
      title: "Exploitation",
      links: [
        { to: "/admin/formations", label: "Formations", hint: "Catalogue learning", badge: "FO" },
        { to: "/admin/paiements", label: "Paiements", hint: "Transactions", badge: "PA" },
        { to: "/admin/commandes", label: "Commandes", hint: "Suivi client", badge: "CO" },
      ],
    },
    {
      title: "Administration",
      links: [
        { to: "/admin/users", label: "Utilisateurs", hint: "Comptes", badge: "US" },
        { to: "/admin/logs", label: "Journaux", hint: "Traçabilité", badge: "LG" },
        { to: "/admin/settings", label: "Paramètres", hint: "Configuration", badge: "ST" },
      ],
    },
  ];

  const currentPage = navigation
    .flatMap((section) => section.links)
    .find((link) => location.pathname.startsWith(link.to)) || navigation[0].links[0];

  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <div>
          <div className="admin-logo">ISD AFRIK Admin</div>
          <small>Console structurée par domaine</small>
        </div>

        <div className="admin-nav">
          {navigation.map((section) => (
            <div key={section.title} className="admin-nav-section">
              <p className="admin-nav-title">{section.title}</p>
              {section.links.map((link) => (
                <NavLink key={link.to} to={link.to} className={({ isActive }) => `admin-link${isActive ? " active" : ""}`}>
                  <span className="admin-link__icon">{link.badge}</span>
                  <span className="admin-link__copy">
                    <strong>{link.label}</strong>
                    <small>{link.hint}</small>
                  </span>
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        <div className="admin-muted">
          <p>Architecture séparée: général + GeoVision</p>
        </div>
      </aside>

      <div className="admin-shell">
        <header className="admin-topbar">
          <div>
            <p className="admin-eyebrow">{currentPage?.hint || "Pilotage"}</p>
            <h1>{currentPage?.label || "Console d'administration"}</h1>
            <div className="admin-muted">Suivi, catalogues séparés et administration de la plateforme</div>
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
