import React, { lazy, Suspense } from "react";
import axios from "axios";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import AutoRefreshProvider from "./providers/AutoRefreshProvider";
import ScrollToTop from "./components/ScrollToTop";

import "../css/app.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./i18n";
import "./styles/global.css";
import "./styles/marketing-premium.css";
import "./styles/auth.css";

// Compat: certaines dépendances attendent un global `process.env`.
// Vite expose les variables via `import.meta.env`; on crée un shim
// minimal pour éviter `ReferenceError: process is not defined` en dev.
if (typeof window !== 'undefined' && typeof window.process === 'undefined') {
    // eslint-disable-next-line no-undef
    window.process = { env: import.meta.env };
}

// Toujours envoyer les cookies avec axios (Sanctum, sessions)
axios.defaults.withCredentials = true;

// Dynamic page loader using Vite's import.meta.glob
const pagesMap = import.meta.glob('./pages/**/*.jsx');

// Aliases pour gérer les différences de nommage fichier/composant
const PAGE_ALIASES = {
    Communication: 'communication',
    Ingenierie: 'ingenierie',
    Fiabilite: 'Fiablite',
    Developpement: 'DeveloppementApplications',
};

const lazyComponentCache = {};

function getLazyComponent(name) {
    const resolvedName = PAGE_ALIASES[name] || name;
    if (lazyComponentCache[resolvedName]) {
        return lazyComponentCache[resolvedName];
    }

    const loader =
        pagesMap[`./pages/${resolvedName}.jsx`] ||
        pagesMap[`./pages/${resolvedName}/index.jsx`];

    if (!loader) {
        return null;
    }

    const Component = lazy(loader);
    lazyComponentCache[resolvedName] = Component;
    return Component;
}

function LazyPage({ name }) {
    const Component = getLazyComponent(name);
    if (!Component) {
        return <div style={{ padding: 20 }}>Page introuvable: {name}</div>;
    }
    return (
        <Component />
    );
}

