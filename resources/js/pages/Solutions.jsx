import React from "react";
import { useNavigate } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import { ENGINEERING_DELIVERY_STEPS, ENGINEERING_FAMILIES } from "../data/engineeringCatalog";
import "../styles/marketing-premium.css";


export default function Solutions() {
    usePageMeta(
        "Solutions / Produits | Groupe ISD AFRIK",
        "Solutions de gestion d'entreprise, securite electronique et outils numeriques pour la transformation digitale en Afrique."
    );
    const navigate = useNavigate();

    const solutions = [
        {
            title: "Pole Ingenierie transactionnelle",
            description: "Prestations autour des familles Drone et TPE pour la mise en place de solutions terrain avec typologies et modeles adaptes.",
            image: "/images/solutions/im1.webp",
            points: ["Cadrage metier", "Selection type/modele", "Mise en service et formation"],
            link: "/produits?categories=drone,tpe"
        },
        {
            title: "Pole Infrastructures techniques",
            description: "Conception, fourniture et deploiement des equipements d'archivage, materiel informatique, reseau, incendie, energie et telecommunications.",
            image: "/images/solutions/im2.webp",
            points: ["Ingenierie de conception", "Integration sur site", "Maintenance preventive"],
            link: "/produits?categories=archivage-numerique,materiel-informatique,reseau-informatique,incendie,energie,telecommunications"
        },
        {
            title: "Pole Cybersecurite et donnees",
            description: "Protection des infrastructures et des bases de donnees avec des offres declinables par type et modele.",
            image: "/images/solutions/im3.webp",
            points: ["Audit securite", "Durcissement des plateformes", "Sauvegarde et continuite"],
            link: "/produits?categories=securite-informatique-base-de-donnees"
        }
    ];

    const famillesResume = ENGINEERING_FAMILIES.map((item) => ({
        label: item.label,
        slug: item.slug,
        details: item.types.slice(0, 3),
    }));

    return (
        <div className="bg-slate-50 py-12 premium-page">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <section className="text-center premium-hero p-8 sm:p-12">
                    <p className="uppercase tracking-[0.2em] text-xs text-slate-500">Solutions metier</p>
                    <h1 className="mt-3 text-3xl sm:text-5xl font-black text-[#172243] premium-title">Prestations associees au catalogue produits</h1>
                    <p className="mt-4 text-slate-600 max-w-4xl mx-auto leading-relaxed premium-subtitle">
                        Les pages Solutions et Ingenierie sont des pages de prestations. Elles cadrent les familles
                        de produits, les types et les modeles a deployer selon vos contraintes metier.
                    </p>
                </section>

                <section className="mt-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                    {ENGINEERING_DELIVERY_STEPS.map((step) => (
                        <article key={step} className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 premium-card">
                            {step}
                        </article>
                    ))}
                </section>

                <section className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {solutions.map((item) => (
                        <article key={item.title} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm premium-card">
                            <img src={item.image} alt={item.title} className="w-full h-52 object-cover" />
                            <div className="p-5">
                                <h2 className="text-lg font-semibold text-[#172243]">{item.title}</h2>
                                <p className="mt-3 text-slate-600 leading-relaxed">{item.description}</p>
                                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                                    {item.points.map((point) => (
                                        <li key={point} className="flex gap-2">
                                              <span className="text-amber-500">-</span>
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    type="button"
                                    className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#172243] text-white text-sm font-medium hover:opacity-95"
                                    onClick={() => navigate(item.link)}
                                >
                                    Voir les produits relies
                                </button>
                            </div>
                        </article>
                    ))}
                </section>

                <section className="mt-10 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
                    <h2 className="text-xl font-semibold text-[#172243]">Familles couvertes par nos prestations</h2>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {famillesResume.map((famille) => (
                            <article key={famille.slug} className="rounded-xl border border-slate-200 bg-slate-50 p-4 premium-card">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="font-semibold text-[#172243]">{famille.label}</h3>
                                    <button
                                        type="button"
                                        className="text-xs font-semibold text-[#172243]"
                                        onClick={() => navigate(`/produits?categories=${famille.slug}`)}
                                    >
                                        Voir
                                    </button>
                                </div>
                                <ul className="mt-3 space-y-1 text-sm text-slate-600">
                                    {famille.details.map((item) => (
                                        <li key={`${famille.slug}-${item}`}>{item}</li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="mt-10 text-center flex flex-wrap gap-3 justify-center">
                    <button
                        type="button"
                        onClick={() => navigate("/contact")}
                        className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#172243] text-white font-medium hover:opacity-95"
                    >
                        Demander une demonstration
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/inscription")}
                        className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-amber-400 text-[#172243] font-semibold hover:bg-amber-300"
                    >
                        Demander un accompagnement
                    </button>
                </section>
            </div>
        </div>
    );
}