import React from "react";
import "../styles/cgv.css";
import usePageMeta from "../hooks/usePageMeta";

export default function Cgv() {
  usePageMeta(
    "CGV | Groupe ISD AFRIK",
    "Conditions Generales de Vente du Groupe ISD AFRIK pour les solutions technologiques, services numeriques et formations."
  );

  return (
    <div className="legal-page cgv-page">
      <section className="legal-hero">
        <h1>Conditions Générales de Vente</h1>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <section>
          <h2>Produits et services</h2>
          <p>
            Le Groupe ISD AFRIK propose des solutions technologiques, des services numeriques,
            des formations professionnelles et des solutions de securite electronique.
          </p>
        </section>

        <section>
          <h2>Prix et modalités de paiement</h2>
          <p>
            Les prix sont communiques sur devis ou selon les offres en vigueur. Les modalites de paiement,
            delais et conditions specifiques sont precisees dans chaque proposition commerciale.
          </p>
        </section>

        <section>
          <h2>Livraison et exécution</h2>
          <p>
            Les delais de livraison, deploiement ou execution sont convenus avec le client selon la nature
            du projet, sa complexite et les contraintes operationnelles.
          </p>
        </section>

        <section>
          <h2>Support, maintenance et responsabilites</h2>
          <p>
            Le support et la maintenance sont assures selon les conditions prevues au contrat.
            Chaque partie s'engage a collaborer pour garantir la bonne execution des prestations.
          </p>
        </section>

        <section>
          <h2>Contact commercial</h2>
          <p>
            Pour toute information relative aux offres et conditions de vente, contactez-nous a:
            info@groupeisdafrik.com.
          </p>
        </section>

        <section>
          <h2>Garanties et responsabilités</h2>
          <p>Préciser les garanties légales et limites de responsabilité.</p>
        </section>
      </div>
    </div>
  );
}
