import React from "react";
import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import { ENGINEERING_DELIVERY_STEPS, ENGINEERING_FAMILIES } from "../data/engineeringCatalog";
import "../../css/ingenierie.css";

export default function Ingenierie() {
    usePageMeta(
        "Ingenierie informatique et industrielle | Groupe ISD AFRIK",
        "Architecture SI, integration systemes et automatisation pour renforcer la performance et la securite des entreprises."
    );

    const piliers = [
        {
            title: "Cadrage de la prestation",
            text: "Analyse metier et technique pour identifier les familles de produits, les types et les modeles adaptes.",
            image: "/images/solutions/im3.webp"
        },
        {
            title: "Integration et deploiement",
            text: "Mise en oeuvre sur site des equipements Ingenierie: drone, TPE, reseau, incendie, energie, telecoms et plus.",
            image: "/images/solutions/im2.webp"
        },
        {
            title: "Support et evolution",
            text: "Suivi operationnel, maintenance et renouvellement par gamme, type et modele pour maintenir la performance.",
            image: "/images/solutions/im1.webp"
        }
    ];

    const livrables = [
        "Matrice familles / types / modeles",
        "Plan de deploiement et gestion des risques",
        "Documentation d'exploitation par equipement",
        "Rapport de tests et mise en conformite",
        "Formation et transfert de competence"
    ];

    return (
        <div className="bg-slate-50 min-h-screen py-10 sm:py-14 ingenierie-page">
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="rounded-3xl bg-gradient-to-br from-[#172243] via-[#1d4a73] to-[#0f766e] text-white p-8 sm:p-12 shadow-xl ingenierie-hero">
                    <p className="uppercase tracking-[0.2em] text-xs text-sky-200">Prestation Ingenierie</p>
                    <h1 className="mt-3 text-3xl sm:text-5xl font-black max-w-4xl leading-tight">Ingenierie informatique et industrielle</h1>
                    <p className="mt-4 max-w-4xl text-slate-100 leading-relaxed">
                        Cette page est une page de prestations liee au catalogue produits. La categorie Ingenierie
                        regroupe Drone, TPE, Archivage numerique, Materiel informatique, Reseau, Incendie,
                        Energie, Telecommunications et Securite informatique / Base de donnees.
                    </p>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                        {ENGINEERING_DELIVERY_STEPS.map((step) => (
                            <div key={step} className="rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-semibold">
                                {step}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                    <h2 className="text-2xl font-black text-[#172243]">Nos piliers d'expertise</h2>
                    <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5">
                        {piliers.map((item) => (
                            <article key={item.title} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                                <img src={item.image} alt={item.title} className="h-48 w-full object-cover" />
                                <div className="p-5">
                                    <h3 className="text-lg font-bold text-[#172243]">{item.title}</h3>
                                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.text}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                    <h2 className="text-2xl font-black text-[#172243]">Ce que vous obtenez</h2>
                    <ul className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {livrables.map((item) => (
                            <li key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 font-medium">{item}</li>
                        ))}
                    </ul>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                    <h2 className="text-2xl font-black text-[#172243]">Familles, types et modeles couverts</h2>
                    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {ENGINEERING_FAMILIES.map((item) => (
                            <article key={item.slug} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <h3 className="font-bold text-[#172243] leading-snug">{item.label}</h3>
                                    <Link
                                        to={`/produits?categories=${item.slug}`}
                                        className="text-xs font-semibold text-[#172243]"
                                    >
                                        Produits
                                    </Link>
                                </div>
                                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.description}</p>
                                <ul className="mt-3 space-y-1 text-sm text-slate-700">
                                    {item.types.map((type) => (
                                        <li key={`${item.slug}-${type}`}>{type}</li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
                        <div className="text-3xl font-black text-[#172243]">15+</div>
                        <p className="mt-1 text-sm text-slate-600">Annees d'experience</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
                        <div className="text-3xl font-black text-[#172243]">500+</div>
                        <p className="mt-1 text-sm text-slate-600">Projets reussis</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
                        <div className="text-3xl font-black text-[#172243]">1000+</div>
                        <p className="mt-1 text-sm text-slate-600">Clients satisfaits</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
                        <div className="text-3xl font-black text-[#172243]">99.8%</div>
                        <p className="mt-1 text-sm text-slate-600">Taux de succes</p>
                    </div>
                </section>

                <section className="rounded-2xl bg-[#172243] text-white p-7 sm:p-9">
                    <h2 className="text-2xl font-black">Pret a lancer votre projet ?</h2>
                    <p className="mt-3 text-slate-100 max-w-3xl">
                        Contactez nos experts pour calibrer la bonne combinaison famille, type et modele selon votre organisation.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                        <Link
                            to="/contact"
                            className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-[#172243] font-semibold"
                        >
                            Lancer un projet
                        </Link>
                        <Link
                            to="/produits"
                            className="inline-flex items-center justify-center rounded-xl border border-white/60 px-5 py-3 text-white font-semibold"
                        >
                            Voir le catalogue Ingenierie
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}