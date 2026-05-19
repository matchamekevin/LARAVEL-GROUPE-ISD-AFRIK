import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import { getApiBase } from "../utils/apiBase";
import "../styles/projets-new.css";

export default function Projets() {
    usePageMeta(
        "Nos Réalisations | Groupe ISD AFRIK",
        "Découvrez les projets emblématiques réalisés par le GROUPE ISD AFRIK : plateformes digitales, sécurité et ingénierie."
    );
    const navigate = useNavigate();
    const [projets, setProjets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${getApiBase()}/api/projets`);
                const data = await res.json();
                setProjets(Array.isArray(data) ? data : []);
            } catch {
                setProjets([]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <div className="projets-page projets-modern">
            <section className="projets-hero-modern">
                <div className="projets-hero-chip">Réalisations</div>
                <h1 className="projets-hero-title">Nos Projets Emblématiques</h1>
                <p className="projets-hero-subtitle">
                    Découvrez comment le GROUPE ISD AFRIK transforme les défis technologiques en succès opérationnels 
                    à travers le continent africain.
                </p>
            </section>

            <section className="projets-section">
                {!loading && (
                    <div className="projets-grid">
                        {projets.map((projet) => (
                            <article key={projet.id} className="projet-card">
                                <div className="projet-image-wrap">
                                    <img src={projet.image_url || projet.image_path} alt={projet.title} className="projet-image" />
                                    <span className="projet-category-badge">{projet.category}</span>
                                </div>
                                <div className="projet-content">
                                    <h3 className="projet-title">{projet.title}</h3>
                                    <p className="projet-desc">{projet.description}</p>
                                    <div className="projet-actions">
                                        <button 
                                            onClick={() => navigate(`/projets/${projet.slug}`)} 
                                            className="projet-link-btn projet-link-btn--pres"
                                        >
                                            Présentation <i className="fas fa-info-circle"></i>
                                        </button>
                                        <a 
                                            href={projet.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="projet-link-btn"
                                        >
                                            Visiter le site <i className="fas fa-external-link-alt"></i>
                                        </a>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
