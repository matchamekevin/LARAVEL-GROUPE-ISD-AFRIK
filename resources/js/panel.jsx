import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";

import "./styles/admin.css";

// Layout et pages admin
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Users from "./pages/admin/Users";
import Logs from "./pages/admin/Logs";
import Formations from "./pages/admin/Formations";
import Paiements from "./pages/admin/Paiements";
import Commandes from "./pages/admin/Commandes";
import AdminVerify from "./pages/admin/AdminVerify";
import AdminLogin from "./pages/admin/AdminLogin";
import Settings from "./pages/admin/Settings";
import CatalogueProduits from "./pages/admin/CatalogueProduits";
import CatalogueCategories from "./pages/admin/CatalogueCategories";
import GeovisionProduits from "./pages/admin/GeovisionProduits";
import GeovisionCategories from "./pages/admin/GeovisionCategories";

function PanelApp() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route login hors layout */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/verify" element={<AdminVerify />} />

        {/* Layout global admin */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="catalogue/produits" element={<CatalogueProduits />} />
          <Route path="catalogue/categories" element={<CatalogueCategories />} />
          <Route path="geovision/produits" element={<GeovisionProduits />} />
          <Route path="geovision/categories" element={<GeovisionCategories />} />
          <Route path="produits" element={<Navigate to="/admin/catalogue/produits" replace />} />
          <Route path="categories" element={<Navigate to="/admin/catalogue/categories" replace />} />
          <Route path="formations" element={<Formations />} />
          <Route path="paiements" element={<Paiements />} />
          <Route path="commandes" element={<Commandes />} />
          <Route path="users" element={<Users />} />
          <Route path="logs" element={<Logs />} />
          <Route path="settings" element={<Settings />} />
          <Route index element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default PanelApp;

// Point d’entrée
ReactDOM.createRoot(document.getElementById("panel")).render(
  <React.StrictMode>
    <PanelApp />
  </React.StrictMode>
);
