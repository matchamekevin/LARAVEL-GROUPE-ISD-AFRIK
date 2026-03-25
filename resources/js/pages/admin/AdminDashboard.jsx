import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../axios";

export default function AdminDashboard() {
	const [loading, setLoading] = useState(true);
	const [stats, setStats] = useState({
		produitsGeneral: 0,
		produitsGeovision: 0,
		categoriesGeneral: 0,
		categoriesGeovision: 0,
		formations: 0,
		utilisateurs: 0,
		paiements: 0,
	});
	const [recentPaiements, setRecentPaiements] = useState([]);
	const [error, setError] = useState("");

	useEffect(() => {
		let mounted = true;
		async function loadStats() {
			try {
				const [generalProductsRes, geovisionProductsRes, generalCategoriesRes, geovisionCategoriesRes, formationsRes, usersRes, paiementsRes] = await Promise.allSettled([
					api.get("/admin/produits", { params: { segment: "general" } }),
					api.get("/admin/produits", { params: { segment: "geovision" } }),
					api.get("/admin/categories-produits", { params: { segment: "general" } }),
					api.get("/admin/categories-produits", { params: { segment: "geovision" } }),
					api.get("/formations"),
					api.get("/utilisateurs"),
					api.get("/admin/paiements"),
				]);

				if (mounted) {
					setStats({
						produitsGeneral: generalProductsRes.status === "fulfilled" ? (generalProductsRes.value.data?.data?.length ?? 0) : 0,
						produitsGeovision: geovisionProductsRes.status === "fulfilled" ? (geovisionProductsRes.value.data?.data?.length ?? 0) : 0,
						categoriesGeneral: generalCategoriesRes.status === "fulfilled" ? ((generalCategoriesRes.value.data?.data || generalCategoriesRes.value.data || []).length ?? 0) : 0,
						categoriesGeovision: geovisionCategoriesRes.status === "fulfilled" ? ((geovisionCategoriesRes.value.data?.data || geovisionCategoriesRes.value.data || []).length ?? 0) : 0,
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
		{ label: "Produits généraux", value: stats.produitsGeneral, hint: "Catalogue standard" },
		{ label: "Produits GeoVision", value: stats.produitsGeovision, hint: "Catalogue constructeur" },
		{ label: "Catégories générales", value: stats.categoriesGeneral, hint: "Arborescence site" },
		{ label: "Catégories GeoVision", value: stats.categoriesGeovision, hint: "Familles & types" },
		{ label: "Formations", value: stats.formations, hint: "Disponibles" },
		{ label: "Utilisateurs", value: stats.utilisateurs, hint: "Inscrits" },
		{ label: "Paiements", value: stats.paiements, hint: "Transactions" },
	];

	return (
		<div>
			{error && <div className="admin-card">{error}</div>}
			<div className="admin-page-stack">
				<div className="admin-card admin-page-hero">
					<div>
						<p className="admin-eyebrow">Pilotage</p>
						<h2>Vue globale de l’administration</h2>
						<p className="admin-muted">Le catalogue général et le catalogue GeoVision sont maintenant gérés séparément pour garder une logique propre et lisible.</p>
					</div>
					<div className="admin-quick-links">
						<Link to="/admin/catalogue/produits" className="admin-quick-link">Catalogue général</Link>
						<Link to="/admin/geovision/produits" className="admin-quick-link">GeoVision</Link>
						<Link to="/admin/commandes" className="admin-quick-link">Commandes</Link>
					</div>
				</div>

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
				<div className="admin-grid">
					<div className="admin-card">
						<h3>Catalogue général</h3>
						<p className="admin-muted">Produits et catégories du site hors GeoVision.</p>
						<div className="admin-actions-cell">
							<Link to="/admin/catalogue/produits" className="admin-btn-sm">Gérer les produits</Link>
							<Link to="/admin/catalogue/categories" className="admin-btn-sm admin-btn--secondary">Gérer les catégories</Link>
						</div>
					</div>
					<div className="admin-card">
						<h3>GeoVision</h3>
						<p className="admin-muted">Catalogue constructeur, catégories officielles et synchronisation dédiée.</p>
						<div className="admin-actions-cell">
							<Link to="/admin/geovision/produits" className="admin-btn-sm">Gérer les produits</Link>
							<Link to="/admin/geovision/categories" className="admin-btn-sm admin-btn--secondary">Gérer les catégories</Link>
						</div>
					</div>
				</div>

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
		</div>
	);
}
