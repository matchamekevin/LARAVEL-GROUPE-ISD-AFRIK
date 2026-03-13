import React from "react";
import "../../css/fiabilite.css";

export default function Fiabilite() {
  const guarantees = [
    { 
      icon: "✓", 
      title: "Qualité certifiée", 
      description: "Tous nos livrables respectent les standards ISO et normes internationales de qualité"
    },
    { 
      icon: "🛡️", 
      title: "Sécurité garantie", 
      description: "Systèmes sécurisés avec chiffrement et conformité RGPD/LPDN"
    },
    { 
      icon: "⚙️", 
      title: "Performance stable", 
      description: "Infrastructure robuste avec 99.8% de disponibilité garantie"
    },
    { 
      icon: "📊", 
      title: "Support 24/7", 
      description: "Équipe dédiée disponible 24h/24 pour vos besoins d'assistance"
    }
  ];

  const commitments = [
    { 
      title: "Tests rigoureux", 
      description: "Chaque solution passe par un processus de test exhaustif avant livraison"
    },
    { 
      title: "Documentation complète", 
      description: "Guides détaillés et formation fournis à tous les utilisateurs"
    },
    { 
      title: "SLA garanti", 
      description: "Accords de niveau de service avec compensation en cas de non-conformité"
    },
    { 
      title: "Maintenance proactive", 
      description: "Surveillance continue et mises à jour régulières pour la stabilité"
    }
  ];

  const metrics = [
    { number: "99.8%", label: "Uptime garanti" },
    { number: "24/7", label: "Support technique" },
    { number: "100%", label: "Satisfaction client" },
    { number: "0", label: "Faille de sécurité" }
  ];

  return (
    <div className="fiabilite-page">
      <section className="fiabilite-hero">
        <h1>Fiabilité et qualité</h1>
        <p>
          Nos livrables sont testés et conformes aux standards de qualité les plus exigeants pour 
          garantir votre satisfaction et la continuité de vos opérations.
        </p>
      </section>

      <div className="fiabilite-content">
        <section className="fiabilite-guarantees">
          <h2 className="guarantees-title">Nos garanties</h2>
          <div className="guarantees-grid">
            {guarantees.map((item, idx) => (
              <div key={idx} className="guarantee-card">
                <div className="guarantee-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="fiabilite-commitments">
          <h2 className="commitments-title">Nos engagements</h2>
          <ul className="commitments-list">
            {commitments.map((item, idx) => (
              <li key={idx} className="commitment-item">
                <h4>{item.title}</h4>
                <p>{item.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="fiabilite-metrics">
          {metrics.map((item, idx) => (
            <div key={idx} className="metric-item">
              <div className="metric-number">{item.number}</div>
              <p className="metric-label">{item.label}</p>
            </div>
          ))}
        </section>

        <section className="fiabilite-cta">
          <h2>Faites confiance à notre fiabilité</h2>
          <p>Rejoignez les centaines d'entreprises qui nous font confiance pour leurs solutions critiques.</p>
          <a href="/contact" className="fiabilite-cta-btn">Demander une consultation</a>
        </section>
      </div>
    </div>
  );
}