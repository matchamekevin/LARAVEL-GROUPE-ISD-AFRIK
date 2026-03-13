import React from "react";
import "../../css/accompagnement.css";

export default function Accompagnement() {
  const processSteps = [
    { 
      number: 1, 
      title: "Diagnostic initial", 
      description: "Analyse complète de vos besoins, de votre organisation et de votre contexte"
    },
    { 
      number: 2, 
      title: "Planification stratégique", 
      description: "Co-construction d'une feuille de route adaptée à vos objectifs"
    },
    { 
      number: 3, 
      title: "Mise en œuvre", 
      description: "Déploiement progressif avec milestones validés et ajustements réguliers"
    },
    { 
      number: 4, 
      title: "Formation & transfert", 
      description: "Formation complète de vos équipes et documentation détaillée"
    }
  ];

  const teams = [
    { 
      icon: "👥", 
      name: "Chef de projet", 
      role: "Coordination globale",
      description: "Responsable du succès du projet et du respect des délais"
    },
    { 
      icon: "⚙️", 
      name: "Équipe technique", 
      role: "Implémentation",
      description: "Spécialistes déployés selon vos besoins spécifiques"
    },
    { 
      icon: "🎓", 
      name: "Formateurs", 
      role: "Transfert de compétences",
      description: "Formation pratique et documentation pour votre équipe"
    }
  ];

  const availability = [
    "Support disponible 24h/24, 7j/7",
    "Hotline dédiée avec temps de réponse garanti",
    "Escalade rapide en cas de problème critique",
    "Accès à nos experts seniors en permanence"
  ];

  return (
    <div className="accompagnement-page">
      <section className="accompagnement-hero">
        <h1>Accompagnement personnalisé</h1>
        <p>
          Nous vous accompagnons à chaque étape de vos projets, de l'analyse des besoins à la mise 
          en production et au-delà. Notre approche collaborative garantit l'alignement avec vos objectifs.
        </p>
      </section>

      <div className="accompagnement-content">
        <section className="accompaniment-process">
          <h2 className="process-title">Notre processus d'accompagnement</h2>
          <div className="process-steps">
            {processSteps.map((step, idx) => (
              <div key={idx} className="process-step">
                <div className="step-number">{step.number}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="accompaniment-teams">
          <h2 className="teams-title">Nos équipes dédiées</h2>
          <div className="teams-grid">
            {teams.map((team, idx) => (
              <div key={idx} className="team-card">
                <div className="team-icon">{team.icon}</div>
                <h3 className="team-name">{team.name}</h3>
                <p className="team-role">{team.role}</p>
                <p className="team-description">{team.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="accompaniment-availability">
          <h2>Disponibilité et support</h2>
          <div>
            {availability.map((item, idx) => (
              <div key={idx} className="availability-item">
                <span className="availability-text">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="accompaniment-cta">
          <h2>Démarrez votre projet avec nous</h2>
          <p>Prêt à transformer votre organisation? Contactez-nous pour un premier diagnostic gratuit.</p>
          <a href="/contact" className="accompaniment-cta-btn">Planifier un appel</a>
        </section>
      </div>
    </div>
  );
}
