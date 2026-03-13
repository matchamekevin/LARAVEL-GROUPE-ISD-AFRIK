import React, { useState } from "react";
import api from "../../axios";

export default function Settings() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [telephone, setTelephone] = useState("");
	const [message, setMessage] = useState("");

	const handleSave = async (e) => {
		e.preventDefault();
		try {
			const res = await api.put("/auth/update-profile", {
				nom: name,
				email,
				telephone,
			});
			setMessage(res.data?.message || "Parametres enregistres.");
		} catch (err) {
			setMessage(err.response?.data?.message || "Erreur lors de la sauvegarde");
		}
	};

	return (
		<div className="admin-card">
			<h3>Parametres de la plateforme</h3>
			<form className="admin-form" onSubmit={handleSave}>
				<div>
					<label>Nom de l'organisation</label>
					<input
						className="admin-input"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="ISD AFRIK"
						type="text"
					/>
				</div>
				<div>
					<label>Email d'alerte</label>
					<input
						className="admin-input"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="admin@isdafrik.com"
						type="email"
					/>
				</div>
				<div>
					<label>Telephone</label>
					<input
						className="admin-input"
						value={telephone}
						onChange={(e) => setTelephone(e.target.value)}
						placeholder="+228 90 00 00 00"
						type="text"
					/>
				</div>
				<button className="admin-btn" type="submit">Sauvegarder</button>
			</form>
			{message && <div className="admin-muted">{message}</div>}
		</div>
	);
}