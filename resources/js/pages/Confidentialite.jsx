import React from "react";
import usePageMeta from "../hooks/usePageMeta";
import "../styles/info-pages-new.css";

export default function Confidentialite() {
  usePageMeta(
    "Politique de confidentialité | Groupe ISD AFRIK",
    "Politique de confidentialité du Groupe ISD AFRIK : données collectées, utilisation, sécurité et droits utilisateurs."
  );

  return (
    <div className="info-page-modern legal-page confidentialite-page">
      <section className="info-hero">
        <h1>Politique de confidentialité</h1>
        <p>Engagement du Groupe ISD AFRIK pour la protection de vos données personnelles.</p>
      </section>

      <div className="info-content">
        
        <section className="info-section">
          <h2>1. Introduction</h2>
          <p>
            Dans le cadre de son activité, le <strong>Groupe ISD AFRIK</strong> est amené à collecter et à 
            traiter des données à caractère personnel. Nous accordons une importance capitale à la 
            confidentialité de vos données et à la transparence de nos processus.
          </p>
          <p>
            Cette politique décrit comment nous collectons, utilisons et protégeons les informations 
            que vous nous confiez lors de votre navigation sur notre site ou lors de nos échanges commerciaux.
          </p>
        </section>

        <section className="info-section">
          <h2>2. Données Collectées</h2>
          <p>
            Nous collectons uniquement les données strictement nécessaires aux finalités poursuivies.
          </p>
          <ul className="info-list">
            <li><strong>Identité :</strong> Nom, prénom, fonction.</li>
            <li><strong>Contact :</strong> Adresse email, numéro de téléphone, adresse postale de l'entreprise.</li>
            <li><strong>Professionnel :</strong> Nom de la société, secteur d'activité, besoins exprimés.</li>
            <li><strong>Navigation :</strong> Adresse IP, cookies techniques (pour le bon fonctionnement du site).</li>
          </ul>
        </section>

        <section className="info-section">
          <h2>3. Finalités du Traitement</h2>
          <p>
            Vos données sont traitées pour les raisons suivantes :
          </p>
          <ul className="info-list">
            <li>Gestion de vos demandes de contact, de devis ou de démonstration.</li>
            <li>Envoi d'informations commerciales ou de newsletters (avec votre consentement).</li>
            <li>Suivi de la relation client et exécution des contrats.</li>
            <li>Amélioration de l'expérience utilisateur sur notre plateforme.</li>
          </ul>
        </section>

        <section className="info-section">
          <h2>4. Conservation & Sécurité</h2>
          <p>
            Le Groupe ISD AFRIK met en œuvre toutes les mesures techniques et organisationnelles 
            appropriées pour garantir un niveau de sécurité adapté au risque, afin de protéger vos 
            données contre tout accès non autorisé, perte, destruction ou divulgation.
          </p>
          <p>
            Les données sont conservées pour une durée n'excédant pas celle nécessaire aux finalités 
            pour lesquelles elles sont collectées, conformément aux réglementations en vigueur.
          </p>
        </section>

        <section className="info-section">
          <h2>5. Partage des Données</h2>
          <p>
            Vos données personnelles sont destinées exclusivement aux services internes du Groupe 
            ISD AFRIK. Nous ne vendons ni ne louons vos informations à des tiers. 
            Certaines données peuvent être partagées avec nos partenaires technologiques 
            exclusivement pour l'exécution de vos commandes ou services.
          </p>
        </section>

        <section className="info-section">
          <h2>6. Vos Droits</h2>
          <p>
            Conformément aux lois sur la protection des données personnelles, vous disposez des droits suivants :
          </p>
          <ul className="info-list">
            <li>Droit d'accès et d'information sur vos données.</li>
            <li>Droit de rectification de vos données.</li>
            <li>Droit à l'effacement (droit à l'oubli).</li>
            <li>Droit d'opposition au traitement pour motif légitime.</li>
          </ul>
          <p>
            Pour exercer vos droits, contactez-nous à l'adresse : <strong>info@groupeisdafrik.com</strong>.
          </p>
        </section>

      </div>
    </div>
  );
}
