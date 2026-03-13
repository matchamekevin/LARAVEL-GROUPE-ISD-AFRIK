import React from "react";
import "../../js/styles/home.css";
import usePageMeta from "../hooks/usePageMeta";

export default function Contact() {
    usePageMeta(
        "Contact | Groupe ISD AFRIK",
        "Contactez le Groupe ISD AFRIK pour vos besoins en solutions technologiques, securite electronique et transformation digitale."
    );

    return (
        <div className="home contact-page premium-page">
            <section className="contact-hero">
                <div className="contact-hero-inner">
                    <div className="section-header">
                        <h2>Contactez-nous</h2>
                        <p>Vous souhaitez en savoir plus sur nos solutions technologiques ? Notre equipe est a votre disposition.</p>
                    </div>
                    <div className="contact-hero-actions">
                        <button className="btn-primary">Prendre rendez-vous</button>
                        <button className="btn-secondary">Demander un devis</button>
                    </div>
                </div>
            </section>

            <section className="contact-content">
                <div className="contact-grid">
                    <div className="contact-cards">
                        <div className="contact-card">
                            <div className="contact-card-icon"><i className="fas fa-phone"></i></div>
                            <h3>Telephone</h3>
                            <p>+228 70 73 83 19</p>
                            <span>Lu - Ve, 08:00 - 18:00</span>
                        </div>
                        <div className="contact-card">
                            <div className="contact-card-icon"><i className="fas fa-envelope"></i></div>
                            <h3>Email</h3>
                            <p>info@groupeisdafrik.com</p>
                            <span>Support et demandes commerciales</span>
                        </div>
                        <div className="contact-card">
                            <div className="contact-card-icon"><i className="fas fa-map-marker-alt"></i></div>
                            <h3>Presence regionale</h3>
                            <p>Benin - Togo - Niger - Cote d'Ivoire - Burkina Faso</p>
                            <span>Accompagnement de proximite en Afrique de l'Ouest</span>
                        </div>
                    </div>

                    <div className="contact-form-card">
                        <h3>Envoyez un message</h3>
                        <p className="contact-form-subtitle">Nous vous recontactons sous 24-48h.</p>
                        <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
                            <div className="contact-form-row">
                                <div className="contact-field">
                                    <label htmlFor="contact-name">Nom complet</label>
                                    <input id="contact-name" type="text" placeholder="Votre nom" required />
                                </div>
                                <div className="contact-field">
                                    <label htmlFor="contact-email">Email</label>
                                    <input id="contact-email" type="email" placeholder="Votre email" required />
                                </div>
                            </div>
                            <div className="contact-form-row">
                                <div className="contact-field">
                                    <label htmlFor="contact-phone">Telephone</label>
                                    <input id="contact-phone" type="tel" placeholder="Votre numero" />
                                </div>
                                <div className="contact-field">
                                    <label htmlFor="contact-subject">Sujet</label>
                                    <input id="contact-subject" type="text" placeholder="Sujet" />
                                </div>
                            </div>
                            <div className="contact-field">
                                <label htmlFor="contact-message">Message</label>
                                <textarea id="contact-message" rows="5" placeholder="Decrivez votre besoin" required />
                            </div>
                            <div className="contact-form-actions">
                                <button className="btn-primary" type="submit">
                                    <i className="fas fa-paper-plane"></i> Envoyer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
}