import React from "react";
import "../styles/apropos.css";
import usePageMeta from "../hooks/usePageMeta";

export default function Apropos() {
  usePageMeta(
    "A propos | Groupe ISD AFRIK",
    "Decouvrez la vision, la mission et les valeurs du Groupe ISD AFRIK, acteur technologique de reference en Afrique de l'Ouest."
  );

  return (
    <div className="apropos-page premium-page">
      <h1>Groupe ISD AFRIK – Qui sommes-nous ?</h1>

      <p className="intro">
        Le Groupe ISD AFRIK est une entreprise spécialisée dans les solutions
        technologiques, la sécurité électronique et les services numériques pour
        les entreprises et les institutions en Afrique de l’Ouest. Grâce à une
        équipe d’experts qualifiés et à des partenaires technologiques
        reconnus, nous proposons des solutions innovantes, performantes et
        adaptées aux réalités du marché africain.
      </p>

      <div className="apropos-grid">
        <div className="apropos-card">
          <h2>Notre vision</h2>
          <p>Devenir un acteur majeur de la transformation digitale et de la sécurité technologique en Afrique.</p>
        </div>

        <div className="apropos-card">
          <h2>Notre mission</h2>
          <p>Accompagner les entreprises et institutions africaines dans :</p>
          <ul style={{ textAlign: 'left', marginTop: 8 }}>
            <li>la sécurisation de leurs infrastructures</li>
            <li>l’optimisation de leurs systèmes technologiques</li>
            <li>la transformation digitale de leurs activités</li>
          </ul>
        </div>

        <div className="apropos-card">
          <h2>Nos valeurs</h2>
          <ul style={{ textAlign: 'left', marginTop: 8 }}>
            <li>✔ Excellence professionnelle</li>
            <li>✔ Innovation technologique</li>
            <li>✔ Fiabilité et qualité</li>
            <li>✔ Engagement client</li>
            <li>✔ Développement des compétences en Afrique</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
