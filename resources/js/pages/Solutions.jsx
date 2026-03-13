import React from "react";
import { useNavigate } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";


export default function Solutions() {
    usePageMeta(
        "Solutions / Produits | Groupe ISD AFRIK",
        "Solutions de gestion d'entreprise, securite electronique et outils numeriques pour la transformation digitale en Afrique."
    );
    const navigate = useNavigate();

    const solutions = [
        {
            title: "Solutions de gestion d'entreprise",
            description: "ERP, CRM, achat, vente, stock et finance dans une plateforme unique et evolutive.",
            image: "/images/solutions/im1.jpg",
            points: ["Suivi des operations", "Tableaux de bord temps reel", "Workflows de validation"]
        },
        {
            title: "Solutions de securite electronique",
            description: "Videosurveillance IP, controle d'acces et protection des infrastructures.",
            image: "/images/solutions/im2.jpg",
            points: ["Protection des sites", "Supervision intelligente", "Securite operationnelle"]
        },
        {
            title: "Solutions numeriques et digitales",
            description: "Applications et outils numeriques pour accelerer la transformation digitale.",
            image: "/images/solutions/im3.jpg",
            points: ["Applications metiers", "Plateformes digitales", "Integration technologique"]
        }
    ];

    return (
        <div className="bg-slate-50 py-12 premium-page">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <section className="text-center">
                    <h1 className="text-3xl sm:text-4xl font-bold text-[#172243]">Solutions / Produits</h1>
                    <p className="mt-4 text-slate-600 max-w-3xl mx-auto leading-relaxed">
                        Le Groupe ISD AFRIK selectionne et propose des technologies fiables et innovantes
                        pour repondre aux besoins des entreprises africaines.
                    </p>
                </section>

                <section className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {solutions.map((item) => (
                        <article key={item.title} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
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
                            </div>
                        </article>
                    ))}
                </section>

                <section className="mt-10 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
                    <h2 className="text-xl font-semibold text-[#172243]">Notre approche de deploiement</h2>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700">
                        <p>1. Analyse des besoins et cadrage de la solution.</p>
                        <p>2. Conception, parametrage et integration.</p>
                        <p>3. Deploiement controle et verification qualite.</p>
                        <p>4. Formation des equipes, support et maintenance.</p>
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
                        Souscrire
                    </button>
                </section>
            </div>
        </div>
    );
}