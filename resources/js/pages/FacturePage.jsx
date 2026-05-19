import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import "../styles/facture.css";
import { getApiBase } from "../utils/apiBase";
import { toastError } from "../utils/toast";

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
    const backendBase = getApiBase();

    axios
      .get(`${backendBase}/api/paiement/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setPaiement(res.data.paiement);
      })
      .catch((err) => {
        console.error("Erreur API :", err);
        toastError("Impossible de récupérer les informations du paiement.");
        setError("Impossible de récupérer les informations du paiement.");
      });
  }, [id]);

  // Génération du PDF
  const generatePDF = () => {
    if (!paiement) return;

    const doc = new jsPDF();

    const img = new Image();
    img.src = "/images/logo.webp";

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

      let y = 50;
      doc.text("Numéro facture : FAC-" + paiement.id_paiement, 14, y); y += 10;
      doc.text("Référence : " + paiement.reference_transaction, 14, y); y += 10;
      doc.text("Date : " + formatDate(paiement.date_paiement), 14, y); y += 10;
      doc.text("Montant : " + parseInt(paiement.montant).toLocaleString() + " FCFA", 14, y); y += 10;
      doc.text("Statut : " + paiement.statut_paiement, 14, y); y += 10;
      doc.text("Moyen de paiement : " + paiement.moyen_paiement, 14, y); y += 10;

      if (paiement.formation?.titre) {
        doc.text("Formation : " + paiement.formation.titre, 14, y); y += 10;
      }

      if (paiement.produit?.titre) {
        const ligneProd = "Produit : " + paiement.produit.titre + (paiement.quantite > 1 ? " (x" + paiement.quantite + ")" : "");
        doc.text(ligneProd, 14, y); y += 10;
      }

      y += 10;
      doc.setFont("helvetica", "italic");
      doc.text("Merci pour votre confiance.", 14, y);

      doc.save("facture_" + paiement.reference_transaction + ".pdf");
    };

    img.onload = buildPDF;
    img.onerror = buildPDF; // ✅ Si logo absent, génère quand même le PDF
  };

  if (error) return <p className="facture-error">{error}</p>;
  if (!paiement) return null;

  return (
    <div className="facture-wrapper">
      <div className="facture-container">

        {/* Header logo + titre */}
        <div className="facture-header">
          <img src="/images/logo.webp" alt="Logo ISD" className="facture-logo" />
          <h1 className="facture-title">Facture</h1>
        </div>

        <div className="facture-content">
          <p><strong>Numéro facture :</strong> FAC-{paiement.id_paiement}</p>

          {/* ✅ Infos formation si applicable */}
          {paiement.formation?.titre && (
            <p><strong>Formation :</strong> {paiement.formation.titre}</p>
          )}

          {/* ✅ Infos produit si applicable */}
          {paiement.produit?.titre && (
            <>
              <p><strong>Produit :</strong> {paiement.produit.titre}</p>
              {paiement.quantite > 1 && (
                <p><strong>Quantité :</strong> {paiement.quantite}</p>
              )}
              {paiement.commande?.numero_commande && (
                <p><strong>Commande :</strong> {paiement.commande.numero_commande}</p>
              )}
            </>
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