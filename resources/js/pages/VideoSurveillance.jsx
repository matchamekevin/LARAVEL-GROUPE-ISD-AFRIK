import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/formationDetails.css";

const VideoSurveillance = () => {
  const navigate = useNavigate();

  return (
    <div className="formation-details-page">
      <h1>Formation en Vidéo Surveillance</h1>
      <p>
        Installation et gestion de systèmes de vidéo surveillance pour la sécurité des entreprises et particuliers.
      </p>
      <p><strong>Durée :</strong> 48h</p>
      <p><strong>Prix :</strong> 200 000 FCFA</p>
      <p><strong>Catégorie :</strong> Étudiant</p>
      <p><strong>Date de début :</strong> 01/02/2026</p>

      <button className="btn-retour" onClick={() => navigate("/formations/etudiant")}>
        ← Retour aux formations
      </button>
    </div>
  );
};

export default VideoSurveillance;
