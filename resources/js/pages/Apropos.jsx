import React from "react";
import usePageMeta from "../hooks/usePageMeta";
import "../styles/info-pages-new.css";

export default function Apropos() {
  usePageMeta(
    "À propos | Groupe ISD AFRIK",
    "Découvrez la vision, la mission et les valeurs du Groupe ISD AFRIK, acteur technologique de référence en Afrique de l'Ouest."
  );

  return (
    <div className="info-page-modern apropos-page">
      {/* Hero Section */}
      <section className="info-hero">
        <h1>Groupe ISD AFRIK – Qui sommes-nous ?</h1>
        <p>
          Un partenaire technologique de référence dédié à l'innovation et à la 
          performance des organisations en Afrique de l'Ouest.
        </p>
      </section>

      {/* Main Content Area */}
      <div className="info-content">
        
        <section className="info-section">
          <h2>Notre Histoire & Expertise</h2>
          <p>
            Le <strong>Groupe ISD AFRIK</strong> est une entreprise spécialisée dans les solutions
            technologiques de pointe, la sécurité électronique et les services numériques stratégiques. 
            Implanté au cœur de l'Afrique de l'Ouest, nous accompagnons les entreprises et les institutions 
            dans leur transition vers l'ère digitale.
          </p>
          <p>
            Grâce à une équipe d'experts qualifiés et à des partenariats technologiques internationaux, 
            nous proposons des solutions qui ne se contentent pas de répondre aux standards mondiaux, 
            mais qui sont profondément adaptées aux réalités et aux défis du marché africain.
          </p>
        </section>

        <section className="info-section">
          <h2>Notre Vision</h2>
          <p>
            Notre ambition est de devenir le leader incontesté de la transformation digitale et de la 
            sécurité technologique sur le continent. Nous croyons en une Afrique connectée, sécurisée 
            et technologiquement souveraine, où chaque organisation dispose des outils nécessaires pour 
            exceller à l'échelle mondiale.
          </p>
        </section>

        <section className="info-section">
          <h2>Notre Mission</h2>
          <p>
            Nous nous donnons pour mission d'être le catalyseur de la croissance de nos clients en 
            sécurisant leurs actifs critiques et en optimisant leurs processus métier par le numérique.
          </p>
          <ul className="info-list">
            <li><strong>Sécurisation :</strong> Protection avancée des infrastructures physiques et logiques.</li>
            <li><strong>Optimisation :</strong> Modernisation des systèmes technologiques pour une efficacité maximale.</li>
            <li><strong>Transformation :</strong> Accompagnement stratégique vers une digitalisation complète et rentable.</li>
          </ul>
        </section>

        <section className="info-section">
          <h2>Nos Valeurs Fondamentales</h2>
          <p>
            Chaque projet que nous entreprenons est guidé par des principes qui définissent notre 
            identité et garantissent la satisfaction de nos partenaires.
          </p>
          
          <div className="about-values-grid">
            <article className="value-card">
              <span className="material-icons" style={{fontSize:36}}>workspace_premium</span>
              <h3>Excellence</h3>
              <p>Une rigueur professionnelle absolue dans chaque livraison et chaque conseil apporté.</p>
            </article>

            <article className="value-card">
              <span className="material-icons" style={{fontSize:36}}>lightbulb</span>
              <h3>Innovation</h3>
              <p>Une quête permanente des technologies de demain pour résoudre les problèmes d'aujourd'hui.</p>
            </article>

            <article className="value-card">
              <span className="material-icons" style={{fontSize:36}}>handshake</span>
              <h3>Fiabilité</h3>
              <p>Un engagement total pour garantir la continuité et la performance de vos systèmes.</p>
            </article>

            <article className="value-card">
              <span className="material-icons" style={{fontSize:36}}>groups</span>
              <h3>Impact Local</h3>
              <p>Le développement actif des compétences et des talents technologiques sur le continent.</p>
            </article>
          </div>
        </section>

      </div>
    </div>
  );
}
