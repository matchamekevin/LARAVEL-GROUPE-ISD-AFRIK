import React, { useState } from "react";
import api from "../../axios";

export default function AdminLogin() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [message, setMessage] = useState("");
	const [loading, setLoading] = useState(false);

	const handleLogin = async (e) => {
		e.preventDefault();
		setLoading(true);
		setMessage("");
		try {
			const res = await api.post("/auth/login", {
				email,
				mot_de_passe: password,
			});
			if (res.data?.requires_2fa) {
				localStorage.setItem("adminUserId", String(res.data.user_id));
				localStorage.setItem("adminEmail", res.data.email || email);
				setMessage(res.data.message || "Code OTP envoye.");
				window.location.href = "/admin/verify";
				return;
			}

			if (res.data?.token) {
				localStorage.setItem("adminToken", res.data.token);
			}
			setMessage(res.data.message || "Connexion reussie.");
			window.location.href = "/admin/dashboard";
		} catch (err) {
			setMessage(err.response?.data?.message || "Erreur lors de la connexion");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="admin-auth">
			<div className="admin-auth-card">
				<h1>Connexion Admin</h1>
				<p>Acces securise a la console ISD AFRIK.</p>
				<form className="admin-form" onSubmit={handleLogin}>
					<input
						className="admin-input"
						type="email"
						placeholder="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
					<input
						className="admin-input"
						type="password"
						placeholder="Mot de passe"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
					<div className="admin-auth-actions">
						<button className="admin-btn" type="submit" disabled={loading}>
							{loading ? "Connexion..." : "Se connecter"}
						</button>
						<span className="admin-muted">OTP active</span>
					</div>
				</form>
				{message && <div className="admin-muted">{message}</div>}
			</div>
		</div>
	);
}