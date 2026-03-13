import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/formationDetails.css";

const MicrosoftAvance = () => {
  const navigate = useNavigate();

  return (
    <div className="formation-details-page">
      <h1>Microsoft Avancé (Excel & PowerPoint)</h1>
      <p>
        Formation avancée sur Excel et PowerPoint, niveaux 1 et 2, pour maîtriser les outils bureautiques.
      </p>
      <p><strong>Durée :</strong> 48h</p>
      <p><strong>Prix :</strong> 100 000 FCFA</p>
      <p><strong>Catégorie :</strong> Étudiant</p>
      <p><strong>Date de début :</strong> 01/02/2026</p>

      <button className="btn-retour" onClick={() => navigate("/formations/etudiant")}>
        ← Retour aux formations
      </button>
    </div>
  );
};

export default MicrosoftAvance;
