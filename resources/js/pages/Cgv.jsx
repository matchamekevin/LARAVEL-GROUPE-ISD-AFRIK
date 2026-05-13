import React from "react";
import usePageMeta from "../hooks/usePageMeta";
import "../styles/info-pages-new.css";

export default function Cgv() {
  usePageMeta(
    "CGV | Groupe ISD AFRIK",
    "Conditions Générales de Vente du Groupe ISD AFRIK pour les solutions technologiques, services numériques et formations."
  );

  return (
    <div className="info-page-modern legal-page cgv-page">
      <section className="info-hero">
        <h1>Conditions Générales de Vente</h1>
        <p>Cadre contractuel régissant les prestations de services et les ventes de solutions technologiques.</p>
      </section>

      <div className="info-content">
        
        <section className="info-section">
          <h2>1. Objet et Champ d'Application</h2>
          <p>
            Les présentes Conditions Générales de Vente (CGV) s'appliquent de plein droit à toute vente 
            de solutions logicielles, équipements technologiques, prestations de services et formations 
            professionnelles proposées par le <strong>Groupe ISD AFRIK</strong>.
          </p>
          <p>
            Toute commande implique l'adhésion entière et sans réserve du client à ces CGV, nonobstant 
            toute clause contraire pouvant figurer sur les documents du client.
          </p>
        </section>

        <section className="info-section">
          <h2>2. Produits et Services</h2>
          <p>
            Le Groupe ISD AFRIK propose une large gamme de solutions structurées autour de trois piliers :
          </p>
          <ul className="info-list">
            <li><strong>Solutions de Gestion :</strong> Logiciels ERP, Compta, RH et métiers.</li>
            <li><strong>Ingénierie & Sécurité :</strong> Matériels informatiques, réseaux, drones et TPE.</li>
            <li><strong>Accompagnement :</strong> Audit, paramétrage, formation et support technique.</li>
          </ul>
        </section>

        <section className="info-section">
          <h2>3. Prix et Modalités de Paiement</h2>
          <p>
            Les prix de nos solutions et services sont établis sur devis, en fonction de la complexité 
            du projet et des ressources mobilisées. Sauf mention contraire, les devis ont une durée 
            de validité de 30 jours.
          </p>
          <ul className="info-list">
            <li><strong>Facturation :</strong> Les factures sont payables selon les échéances définies dans le devis validé.</li>
            <li><strong>Moyens de paiement :</strong> Virement bancaire, chèque ou via nos plateformes de paiement sécurisées.</li>
            <li><strong>Retards :</strong> Tout retard de paiement pourra donner lieu à l'application de pénalités de retard.</li>
          </ul>
        </section>

        <section className="info-section">
          <h2>4. Livraison et Exécution des Prestations</h2>
          <p>
            Les délais de livraison et d'exécution sont donnés à titre indicatif lors de la commande. 
            Le Groupe ISD AFRIK s'engage à mobiliser les moyens nécessaires pour respecter ces délais, 
            sous réserve de la collaboration active du client (fourniture de données, accès aux infrastructures, etc.).
          </p>
        </section>

        <section className="info-section">
          <h2>5. Support, Maintenance et Garantie</h2>
          <p>
            Nos solutions logicielles et matérielles bénéficient d'une garantie dont la durée varie 
            selon la nature du produit. Le support technique est assuré selon les niveaux d'engagement 
            définis contractuellement (SLA).
          </p>
          <p>
            La maintenance corrective et évolutive fait l'objet d'un contrat spécifique pour garantir 
            la pérennité de l'investissement du client.
          </p>
        </section>

        <section className="info-section">
          <h2>6. Responsabilités</h2>
          <p>
            La responsabilité du Groupe ISD AFRIK est limitée au montant des prestations effectivement 
            payées par le client pour le projet concerné. Le groupe ne saurait être tenu responsable 
            des dommages indirects tels que perte de données, perte d'exploitation ou manque à gagner.
          </p>
        </section>

        <section className="info-section">
          <h2>7. Confidentialité</h2>
          <p>
            Chaque partie s'engage à considérer comme confidentielles toutes les informations, 
            données et documents transmis par l'autre partie dans le cadre de l'exécution des contrats.
          </p>
        </section>

      </div>
    </div>
  );
}
