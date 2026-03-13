import React from "react";

export default function Logs() {
	const logs = [
		{ id: 1, action: "Produit ajoute : Drone A1", when: "Aujourd'hui 09:32" },
		{ id: 2, action: "Commande C-209 validee", when: "Hier 18:04" },
		{ id: 3, action: "Utilisateur bloque : Koffi M.", when: "Hier 14:22" },
	];

	return (
		<div className="admin-card">
			<h3>Journal d'activite</h3>
			<ul className="admin-section">
				{logs.map((log) => (
					<li key={log.id}>
						<div>{log.action}</div>
						<div className="admin-muted">{log.when}</div>
					</li>
				))}
			</ul>
		</div>
	);
}