import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/PaymentPage.css";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Récupérer les données envoyées depuis FormationRegister
  const { inscription, paiement, formation } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handlePaiement = async () => {
    if (!formation || !formation.id_formation) {
      setMessage("❌ Erreur: ID formation manquant");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      // ✅ Appel vers la route payFormation avec l'idFormation
      const res = await axios.post(
        `http://localhost:8000/api/formations/${formation.id_formation}/paiement`,
  {},
  { headers: { Authorization: `Bearer ${token}` } }

      );

      console.log("✅ Paiement initié:", res.data);

      if (res.data.checkout_url) {
        // ✅ Redirection vers le formulaire FedaPay
        window.location.href = res.data.checkout_url;
      } else {
        setMessage("❌ Erreur: URL de paiement manquante");
        setLoading(false);
      }
    } catch (err) {
      console.error("❌ Erreur:", err.response?.data || err.message);
      setMessage(err.response?.data?.message || "Erreur lors du paiement ❌");
      setLoading(false);
    }
  };

  if (!formation) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-container">
        <header className="payment-header">
          <h1> Paiement de la formation</h1>
        </header>

        {message && (
          <div
            className={`message ${
              message.includes("✅") ? "success" : "error"
            }`}
          >
            <p>{message}</p>
          </div>
        )}

        <div className="payment-card">
          <h2>{formation.titre}</h2>

          <div className="formation-info">
            <p>
              <strong>Durée :</strong> {formation.duree}h
            </p>
            <p>
              <strong>Catégorie :</strong> {formation.categorie}
            </p>
            <p>
              <strong>Prix :</strong>{" "}
              {parseInt(formation.prix).toLocaleString()} FCFA
            </p>
          </div>

          <button
            className="btn-pay"
            onClick={handlePaiement}
            disabled={loading}
          >
            {loading ? "Traitement..." : " Payer maintenant"}
          </button>

          <button className="btn-cancel" onClick={() => navigate(-1)}>
            ← Retour
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;