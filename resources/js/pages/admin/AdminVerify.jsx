import React, { useState } from "react";
import api from "../../axios";

export default function AdminVerify() {
	const [email, setEmail] = useState(localStorage.getItem("adminEmail") || "");
	const [code, setCode] = useState("");
	const [message, setMessage] = useState("");
	const [loading, setLoading] = useState(false);

	const handleVerify = async (e) => {
		e.preventDefault();
		setLoading(true);
		setMessage("");
		try {
			const userId = localStorage.getItem("adminUserId");
			if (!userId) {
				setMessage("Utilisateur introuvable. Reconnecte-toi.");
				setLoading(false);
				return;
			}

			const res = await api.post("/auth/verify-2fa", {
				user_id: Number(userId),
				code,
			});
			if (res.data?.token) {
				localStorage.setItem("adminToken", res.data.token);
			}
			localStorage.removeItem("adminUserId");
			localStorage.removeItem("adminEmail");
			window.location.href = "/admin/dashboard";
		} catch (err) {
			setMessage(err.response?.data?.message || "Code invalide ou expire");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="admin-auth">
			<div className="admin-auth-card">
				<h1>Verification OTP</h1>
				<p>Confirme ton acces avec le code recu.</p>
				<form className="admin-form" onSubmit={handleVerify}>
					<input
						className="admin-input"
						type="email"
						placeholder="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
					<input
						className="admin-input"
						type="text"
						placeholder="Code OTP"
						value={code}
						onChange={(e) => setCode(e.target.value)}
					/>
					<div className="admin-auth-actions">
						<button className="admin-btn" type="submit" disabled={loading}>
							{loading ? "Verification..." : "Verifier"}
						</button>
						<span className="admin-muted">2FA actif</span>
					</div>
				</form>
				{message && <div className="admin-muted">{message}</div>}
			</div>
		</div>
	);
}