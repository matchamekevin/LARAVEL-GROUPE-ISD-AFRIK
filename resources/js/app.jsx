import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

const Home = lazy(() => import("./pages/Home"));
const Register = lazy(() => import("./pages/Register"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Solutions = lazy(() => import("./pages/Solutions"));
const Formations = lazy(() => import("./pages/Formations"));
const Projets = lazy(() => import("./pages/Projets"));
const Actualites = lazy(() => import("./pages/Actualites"));
const Contact = lazy(() => import("./pages/Contact"));
const Ingenierie = lazy(() => import("./pages/ingenierie"));
const DetailDomaine = lazy(() => import("./pages/DetailDomaine"));
const InscriptionFormulaire = lazy(() => import("./pages/InscriptionFormulaire"));
const DevenirVendeur = lazy(() => import("./pages/DevenirVendeur"));

const Apropos = lazy(() => import("./pages/Apropos"));
const Profile = lazy(() => import("./pages/Profile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const OtpVerification = lazy(() => import("./pages/OtpVerification"));
const Expertise = lazy(() => import("./pages/Expertise"));
const Presence = lazy(() => import("./pages/Presence"));
const Fiabilite = lazy(() => import("./pages/Fiablite"));
const Accompagnement = lazy(() => import("./pages/Accompagnement"));
const Innovation = lazy(() => import("./pages/Innovation"));
const Services = lazy(() => import("./pages/Services"));
const Etudiant = lazy(() => import('./pages/Etudiant'));
const Particulier = lazy(() => import('./pages/Particulier'));
const Entreprise = lazy(() => import('./pages/Entreprise'));
const FormationRegister = lazy(() => import("./pages/FormationRegister"));
const FormationDetails = lazy(() => import("./pages/FormationDetails"));
const MesFormations = lazy(() => import("./pages/MesFormations"));
const MesProduits = lazy(() => import("./pages/MesProduits"));

const Produit = lazy(() => import("./pages/Produit"));
const ProduitDetail = lazy(() => import("./pages/ProduitDetail"));
const ProduitRecherche = lazy(() => import("./pages/ProduitRecherche"));
const Promotions = lazy(() => import("./pages/Promotions"));

const MesCommandes = lazy(() => import("./pages/MesCommandes"));
const ComptabiliteImmobilisations = lazy(() => import("./pages/ComptabiliteImmobilisations"));
const GestionCommercialeStock = lazy(() => import("./pages/GestionCommercialeStock"));
const MicrosoftAvance = lazy(() => import("./pages/MicrosoftAvance"));
const VideoSurveillance = lazy(() => import("./pages/VideoSurveillance"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const FacturePage = lazy(() => import("./pages/FacturePage"));
const Developpement = lazy(() => import("./pages/DeveloppementApplications"));
const Communication = lazy(() => import("./pages/communication"));
const Tpe = lazy(() => import("./pages/Tpe"));
const Drones = lazy(() => import("./pages/Drones"));
const Btp = lazy(() => import("./pages/Btp"));

const MentionsLegales = lazy(() => import("./pages/MentionsLegales"));
const Confidentialite = lazy(() => import("./pages/Confidentialite"));
const Cgv = lazy(() => import("./pages/Cgv"));
const Geovision = lazy(() => import("./pages/Geovision"));
const GeovisionCatalogue = lazy(() => import("./pages/GeovisionCatalogue"));
const GeovisionCategorie = lazy(() => import("./pages/GeovisionCategorie"));
const GeovisionProduitDetail = lazy(() => import("./pages/GeovisionProduitDetail"));

import ScrollToTop from "./components/ScrollToTop";

import "../css/app.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./i18n";
import "./styles/marketing-premium.css";

function App() {
    return (
        <BrowserRouter>
            <MainLayout>
                  {/* Ce composant force le scroll en haut à chaque navigation */}
                  <ScrollToTop />
                <Suspense fallback={<div style={{ padding: "20px", textAlign: "center" }}>Chargement...</div>}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/client/dashboard" element={<Dashboard />} />
                    <Route path="/solutions" element={<Solutions />} />
                    <Route path="/formations" element={<Formations />} />
                    <Route path="/projets" element={<Projets />} />
                    <Route path="/actualites" element={<Actualites />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/details/:type/:slug" element={<DetailDomaine />} />
                    <Route path="/inscription" element={<InscriptionFormulaire />} />
                    <Route path="/devenir-vendeur" element={<DevenirVendeur />} />
                    <Route path="/verify-otp" element={<OtpVerification />} />
                    <Route path="/expertise" element={<Expertise />} /> 
                    <Route path="/ingenierie" element={<Ingenierie />} />
                    <Route path="/apropos" element={<Apropos />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/profile/edit" element={<EditProfile />} />
                    <Route path="/profile/password" element={<ChangePassword />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/presence" element={<Presence />} />
                    <Route path="/fiabilite" element={<Fiabilite />} />
                    <Route path="/accompagnement" element={<Accompagnement />} />
                    <Route path="/innovation" element={<Innovation />} />
                    <Route path="/services" element={<Services />} />

                    

                    {/* ✅ ROUTES SPÉCIFIQUES DE SERVICES (en premier) */}

                    <Route path="/services/developpement" element={<Developpement />} />
                    <Route path="/services/communication" element={<Communication />} />
                    <Route path="/services/tpe" element={<Tpe />} />
                    <Route path="/services/drones" element={<Drones />} />
                    <Route path="/services/btp" element={<Btp />} />

                    {/* Geovision */}
                    <Route path="/geovision" element={<Geovision />} />
                    <Route path="/geovision/catalogue/:typeId" element={<GeovisionCatalogue />} />
                    <Route path="/geovision/categorie/:id" element={<GeovisionCategorie />} />
                    <Route path="/geovision/produit/:id" element={<GeovisionProduitDetail />} />

                     {/* Pages légales */}
                    <Route path="/mentions-legales" element={<MentionsLegales />} />
                    <Route path="/politique-confidentialite" element={<Confidentialite />} />
                    <Route path="/cgv" element={<Cgv />} />

                    {/* ✅ ROUTES SPÉCIFIQUES DE FORMATIONS (en premier) */}
                    <Route path="/formations/etudiant" element={<Etudiant />} />
                    <Route path="/formations/particulier" element={<Particulier />} />
                    <Route path="/formations/entreprise" element={<Entreprise />} />
                    <Route path="/formations/comptabilite-immobilisations" element={<ComptabiliteImmobilisations />} />
                    <Route path="/formations/gestion-commerciale-stock" element={<GestionCommercialeStock />} />
                    <Route path="/formations/microsoft-avance" element={<MicrosoftAvance />} /> 
                    <Route path="/formations/video-surveillance" element={<VideoSurveillance />} />
                    
                    {/* ✅ ROUTES DYNAMIQUES (en dernier) */}
                    <Route path="/formations/:id/details" element={<FormationDetails />} />
                    <Route path="/formations/:id/register" element={<FormationRegister />} />
                    
                    {/* Routes profil */}
                    <Route path="/profile/formations" element={<MesFormations />} />
                    <Route path="/profile/produits" element={<MesProduits />} />
                    <Route path="/profile/commandes" element={<MesCommandes />} />

                     {/* Page de paiement */}
                   <Route path="/paiement/:id" element={<PaymentPage />} />

                         {/* Route pour facture */}
                         <Route path="/facture/:id" element={<FacturePage />} />

                          {/* Route pour inscription */}
                         <Route path="/formations/:id/register" element={<FormationRegister />} />

                                {/* Route pour paiement */}
                        <Route path="/formations/:id/paiement" element={<PaymentPage />} />

                                {/* Autres routes */}
                       <Route path="/facture/:id" element={<FacturePage />} />


                    {/* Routes produits */}
                    <Route path="/produits" element={<Produit />} />
                     <Route path="/produits/:id" element={<ProduitDetail />} />
                        <Route path="/produits/recherche" element={<ProduitRecherche />} />

                    {/* Route promotions */}
                    <Route path="/promotions" element={<Promotions />} />


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
                ReactDOM.createRoot(el).render(<App />);
            },
            { once: true }
        );
        return;
    }

    ReactDOM.createRoot(container).render(<App />);
}

mountApp();