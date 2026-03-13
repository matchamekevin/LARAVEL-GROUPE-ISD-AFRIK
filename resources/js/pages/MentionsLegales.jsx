import React from "react";
import "../styles/mentions.css";
import usePageMeta from "../hooks/usePageMeta";

export default function MentionsLegales() {
  usePageMeta(
    "Mentions legales | Groupe ISD AFRIK",
    "Mentions legales du site Groupe ISD AFRIK: editeur, coordonnees, hebergement et propriete intellectuelle."
  );

  return (
    <div className="legal-page mentions-page">
      <section className="legal-hero">
        <h1>Mentions légales</h1>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <section>
          <h2>Éditeur du site</h2>
          <p>
            Groupe ISD AFRIK - Entreprise specialisee en solutions technologiques,
            securite electronique et transformation digitale en Afrique de l'Ouest.
          </p>
        </section>

        <section>
          <h2>Coordonnees</h2>
          <p>Email: info@groupeisdafrik.com</p>
          <p>Site web: www.groupeisdafrik.com</p>
          <p>Zones de presence: Benin, Togo, Niger, Cote d'Ivoire, Burkina Faso.</p>
        </section>

        <section>
          <h2>Hébergement</h2>
          <p>
            Le site est heberge par un prestataire technique selectionne par le Groupe ISD AFRIK.
            Les informations d'hebergement detaillees peuvent etre communiquees sur demande.
          </p>
        </section>

        <section>
          <h2>Propriete intellectuelle</h2>
          <p>
            Les contenus, textes, images, logos et elements graphiques du site sont proteges.
            Toute reproduction non autorisee est interdite.
          </p>
        </section>
      </div>
    </div>
  );
}
