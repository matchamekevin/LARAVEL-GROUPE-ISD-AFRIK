import React from "react";
import "../styles/confidentialite.css";
import usePageMeta from "../hooks/usePageMeta";

export default function Confidentialite() {
  usePageMeta(
    "Politique de confidentialite | Groupe ISD AFRIK",
    "Politique de confidentialite du Groupe ISD AFRIK: donnees collectees, utilisation, securite et droits utilisateurs."
  );

  return (
    <div className="legal-page confidentialite-page">
      <section className="legal-hero">
        <h1>Politique de confidentialité</h1>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <section>
          <h2>Données collectées</h2>
          <p>
            Nous collectons les donnees necessaires via les formulaires du site: nom, email,
            telephone, societe, message et toute information utile au traitement de votre demande.
          </p>
        </section>

        <section>
          <h2>Utilisation des données</h2>
          <p>
            Ces donnees sont utilisees pour repondre a vos demandes, proposer des solutions adaptees,
            assurer le suivi commercial et ameliorer nos services.
          </p>
        </section>

        <section>
          <h2>Conservation et securite</h2>
          <p>
            Les donnees sont conservees pour la duree necessaire aux finalites de traitement et protegees
            par des mesures organisationnelles et techniques appropriees.
          </p>
        </section>

        <section>
          <h2>Droits des utilisateurs</h2>
          <p>
            Vous pouvez demander l'acces, la rectification ou la suppression de vos donnees en ecrivant a
            info@groupeisdafrik.com.
          </p>
        </section>
      </div>
    </div>
  );
}