function App() {
    return (
        <BrowserRouter>
            <MainLayout>
                {/* Gestion unifiée du scroll: top sur navigation normale, restauration sur back/forward */}
                  <ScrollToTop />
                <Suspense fallback={<div style={{ padding: "20px", textAlign: "center" }}>Chargement...</div>}>
                <Routes>
                                    <Route path="/" element={<LazyPage name="Home" />} />
                                    <Route path="/register" element={<LazyPage name="Register" />} />
                                    <Route path="/login" element={<LazyPage name="Login" />} />
                                    <Route path="/client/dashboard" element={<LazyPage name="Dashboard" />} />
                                    <Route path="/solutions" element={<LazyPage name="Solutions" />} />
                                    <Route path="/formations" element={<LazyPage name="Formations" />} />
                                    <Route path="/projets" element={<LazyPage name="Projets" />} />
                                    <Route path="/actualites" element={<LazyPage name="Actualites" />} />
                                    <Route path="/contact" element={<LazyPage name="Contact" />} />
                                    <Route path="/details/:type/:slug" element={<LazyPage name="DetailDomaine" />} />
                                    <Route path="/inscription" element={<LazyPage name="InscriptionFormulaire" />} />
                                    <Route path="/devenir-vendeur" element={<LazyPage name="DevenirVendeur" />} />
                                    <Route path="/verify-otp" element={<LazyPage name="OtpVerification" />} />
                                    <Route path="/expertise" element={<LazyPage name="Expertise" />} />
                                    <Route path="/ingenierie" element={<LazyPage name="Ingenierie" />} />
                                    <Route path="/apropos" element={<LazyPage name="Apropos" />} />
                                    <Route path="/profile" element={<LazyPage name="Profile" />} />
                                    <Route path="/profile/edit" element={<LazyPage name="EditProfile" />} />
                                    <Route path="/profile/password" element={<LazyPage name="ChangePassword" />} />
                                    <Route path="/forgot-password" element={<LazyPage name="ForgotPassword" />} />
                                    <Route path="/reset-password" element={<LazyPage name="ResetPassword" />} />
                                    <Route path="/reset-password/:token" element={<LazyPage name="ResetPassword" />} />
                                    <Route path="/presence" element={<LazyPage name="Presence" />} />
                                    <Route path="/fiabilite" element={<LazyPage name="Fiabilite" />} />
                                    <Route path="/accompagnement" element={<LazyPage name="Accompagnement" />} />
                                    <Route path="/innovation" element={<LazyPage name="Innovation" />} />
                                    <Route path="/services" element={<LazyPage name="Services" />} />

                                    {/* Services spécifiques */}
                                    <Route path="/services/developpement" element={<LazyPage name="Developpement" />} />
                                    <Route path="/services/communication" element={<LazyPage name="Communication" />} />
                                    <Route path="/services/tpe" element={<LazyPage name="Tpe" />} />
                                    <Route path="/services/drones" element={<LazyPage name="Drones" />} />
                                    <Route path="/services/btp" element={<LazyPage name="Btp" />} />

                                    {/* Geovision */}
                                    <Route path="/geovision" element={<LazyPage name="Geovision" />} />
                                    <Route path="/geovision/catalogue/:typeId" element={<LazyPage name="GeovisionCatalogue" />} />
                                    <Route path="/geovision/categorie/:slug" element={<LazyPage name="GeovisionCategorie" />} />
                                    <Route path="/geovision/produit/:slug" element={<LazyPage name="GeovisionProduitDetail" />} />

                                    {/* Pages légales */}
                                    <Route path="/mentions-legales" element={<LazyPage name="MentionsLegales" />} />
                                    <Route path="/politique-confidentialite" element={<LazyPage name="Confidentialite" />} />
                                    <Route path="/cgv" element={<LazyPage name="Cgv" />} />

                                    {/* Formations spécifiques */}
                                    <Route path="/formations/etudiant" element={<LazyPage name="Etudiant" />} />
                                    <Route path="/formations/particulier" element={<LazyPage name="Particulier" />} />
                                    <Route path="/formations/entreprise" element={<LazyPage name="Entreprise" />} />
                                    <Route path="/formations/comptabilite-immobilisations" element={<LazyPage name="ComptabiliteImmobilisations" />} />
                                    <Route path="/formations/gestion-commerciale-stock" element={<LazyPage name="GestionCommercialeStock" />} />
                                    <Route path="/formations/microsoft-avance" element={<LazyPage name="MicrosoftAvance" />} />
                                    <Route path="/formations/video-surveillance" element={<LazyPage name="VideoSurveillance" />} />

                                    {/* Routes dynamiques */}
                                    <Route path="/formations/:id/details" element={<LazyPage name="FormationDetails" />} />
                                    <Route path="/formations/:id/register" element={<LazyPage name="FormationRegister" />} />

                                    {/* Routes profil */}
                                    <Route path="/profile/formations" element={<LazyPage name="MesFormations" />} />
                                    <Route path="/profile/produits" element={<LazyPage name="MesProduits" />} />
                                    <Route path="/profile/commandes" element={<LazyPage name="MesCommandes" />} />

                                    {/* Paiement & facture */}
                                    <Route path="/paiement/:id" element={<LazyPage name="PaymentPage" />} />
                                    <Route path="/facture/:id" element={<LazyPage name="FacturePage" />} />
                                    <Route path="/formations/:id/paiement" element={<LazyPage name="PaymentPage" />} />

                                    {/* Produits */}
                                    <Route path="/produits" element={<LazyPage name="Produit" />} />
                                    <Route path="/produits/:id" element={<LazyPage name="ProduitDetail" />} />
                                    <Route path="/produits/recherche" element={<LazyPage name="ProduitRecherche" />} />
                                    <Route path="/favoris" element={<LazyPage name="Favoris" />} />
                                    <Route path="/panier" element={<LazyPage name="Panier" />} />

                                    {/* Promotions */}
                                    <Route path="/promotions" element={<LazyPage name="Promotions" />} />



                </Routes>
                </Suspense>
            </MainLayout>
        </BrowserRouter>
    );
}

// Montage défensif : vérifie que l'élément cible existe, sinon attend le DOMContentLoaded
function mountApp() {
    const container = document.getElementById("react-root");
    if (!container) {
        console.error("React root element '#react-root' not found. Waiting for DOMContentLoaded...");
        document.addEventListener(
            "DOMContentLoaded",
            () => {
                const el = document.getElementById("react-root");
                if (!el) {
                    console.error("React root element '#react-root' still not found after DOMContentLoaded.");
                    return;
                }
                ReactDOM.createRoot(el).render(
                    <AutoRefreshProvider>
                        <App />
                    </AutoRefreshProvider>
                );
            },
            { once: true }
        );
        return;
    }

    ReactDOM.createRoot(container).render(
        <AutoRefreshProvider>
            <App />
        </AutoRefreshProvider>
    );
}

mountApp();
