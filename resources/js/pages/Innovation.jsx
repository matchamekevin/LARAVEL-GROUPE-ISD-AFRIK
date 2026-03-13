import React from "react";
import "../../css/innovation.css";

export default function Innovation() {
  const features = [
    { icon: "🚀", title: "Technologie moderne", description: "Utilisation des frameworks et outils les plus actuels" },
    { icon: "🔒", title: "Sécurité avancée", description: "Normes de sécurité et conformité légale garanties" },
    { icon: "⚡", title: "Performance optimale", description: "Systèmes rapides, évolutifs et fiables" },
    { icon: "🌍", title: "Couverture globale", description: "Solutions adaptées à vos marchés locaux et internationaux" }
  ];

  return (
    <div className="innovation-page">
      <section className="innovation-hero">
        <h1>Innovation continue</h1>
        <p>
          Nous intégrons en continu les meilleures technologies pour proposer des solutions modernes, 
          performantes et évolutives. Notre engagement envers l'innovation nous permet de rester à 
          l'avant-garde de l'industrie technologique en Afrique.
        </p>
      </section>

      <div className="innovation-content">
        <section className="innovation-features">
          <div className="features-grid">
            {features.map((feat, idx) => (
              <div key={idx} className="feature-card">
                <div className="feature-icon">{feat.icon}</div>
                <h3>{feat.title}</h3>
                <p>{feat.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="innovation-description">
          <h2>Notre approche de l'innovation</h2>
          <p>
            Nous investissons continuellement dans la recherche et le développement pour anticiper 
            les besoins du marché et proposer des solutions qui dépassent les attentes de nos clients.
          </p>
          <p>
            Notre équipe de spécialistes collabore avec les partenaires technologiques leaders pour 
            intégrer les dernières avancées en intelligence artificielle, cloud computing, cybersécurité 
            et transformation numérique.
          </p>
        </section>

        <section className="innovation-highlights">
          <div className="highlight-item">
            <div className="highlight-number">15+</div>
            <p className="highlight-label">Années d'expérience</p>
          </div>
          <div className="highlight-item">
            <div className="highlight-number">500+</div>
            <p className="highlight-label">Projets réussis</p>
          </div>
          <div className="highlight-item">
            <div className="highlight-number">1000+</div>
            <p className="highlight-label">Clients satisfaits</p>
          </div>
          <div className="highlight-item">
            <div className="highlight-number">99.8%</div>
            <p className="highlight-label">Disponibilité garantie</p>
          </div>
        </section>

        <section className="innovation-cta">
          <h2>Prêt à innover avec nous?</h2>
          <p>Contactez-nous pour découvrir comment nous pouvons transformer votre organisation.</p>
          <a href="/contact" className="innovation-cta-btn">Commencer maintenant</a>
        </section>
      </div>
    </div>
  );
}
