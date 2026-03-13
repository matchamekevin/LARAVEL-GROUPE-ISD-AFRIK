import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./styles/admin.css";

// Layout et pages admin
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Users from "./pages/admin/Users";
import Logs from "./pages/admin/Logs";
import Produits from "./pages/admin/Produits";
import Formations from "./pages/admin/Formations";
import Categories from "./pages/admin/Categories";
import Paiements from "./pages/admin/Paiements";
import Commandes from "./pages/admin/Commandes";
import AdminVerify from "./pages/admin/AdminVerify";
import AdminLogin from "./pages/admin/AdminLogin";
import Settings from "./pages/admin/Settings";

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
          <Route path="produits" element={<Produits />} />
          <Route path="formations" element={<Formations />} />
          <Route path="categories" element={<Categories />} />
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