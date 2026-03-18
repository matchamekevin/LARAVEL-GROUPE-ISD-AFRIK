import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import "../styles/facture.css";

// Formater la date en français
function formatDate(dateString) {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleString("fr-FR", options);
}

function FacturePage() {
  const { id } = useParams();
  const [paiement, setPaiement] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // ✅ Token d'authentification ajouté
    const token = localStorage.getItem("token");
    const backendBase = import.meta.env.VITE_API_BASE || '';

    axios
      .get(`${backendBase}/api/paiement/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setPaiement(res.data.paiement);
      })
      .catch((err) => {
        console.error("Erreur API :", err);
        setError("Impossible de récupérer les informations du paiement.");
      });
  }, [id]);

  // Génération du PDF
  const generatePDF = () => {
    if (!paiement) return;

    const doc = new jsPDF();

    const img = new Image();
    img.src = "/images/logo.png";

    // ✅ Fonction qui génère le PDF (avec ou sans logo)
    const buildPDF = () => {
      try {
        doc.addImage(img, "PNG", 14, 10, 30, 30);
      } catch (e) {
        // Logo non disponible, on continue sans
      }

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("FACTURE", 105, 20, { align: "center" });

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");

      doc.text("Numéro facture : FAC-" + paiement.id_paiement, 14, 50);
      doc.text("Référence : " + paiement.reference_transaction, 14, 60);
      doc.text("Date : " + formatDate(paiement.date_paiement), 14, 70);
      doc.text("Montant : " + parseInt(paiement.montant).toLocaleString() + " FCFA", 14, 80);
      doc.text("Statut : " + paiement.statut_paiement, 14, 90);
      doc.text("Moyen de paiement : " + paiement.moyen_paiement, 14, 100);

      // ✅ Correction : formation.titre au lieu de nom_formation
      if (paiement.formation?.titre) {
        doc.text("Formation : " + paiement.formation.titre, 14, 110);
      }

      doc.setFont("helvetica", "italic");
      doc.text("Merci pour votre confiance.", 14, 130);

      doc.save("facture_" + paiement.reference_transaction + ".pdf");
    };

    img.onload = buildPDF;
    img.onerror = buildPDF; // ✅ Si logo absent, génère quand même le PDF
  };

  if (error) return <p className="facture-error">{error}</p>;
  if (!paiement) return <p className="facture-loading">Chargement de la facture...</p>;

  return (
    <div className="facture-wrapper">
      <div className="facture-container">

        {/* Header logo + titre */}
        <div className="facture-header">
          <img src="/images/logo.png" alt="Logo ISD" className="facture-logo" />
          <h1 className="facture-title">Facture</h1>
        </div>

        <div className="facture-content">
          <p><strong>Numéro facture :</strong> FAC-{paiement.id_paiement}</p>

          {/* ✅ Correction : formation.titre au lieu de nom_formation */}
          {paiement.formation?.titre && (
            <p><strong>Formation :</strong> {paiement.formation.titre}</p>
          )}

          <p><strong>Référence :</strong> {paiement.reference_transaction}</p>
          <p><strong>Date :</strong> {formatDate(paiement.date_paiement)}</p>
          <p>
            <strong>Montant :</strong>{" "}
            {parseInt(paiement.montant).toLocaleString()} FCFA
          </p>
          <p>
            <strong>Statut :</strong>{" "}
            <span className={`statut ${paiement.statut_paiement === "réussi" ? "statut-success" : "statut-pending"}`}>
              {paiement.statut_paiement}
            </span>
          </p>
          <p><strong>Moyen de paiement :</strong> {paiement.moyen_paiement}</p>

          <p className="facture-thanks">Merci pour votre confiance 🙏</p>

          <button onClick={generatePDF} className="facture-button">
            📥 Télécharger en PDF
          </button>
        </div>
      </div>
    </div>
  );
}

export default FacturePage;