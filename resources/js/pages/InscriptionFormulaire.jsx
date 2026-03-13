import React, { useEffect } from "react";

const EXTERNAL_URL = "https://inscriptionisd.wixsite.com/monsite-1?from=isd_afrik&intent=formulaire_inscription";

export default function InscriptionFormulaire() {
  useEffect(() => {
    window.location.href = EXTERNAL_URL;
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-[#172243]">Redirection vers le formulaire d'inscription</h1>
      <p className="mt-4 text-slate-600 leading-relaxed">
        Vous etes redirige vers la page d'inscription externe. Si le formulaire ne s'affiche pas directement,
        utilisez le bouton ci-dessous.
      </p>
      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <a
          href={EXTERNAL_URL}
          target="_self"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#172243] text-white font-semibold hover:opacity-95"
        >
          Ouvrir le formulaire
        </a>
        <a
          href="/contact"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-slate-100 text-slate-800 font-semibold hover:bg-slate-200"
        >
          Besoin d'aide ? Contact
        </a>
      </div>
    </div>
  );
}
