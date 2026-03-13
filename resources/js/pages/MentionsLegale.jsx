import React from "react";
import "../styles/legal.css";

export default function MentionsLegales() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Mentions Légales</h1>
        <p className="legal-date">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

        <section className="legal-section">
          <h2>1. Éditeur du site</h2>
          <p><strong>Raison sociale :</strong> GROUPE ISD AFRIK</p>
          <p><strong>Forme juridique :</strong> [À compléter - SARL, SA, etc.]</p>
          <p><strong>Capital social :</strong> [À compléter]</p>
          <p><strong>Siège social :</strong> Lomé, Togo</p>
          <p><strong>Email :</strong> contact@isd-afrik.com</p>
          <p><strong>Téléphone :</strong> +228 90 00 00 00</p>
          <p><strong>Numéro d'immatriculation :</strong> [À compléter - RCCM]</p>
        </section>

        <section className="legal-section">
          <h2>2. Directeur de la publication</h2>
          <p><strong>Nom :</strong> M. GUEZO MEVO Sylvestre</p>
          <p><strong>Qualité :</strong> Directeur Général</p>
        </section>

        <section className="legal-section">
          <h2>3. Hébergement</h2>
          <p><strong>Hébergeur :</strong> Namecheap</p>
          <p><strong>Adresse :</strong> 4600 East Washington Street, Suite 305, Phoenix, AZ 85034, USA</p>
          <p><strong>Site web :</strong> <a href="https://www.namecheap.com" target="_blank" rel="noopener noreferrer">www.namecheap.com</a></p>
        </section>

        <section className="legal-section">
          <h2>4. Propriété intellectuelle</h2>
          <p>
            L'ensemble du contenu de ce site (textes, images, vidéos, logos, graphismes, etc.) 
            est la propriété exclusive du GROUPE ISD AFRIK ou de ses partenaires.
          </p>
          <p>
            Toute reproduction, distribution, modification, adaptation, retransmission ou 
            publication de ces différents éléments est strictement interdite sans l'accord 
            écrit préalable du GROUPE ISD AFRIK.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Responsabilité</h2>
          <p>
            Le GROUPE ISD AFRIK s'efforce d'assurer l'exactitude et la mise à jour des 
            informations diffusées sur ce site. Toutefois, des erreurs ou omissions peuvent 
            survenir. Le visiteur devra donc s'assurer de l'exactitude des informations.
          </p>
          <p>
            Le GROUPE ISD AFRIK ne pourra être tenu responsable des dommages directs ou 
            indirects causés au matériel de l'utilisateur lors de l'accès au site.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Données personnelles</h2>
          <p>
            Conformément à la réglementation en vigueur sur la protection des données 
            personnelles, vous disposez d'un droit d'accès, de rectification, de suppression 
            et d'opposition aux données vous concernant.
          </p>
          <p>
            Pour exercer ces droits, vous pouvez nous contacter à l'adresse : 
            <strong> contact@isd-afrik.com</strong>
          </p>
          <p>
            Pour plus d'informations, consultez notre 
            <a href="/politique-confidentialite"> Politique de confidentialité</a>.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Cookies</h2>
          <p>
            Ce site utilise des cookies pour améliorer l'expérience utilisateur et 
            analyser le trafic. En continuant à naviguer sur ce site, vous acceptez 
            l'utilisation de cookies.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Droit applicable</h2>
          <p>
            Les présentes mentions légales sont soumises au droit togolais. 
            Tout litige relatif à l'utilisation de ce site sera de la compétence 
            exclusive des tribunaux togolais.
          </p>
        </section>

      </div>
    </div>
  );
}