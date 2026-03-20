import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/footer.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState(null);

  // Liste des pays avec drapeaux et contacts
  const countries = [
    { code: "TG", name: "Togo", flag: "/flags/tg.png", phone: "+228 70 73 83 19" },
    { code: "BJ", name: "Bénin", flag: "/flags/be.png", phone: "+229  96 12 19 03" },
    { code: "BF", name: "Burkina Faso", flag: "/flags/bk.png", phone: "+ 226   66 00 66 54" },
    { code: "CI", name: "Côte d'Ivoire", flag: "/flags/co.png", phone: "+227 97  76 07 29" },
    { code: "NE", name: "Niger", flag: "/flags/ni.png", phone: "+ 225 03 71 18 42" },
  ];

  // Services du groupe avec liens vers leurs pages
  const services = [
    { name: "Actualités", icon: "fa-newspaper", link: "/actualites" },
    { name: "Développement d'applications", icon: "fa-code", link: "/services/developpement" },
    { name: "Communication et publicité", icon: "fa-bullhorn", link: "/services/communication" },
    { name: "Fourniture de TPE", icon: "fa-credit-card", link: "/services/tpe" },
    { name: "Formation sur drones", icon: "fa-helicopter", link: "/services/drones" },
    { name: "Bâtiment et travaux publics", icon: "fa-building", link: "/services/btp" },
    { name: "A propos", icon: "fa-info-circle", link: "/apropos" },
  ];

  // Liens réseaux sociaux
  const socialLinks = [
    { name: "Facebook", icon: "fab fa-facebook-f", url: "https://web.facebook.com/photo/?fbid=816380151385759&set=a.108025592221222&__cft__[0]=AZVAzGiJ9gGXF2g5FRM95r03tO0AWgb43aTuJM5Qa3hpZXqol3W09m0-yBJ-YMKY9g6BMP2HbpBi805KmSDwVOpaAFTNquCde6HY-JssOf7GhUdiLna_aDuWEjuyw514JmTG3vk1vmiNGIA96BmarueMCe9auBJ_PzktD6UiKV72dRb9ePHY5Gl727V8jOUwA18&__tn__=EH-R", color: "#1877F2" },

    { name: "LinkedIn", icon: "fab fa-linkedin-in", url: "https://www.linkedin.com/posts/groupeisdafrik_lafrique-innove-lafrique-code-lafrique-activity-7400204077323845632-W_Ta?utm_source=share&utm_medium=member_desktop&rcm=ACoAADb7rdMBLH4JsSr6_SGbjT2SCCpbZf9WK6o", color: "#0A66C2" },

    { name: "WhatsApp", icon: "fab fa-whatsapp", url: "https://whatsapp.com/channel/0029VbCfFmWLikgIERXPQM3b", color: "#25D366" },
    { name: "YouTube", icon: "fab fa-youtube", url: "https://www.youtube.com/@ISDAfrik", color: "#FF0000" },
    { name: "Instagram", icon: "fab fa-instagram", url: "https://www.instagram.com/groupe_isd_afrik/p/DRm4e4ijfjV/", color: "#E4405F" },

    {name: "TikTok", icon: "fab fa-tiktok", url: "https://vt.tiktok.com/ZSfxcJ2hN/", color: "#000000" },
  ];

  // Soumission newsletter reliée au backend
  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSubscribed(true);
        setEmail("");
        setTimeout(() => setSubscribed(false), 3000);
      } else {
        const data = await response.json();
        setError(data.message || "Erreur lors de l'inscription");
      }
    } catch (err) {
      setError("Impossible de contacter le serveur");
    }
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        
        {/* SECTION 1 : LOGO + À PROPOS */}
        <div className="footer-section footer-about">
          <img src="/images/logo.webp" alt="ISD AFRIK Logo" className="footer-logo" />
          <p className="footer-description">
            Leader en solutions informatiques et transformation digitale en Afrique de l'Ouest. 
            Présents dans 5 pays pour accompagner votre croissance.
          </p>
          <div className="footer-contact">
            <p><i className="fas fa-envelope"></i> contact@isd-afrik.com</p>
            <p><i className="fas fa-map-marker-alt"></i> Lomé, Togo</p>
          </div>
        </div>

        {/* SECTION 2 : NOS SERVICES */}
        <div className="footer-section">
          <h4>Nos Services</h4>
          <ul className="footer-services">
            {services.map((service, index) => (
              <li key={index}>
                <Link to={service.link} className="service-link">
                  <i className={`fas ${service.icon}`}></i>
                  <span>{service.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* SECTION 3 : NOS PAYS */}
        <div className="footer-section">
          <h4>Nos Implantations</h4>
          <ul className="footer-countries">
            {countries.map((country) => (
              <li key={country.code} className="country-item">
                <img src={country.flag} alt={country.name} className="country-flag" />
                <div className="country-info">
                  <span className="country-name">{country.name}</span>
                  <span className="country-phone">{country.phone}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* SECTION 4 : NEWSLETTER + RÉSEAUX SOCIAUX */}
        <div className="footer-section">
          <h4>Restez Connectés</h4>
          
          {/* Newsletter */}
          <div className="footer-newsletter">
            <p className="newsletter-text">Abonnez-vous à notre newsletter</p>
            <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
              <input
                type="email"
                placeholder="Votre email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="newsletter-input"
              />
              <button type="submit" className="newsletter-btn">
                <i className="fas fa-paper-plane"></i>
              </button>
            </form>
            {subscribed && (
              <p className="newsletter-success">✅ Inscription réussie !</p>
            )}
            {error && (
              <p className="newsletter-error">❌ {error}</p>
            )}
          </div>

          {/* Réseaux sociaux */}
          <div className="footer-social">
            <p className="social-text">Suivez-nous</p>
            <div className="social-icons">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                  style={{ '--social-color': social.color }}
                  title={social.name}
                >
                  <i className={social.icon}></i>
                </a>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER BOTTOM : COPYRIGHT + LIENS LÉGAUX */}
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p className="footer-copyright">
            © {new Date().getFullYear()} Groupe ISD AFRIK. Tous droits réservés.
          </p>
          <div className="footer-legal">
            <Link to="/actualites">Actualités</Link>
            <span className="separator">•</span>
            <Link to="/apropos">À propos</Link>
            <span className="separator">•</span>
            <Link to="/mentions-legales">Mentions légales</Link>
            <span className="separator">•</span>
            <Link to="/politique-confidentialite">Politique de confidentialité</Link>
            <span className="separator">•</span>
            <Link to="/cgv">CGV</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
