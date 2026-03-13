import React, { useEffect, useState } from "react";
import api from "../../axios";

export default function AdminDashboard() {
	const [loading, setLoading] = useState(true);
	const [stats, setStats] = useState({ produits: 0, formations: 0, utilisateurs: 0, paiements: 0 });
	const [recentPaiements, setRecentPaiements] = useState([]);
	const [error, setError] = useState("");

	useEffect(() => {
		let mounted = true;
		async function loadStats() {
			try {
				const [produitsRes, formationsRes, usersRes, paiementsRes] = await Promise.allSettled([
					api.get("/produits", { params: { par_page: 1 } }),
					api.get("/formations"),
					api.get("/utilisateurs"),
					api.get("/admin/paiements"),
				]);

				if (mounted) {
					setStats({
						produits: produitsRes.status === "fulfilled" ? (produitsRes.value.data?.meta?.total ?? 0) : 0,
						formations: formationsRes.status === "fulfilled" ? (Array.isArray(formationsRes.value.data) ? formationsRes.value.data.length : 0) : 0,
						utilisateurs: usersRes.status === "fulfilled" ? (Array.isArray(usersRes.value.data) ? usersRes.value.data.length : 0) : 0,
						paiements: paiementsRes.status === "fulfilled" ? (Array.isArray(paiementsRes.value.data) ? paiementsRes.value.data.length : 0) : 0,
					});
					if (paiementsRes.status === "fulfilled" && Array.isArray(paiementsRes.value.data)) {
						setRecentPaiements(paiementsRes.value.data.slice(0, 5));
					}
				}
			} catch (err) {
				if (mounted) setError(err.response?.data?.message || "Impossible de charger les statistiques");
			} finally {
				if (mounted) setLoading(false);
			}
		}
		loadStats();
		return () => { mounted = false; };
	}, []);

	const metrics = [
		{ label: "Produits", value: stats.produits, hint: "Catalogue actif" },
		{ label: "Formations", value: stats.formations, hint: "Disponibles" },
		{ label: "Utilisateurs", value: stats.utilisateurs, hint: "Inscrits" },
		{ label: "Paiements", value: stats.paiements, hint: "Transactions" },
	];

	return (
		<div>
			{error && <div className="admin-card">{error}</div>}
			{loading && <div className="admin-card">Chargement des donnees...</div>}
			{!loading && (
				<div className="admin-grid">
					{metrics.map((item) => (
						<div key={item.label} className="admin-card">
							<h3>{item.label}</h3>
							<div className="admin-metric">{item.value}</div>
							<div className="admin-muted">{item.hint}</div>
						</div>
					))}
				</div>
			)}

			<div className="admin-section">
				<div className="admin-card">
					<h3>Derniers paiements</h3>
					<table className="admin-table">
						<thead>
							<tr><th>Formation</th><th>Montant</th><th>Statut</th><th>Date</th></tr>
						</thead>
						<tbody>
							{recentPaiements.length === 0 && <tr><td colSpan="4" className="admin-muted">Aucun paiement</td></tr>}
							{recentPaiements.map((p) => (
								<tr key={p.id_paiement || p.id}>
									<td>{p.formation?.titre || "-"}</td>
									<td>{Number(p.montant).toLocaleString()} XOF</td>
									<td><span className={`admin-badge ${p.statut_paiement === "réussi" ? "admin-badge--success" : p.statut_paiement === "échoué" ? "admin-badge--danger" : ""}`}>{p.statut_paiement}</span></td>
									<td className="admin-muted">{p.date_paiement ? new Date(p.date_paiement).toLocaleDateString("fr-FR") : "-"}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}