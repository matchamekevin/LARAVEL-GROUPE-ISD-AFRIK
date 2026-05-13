import React from "react";
import usePageMeta from "../hooks/usePageMeta";
import "../styles/info-pages-new.css";

export default function MentionsLegales() {
  usePageMeta(
    "Mentions légales | Groupe ISD AFRIK",
    "Mentions légales du site Groupe ISD AFRIK : éditeur, coordonnées, hébergement et propriété intellectuelle."
  );

  return (
    <div className="info-page-modern legal-page">
      <section className="info-hero">
        <h1>Mentions légales</h1>
        <p>Transparence et informations réglementaires concernant l'exploitation de la plateforme.</p>
      </section>

      <div className="info-content">
        
        <section className="info-section" id="editeur">
          <h2>Éditeur du site</h2>
          <p>
            La plateforme <strong>www.groupeisdafrik.com</strong> est éditée par le 
            <strong> Groupe ISD AFRIK</strong>, société spécialisée en ingénierie informatique, 
            sécurité technologique et transformation digitale.
          </p>
          <ul className="info-list">
            <li><strong>Siège Social :</strong> Lomé, Togo (avec présence régionale au Bénin, Niger, Côte d'Ivoire).</li>
            <li><strong>Responsable de la Publication :</strong> La Direction Générale.</li>
            <li><strong>Contact :</strong> info@groupeisdafrik.com</li>
          </ul>
        </section>

        <section className="info-section" id="coordonnees">
          <h2>Coordonnées & Présence Régionale</h2>
          <p>
            Le Groupe ISD AFRIK opère de manière transversale en Afrique de l'Ouest pour répondre 
            aux besoins de proximité de ses clients institutionnels et privés.
          </p>
          <ul className="info-list">
            <li><strong>Email Support :</strong> support@groupeisdafrik.com</li>
            <li><strong>Zones d'intervention :</strong> Bénin, Togo, Niger, Côte d'Ivoire, Burkina Faso.</li>
          </ul>
        </section>

        <section className="info-section" id="hebergement">
          <h2>Hébergement</h2>
          <p>
            Le site est hébergé sur des infrastructures hautement sécurisées, garantissant une 
            disponibilité optimale et une protection contre les intrusions. Les détails techniques 
            sur l'hébergeur peuvent être fournis aux autorités compétentes ou sur demande justifiée.
          </p>
        </section>

        <section className="info-section" id="propriete">
          <h2>Propriété Intellectuelle</h2>
          <p>
            L'ensemble du contenu présent sur ce site (textes, images, graphismes, logos, vidéos, icônes, etc.) 
            est la propriété exclusive du <strong>Groupe ISD AFRIK</strong> ou de ses partenaires.
          </p>
          <p>
            Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie 
            des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf 
            autorisation écrite préalable de la direction.
          </p>
        </section>

        <section className="info-section" id="limitation">
          <h2>Limitation de Responsabilité</h2>
          <p>
            Le Groupe ISD AFRIK s'efforce de fournir des informations aussi précises que possible. 
            Toutefois, il ne pourra être tenu responsable des omissions, des inexactitudes ou des 
            carences dans la mise à jour, qu'elles soient de son fait ou du fait des tiers partenaires 
            qui lui fournissent ces informations.
          </p>
        </section>

      </div>
    </div>
  );
}
