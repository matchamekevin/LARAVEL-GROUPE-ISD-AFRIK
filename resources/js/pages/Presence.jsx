import React from "react";
import { useNavigate } from "react-router-dom";

export default function Presence() {
  const navigate = useNavigate();

  const engagements = [
    "Intervention rapide grâce à une présence de proximité",
    "Suivi opérationnel continu avant, pendant et après déploiement",
    "Équipes techniques et métier coordonnées autour de vos objectifs",
    "Accompagnement local pour faciliter l'adoption des solutions",
  ];

  const zones = [
    { title: "Centres urbains", description: "Support de proximité pour les structures publiques et privées." },
    { title: "Sites industriels", description: "Interventions planifiées et assistance technique sur site." },
    { title: "Zones en expansion", description: "Déploiement progressif avec montée en charge maîtrisée." },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <section className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#172243]">Présence régionale et réactivité</h1>
        <p className="mt-4 text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Notre maillage régional nous permet d'apporter un accompagnement de terrain,
          avec des délais d'intervention réduits et une meilleure connaissance des réalités locales.
        </p>
      </section>

      <section className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {zones.map((zone, index) => (
          <article key={index} className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[#172243]">{zone.title}</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">{zone.description}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 bg-gray-50 border border-gray-200 rounded-xl p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-[#172243]">Nos engagements sur le terrain</h2>
        <ul className="mt-4 space-y-3 text-gray-700">
          {engagements.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-[#172243]"></span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 text-center">
        <button
          type="button"
          onClick={() => navigate("/contact")}
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#172243] text-white font-medium hover:opacity-95"
        >
          Contacter l'équipe locale
        </button>
      </section>
    </div>
  );
}