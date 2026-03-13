import React, { useEffect, useState } from "react";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("adminToken"); // stocke ton token Sanctum après login

    fetch("http://localhost:8000/api/admin/dashboard", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json"
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Non authentifié ou accès refusé");
        }
        return res.json();
      })
      .then(data => setStats(data))
      .catch(err => setError(err.message));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!stats) return <p>Chargement...</p>;

  return (
    <div className="p-6 grid grid-cols-3 gap-4">
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-bold">Utilisateurs</h2>
        <p>{stats.utilisateurs_total}</p>
      </div>
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-bold">Clients</h2>
        <p>{stats.clients_total}</p>
      </div>
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-bold">Admins</h2>
        <p>{stats.admins_total}</p>
      </div>
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-bold">Super Admins</h2>
        <p>{stats.super_admins_total}</p>
      </div>
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-bold">Commandes</h2>
        <p>{stats.commandes_total}</p>
      </div>
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-bold">Formations</h2>
        <p>{stats.formations_total}</p>
      </div>
    </div>
  );
}

export default AdminDashboard;