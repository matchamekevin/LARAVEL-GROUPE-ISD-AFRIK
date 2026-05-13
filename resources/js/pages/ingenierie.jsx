import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import { getCategories } from "../services/ProduitService";
import { submitContactMessage } from "../admin/api";
import { resolveIngenierieDomaines } from "../data/ingenierieDomains";
import "../styles/ingenierie-new.css";

const sanitizeImageUrl = (value) => {
    const source = String(value || "").trim();
    if (!source) return "";
    if (source.startsWith("http://") || source.startsWith("https://") || source.startsWith("/")) return source;
    if (source.startsWith("storage/") || source.startsWith("images/")) return `/${source}`;
    return "";
};

const normalizeCategoryPayload = (response) => {
    const body = response?.data ?? response;
    if (Array.isArray(body)) return body;
    if (Array.isArray(body?.data)) return body.data;
    if (Array.isArray(body?.categories)) return body.categories;
    return [];
};

const sanitizeDomaines = (list = []) =>
    list.map((domaine) => ({
        ...domaine,
        image: sanitizeImageUrl(domaine.image),
    }));

export default function Ingenierie() {
    const [domaines, setDomaines] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [imageLoaded, setImageLoaded] = useState({});
    const [imageHidden, setImageHidden] = useState({});
    const [selectedSlug, setSelectedSlug] = useState("all");
    const [selectedDomains, setSelectedDomains] = useState(new Set());
    const [contactOpen, setContactOpen] = useState(false);
    const [contactForm, setContactForm] = useState({ nom_complet: '', email: '', telephone: '', sujet: '', message: '' });
    const [contactStatus, setContactStatus] = useState({ success: null, message: '' });

    usePageMeta(
        "Ingénierie informatique et industrielle | Groupe ISD AFRIK",
        "Domaines d'expertise pour l'architecture SI, la securite, les reseaux et les infrastructures d'entreprise."
    );

    useEffect(() => {
        let mounted = true;

        const loadDomaines = async () => {
            // Petit délai pour éviter le flash si l'API est trop rapide (optionnel mais aide au ressenti)
            try {
                const response = await getCategories({
                    segment: "ingenierie-page",
                    tree: 1,
                    _t: Date.now(),
                });
                const categories = normalizeCategoryPayload(response);
                const resolved = resolveIngenierieDomaines(categories, {
                    fallbackToDefaults: true,
                    includeBaseImageFallback: true,
                });

                if (!mounted) return;

                if (Array.isArray(resolved) && resolved.length) {
                    setDomaines(sanitizeDomaines(resolved));
                    setImageLoaded({});
                    setImageHidden({});
                } else {
                    setDomaines([]);
                }
            } catch (_error) {
                if (mounted) {
                    const fallback = resolveIngenierieDomaines([], {
                        fallbackToDefaults: true,
                        includeBaseImageFallback: true,
                    });
                    setDomaines(sanitizeDomaines(fallback));
                }
            } finally {
                if (mounted) {
                    // On laisse un petit temps pour que React process le state avant de masquer le loader
                    setTimeout(() => {
                        if (mounted) setIsLoading(false);
                    }, 100);
                }
            }
        };

        loadDomaines();

        return () => {
            mounted = false;
        };
    }, []);

    const filteredDomaines = useMemo(() => {
        if (selectedSlug === "all") return domaines;
        return domaines.filter((domaine) => domaine.slug === selectedSlug);
    }, [domaines, selectedSlug]);

    const toggleDomainSelection = (slug) => {
        setSelectedDomains((prev) => {
            const next = new Set(prev);
            if (next.has(slug)) next.delete(slug); else next.add(slug);
            return next;
        });
    };

    const openContactForSelection = () => {
        const labels = domaines
            .filter(d => selectedDomains.has(d.slug))
            .map(d => d.title || d.nom || d.slug);

        setContactForm((prev) => ({
            ...prev,
            sujet: labels.length ? `Demande: ${labels.join(', ')}` : 'Demande Ingenierie',
            message: labels.length ? `Je suis interesté par: ${labels.join(', ')}\n\nMerci de me contacter.` : prev.message,
        }));
        setContactOpen(true);
    };

    const submitContact = async (e) => {
        e && e.preventDefault && e.preventDefault();
        setContactStatus({ success: null, message: '' });
        try {
            const payload = {
                nom_complet: String(contactForm.nom_complet || '').trim(),
                email: String(contactForm.email || '').trim(),
                telephone: String(contactForm.telephone || '').trim() || null,
                sujet: String(contactForm.sujet || '').trim() || 'Demande Ingenierie',
                message: String(contactForm.message || '').trim(),
            };

            if (!payload.nom_complet || !payload.email || !payload.message) {
                setContactStatus({ success: false, message: 'Nom, email et message sont obligatoires.' });
                return;
            }

            await submitContactMessage(payload);
            setContactStatus({ success: true, message: 'Message envoyé, merci.' });
            setContactOpen(false);
            setSelectedDomains(new Set());
            setContactForm({ nom_complet: '', email: '', telephone: '', sujet: '', message: '' });
        } catch (err) {
            setContactStatus({ success: false, message: err?.response?.data?.message || 'Erreur lors de l envoi.' });
        }
    };

    const handleImageLoad = (slug) => {
        setImageLoaded(prev => ({ ...prev, [slug]: true }));
    };

    return (
        <div className="ingenierie-page ingenierie-modern"> 
            <section className="ingenierie-hero-modern">
                <h1 className="ingenierie-hero-title">Nos Domaines d&apos;Expertise</h1>
                <p className="ingenierie-hero-subtitle">
                    Ingenierie informatique et industrielle - Solutions completes pour entreprises et projets d&apos;infrastructure
                </p>
</section>

            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                {!isLoading && domaines.length > 0 && (
                    <div className="ingenierie-filter-bar">
                        <label htmlFor="ingenierie-domain-filter" className="ingenierie-filter-label">Selection rapide</label>
                        <select
                            id="ingenierie-domain-filter"
                            className="ingenierie-filter-select"
                            value={selectedSlug}
                            onChange={(event) => setSelectedSlug(event.target.value)}
                        >
                            <option value="all">Tous les domaines</option>
                            {domaines.map((domaine) => (
                                <option key={domaine.slug} value={domaine.slug}>{domaine.title}</option>
                            ))}
                        </select>
                    </div>
                )}
                {isLoading ? (
                    <div className="ingenierie-grid">
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                            <div key={n} className="ingenierie-card skeleton-card">
                                <div className="ingenierie-card-image skeleton-image"></div>
                                <div className="ingenierie-card-content">
                                    <div className="skeleton-title"></div>
                                    <div className="skeleton-desc"></div>
                                    <div className="skeleton-desc"></div>
                                    <div className="skeleton-btn"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="ingenierie-grid"> 
                        {filteredDomaines.length ? filteredDomaines.map((domaine) => (
                            <article 
                                key={domaine.slug} 
                                id={`domaine-${domaine.slug}`}
                                className="ingenierie-card"
                            >
                                <label className="ingenierie-card-select">
                                    <input
                                        type="checkbox"
                                        checked={selectedDomains.has(domaine.slug)}
                                        onChange={() => toggleDomainSelection(domaine.slug)}
                                        aria-label={`Selectionner ${domaine.title || domaine.nom}`}
                                    />
                                </label>
                                {domaine.image && !imageHidden[domaine.slug] ? (
                                    <img 
                                        src={domaine.image} 
                                        alt={domaine.title}
                                        loading="lazy"
                                        className="ingenierie-card-image"
                                        style={{
                                            opacity: imageLoaded[domaine.slug] ? 1 : 0,
                                            transition: "opacity 0.4s ease-in-out"
                                        }}
                                        onLoad={() => handleImageLoad(domaine.slug)}
                                        onError={() => {
                                            setImageHidden((prev) => ({ ...prev, [domaine.slug]: true }));
                                        }}
                                    />
                                ) : (
                                    <div className="ingenierie-card-image ingenierie-card-image--empty" aria-hidden="true"></div>
                                )}
                                <div className="ingenierie-card-overlay"></div>
                                <div className="ingenierie-card-content">
                                    <h3 className="ingenierie-card-title">{domaine.title}</h3>
                                    <p className="ingenierie-card-desc">{domaine.description}</p>
                                    <div className="ingenierie-card-actions">
                                        <Link 
                                            to={`/prestation/${domaine.slug}`}
                                            className="ingenierie-btn"
                                        >
                                            Prestation →
                                        </Link>
                                        <button type="button" className="ingenierie-btn ingenierie-btn-secondary" onClick={() => { toggleDomainSelection(domaine.slug); }}>
                                            {selectedDomains.has(domaine.slug) ? 'Deselectionner' : 'Selectionner'}
                                        </button>
                                    </div>
                                </div>
                            </article> 
                        )) : (
                            <p className="ingenierie-card-desc">
                                {domaines.length ? "Aucun domaine ne correspond à votre sélection." : "Aucun domaine disponible pour le moment."}
                            </p>
                        )}
                    </div>
                )}
            </section>

            <div className="ingenierie-contact-bar">
                <button type="button" className="ingenierie-contact-btn" disabled={selectedDomains.size === 0} onClick={openContactForSelection}>
                    Contacter pour la sélection ({selectedDomains.size})
                </button>
                {contactStatus.message ? (
                    <div className={`ingenierie-contact-status ${contactStatus.success ? 'success' : 'error'}`}>{contactStatus.message}</div>
                ) : null}
            </div>

            {contactOpen && (
                <div className="ingenierie-contact-modal" role="dialog" aria-modal="true">
                    <div className="ingenierie-contact-shell">
                        <h3>Envoyer une demande</h3>
                        <form onSubmit={submitContact}>
                            <label>Nom complet<input value={contactForm.nom_complet} onChange={(e)=> setContactForm(prev => ({...prev, nom_complet: e.target.value}))} required/></label>
                            <label>Email<input type="email" value={contactForm.email} onChange={(e)=> setContactForm(prev => ({...prev, email: e.target.value}))} required/></label>
                            <label>Téléphone<input value={contactForm.telephone} onChange={(e)=> setContactForm(prev => ({...prev, telephone: e.target.value}))} /></label>
                            <label>Sujet<input value={contactForm.sujet} onChange={(e)=> setContactForm(prev => ({...prev, sujet: e.target.value}))} /></label>
                            <label>Message<textarea rows={6} value={contactForm.message} onChange={(e)=> setContactForm(prev => ({...prev, message: e.target.value}))} required/></label>
                            <div className="ingenierie-contact-actions">
                                <button type="button" className="ingenierie-btn" onClick={()=> setContactOpen(false)}>Annuler</button>
                                <button type="submit" className="ingenierie-btn ingenierie-btn-primary">Envoyer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <section className="ingenierie-cta">
                <h2 className="ingenierie-cta-title">Projet à réaliser ?</h2>
                <p className="ingenierie-cta-text">
                    Nos experts analysent vos besoins et vous proposent la meilleure combinaison de prestation
                </p>
                <Link to="/contact" className="ingenierie-hero-cta">
                    Nous contacter
                </Link>
            </section>
        </div>
    );
} 
