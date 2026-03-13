import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/formationDetails.css";

const ComptabiliteImmobilisations = () => {
  const navigate = useNavigate();

  return (
    <div className="formation-details-page">
      <h1>Comptabilité & Immobilisations (CEFI)</h1>
      <p>
        Formation sur la gestion de la comptabilité, les états financiers et les immobilisations.
      </p>
      <p><strong>Durée :</strong> 48h</p>
      <p><strong>Prix :</strong> 65 000 FCFA</p>
      <p><strong>Catégorie :</strong> Étudiant</p>
      <p><strong>Date de début :</strong> 01/02/2026</p>

      <button className="btn-retour" onClick={() => navigate("/formations/etudiant")}>
        ← Retour aux formations
      </button>
    </div>
  );
};

export default ComptabiliteImmobilisations;
