import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "../axios";
import usePageMeta from "../hooks/usePageMeta";
import { notifyMutation } from "../utils/mutationBus";
import { toastError, toastSuccess } from "../utils/toast";
import "../../css/devenirvendeur.css";

export default function DevenirVendeur() {
  usePageMeta(
    "Devenir revendeur | Groupe ISD AFRIK",
    "Soumettez votre demande d'agrement pour devenir revendeur des produits et solutions du Groupe ISD AFRIK."
  );

  const [form, setForm] = useState({
    nom_entreprise: "",
    statut_juridique: "",
    rccm: "",
    identifiant_fiscal: "",
    annee_creation: "",
    adresse_siege: "",
    pays: "",
    ville: "",
    telephone: "",
    email_professionnel: "",
    site_web: "",
    representant_nom: "",
    representant_fonction: "",
    representant_telephone: "",
    representant_email: "",
    zone_couverture: "",
    experience_annees: "",
    marques_distribuees: "",
    motivation: "",
    equipe_commerciale: false,
    equipe_technique: false,
    showroom: false,
    service_installation_maintenance: false,
    activites: [],
    documents: []
  });
  const [submitting, setSubmitting] = useState(false);

  const toggleArrayValue = (name, value) => {
    setForm((prev) => {
      const has = prev[name].includes(value);
      return {
        ...prev,
        [name]: has ? prev[name].filter((v) => v !== value) : [...prev[name], value]
      };
    });
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await axios.post("/revendeur-demandes", form);
      notifyMutation();
      toastSuccess(res.data?.message || "Demande envoyee avec succes.");
      setForm({
        nom_entreprise: "", statut_juridique: "", rccm: "", identifiant_fiscal: "", annee_creation: "",
        adresse_siege: "", pays: "", ville: "", telephone: "", email_professionnel: "", site_web: "",
        representant_nom: "", representant_fonction: "", representant_telephone: "", representant_email: "",
        zone_couverture: "", experience_annees: "", marques_distribuees: "", motivation: "",
        equipe_commerciale: false, equipe_technique: false, showroom: false, service_installation_maintenance: false,
        activites: [], documents: []
      });
    } catch (err) {
      toastError(err.response?.data?.message || "Erreur lors de l'envoi de la demande.");
    } finally {
      setSubmitting(false);
    }
  };
  const avantages = [
    "Acces au reseau regional ISD AFRIK en Afrique de l'Ouest",
    "Accompagnement commercial et support technique dedies",
    "Programme revendeur structure et transparent",
    "Opportunites de croissance B2B/B2C sur des solutions a forte demande"
  ];

  const etapes = [
    "Remplir la fiche de demande d'agrement",
    "Fournir les documents administratifs demandes",
    "Validation du dossier par l'equipe partenariats",
    "Lancement du partenariat et accompagnement de demarrage"
  ];

  return (
    <div className="vendor-page">
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div className="vendor-hero">
          <h1>Devenir revendeur ISD AFRIK</h1>
          <p>
            Rejoignez notre réseau de partenaires et bénéficiez des avantages exclusifs du Groupe ISD AFRIK 
            en Afrique de l'Ouest. Soumettez votre demande d'agrément dès maintenant.
          </p>
        </div>

        <div className="vendor-form-container">
          <form onSubmit={onSubmit}>
            {/* INFORMATIONS ENTREPRISE */}
            <div className="vendor-form-section">
              <h3 className="vendor-section-title">Informations de l'entreprise</h3>
              <div className="vendor-form-grid">
                <div className="form-group">
                  <label>Nom de l'entreprise *</label>
                  <input 
                    type="text"
                    name="nom_entreprise" 
                    placeholder="Ex: Tech Solutions SARL"
                    value={form.nom_entreprise} 
                    onChange={onChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Statut juridique</label>
                  <input 
                    type="text"
                    name="statut_juridique" 
                    placeholder="SARL, EIRL, SA..."
                    value={form.statut_juridique} 
                    onChange={onChange} 
                  />
                </div>
                <div className="form-group">
                  <label>RCCM / Registre de commerce</label>
                  <input 
                    type="text"
                    name="rccm" 
                    placeholder="Numéro RCCM"
                    value={form.rccm} 
                    onChange={onChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Identifiant fiscal</label>
                  <input 
                    type="text"
                    name="identifiant_fiscal" 
                    placeholder="Numéro fiscal"
                    value={form.identifiant_fiscal} 
                    onChange={onChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Année de création</label>
                  <input 
                    type="text"
                    name="annee_creation" 
                    placeholder="2020"
                    value={form.annee_creation} 
                    onChange={onChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Téléphone *</label>
                  <input 
                    type="tel"
                    name="telephone" 
                    placeholder="+229..."
                    value={form.telephone} 
                    onChange={onChange} 
                    required 
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Adresse du siège</label>
                  <input 
                    type="text"
                    name="adresse_siege" 
                    placeholder="Rue, Ville"
                    value={form.adresse_siege} 
                    onChange={onChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Pays *</label>
                  <input 
                    type="text"
                    name="pays" 
                    placeholder="Bénin, Togo, Niger..."
                    value={form.pays} 
                    onChange={onChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Ville</label>
                  <input 
                    type="text"
                    name="ville" 
                    placeholder="Cotonou, Lomé..."
                    value={form.ville} 
                    onChange={onChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Email professionnel *</label>
                  <input 
                    type="email"
                    name="email_professionnel" 
                    placeholder="contact@entreprise.com"
                    value={form.email_professionnel} 
                    onChange={onChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Site web</label>
                  <input 
                    type="url"
                    name="site_web" 
                    placeholder="https://..."
                    value={form.site_web} 
                    onChange={onChange} 
                  />
                </div>
              </div>
            </div>

            {/* INFORMATIONS REPRÉSENTANT */}
            <div className="vendor-form-section">
              <h3 className="vendor-section-title">Informations du représentant</h3>
              <div className="vendor-form-grid">
                <div className="form-group">
                  <label>Nom du représentant *</label>
                  <input 
                    type="text"
                    name="representant_nom" 
                    placeholder="Prénom Nom"
                    value={form.representant_nom} 
                    onChange={onChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Fonction</label>
                  <input 
                    type="text"
                    name="representant_fonction" 
                    placeholder="Directeur, Gérant..."
                    value={form.representant_fonction} 
                    onChange={onChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Téléphone du représentant</label>
                  <input 
                    type="tel"
                    name="representant_telephone" 
                    placeholder="+229..."
                    value={form.representant_telephone} 
                    onChange={onChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Email du représentant</label>
                  <input 
                    type="email"
                    name="representant_email" 
                    placeholder="representant@entreprise.com"
                    value={form.representant_email} 
                    onChange={onChange} 
                  />
                </div>
              </div>
            </div>

            {/* DÉTAILS COMMERCIAUX */}
            <div className="vendor-form-section">
              <h3 className="vendor-section-title">Détails commerciaux</h3>
              <div className="vendor-form-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Zone de couverture commerciale</label>
                  <textarea 
                    placeholder="Villes, régions, pays..."
                    name="zone_couverture" 
                    value={form.zone_couverture} 
                    onChange={onChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Expérience dans la distribution</label>
                  <select 
                    name="experience_annees" 
                    value={form.experience_annees} 
                    onChange={onChange}
                  >
                    <option value="">Sélectionner...</option>
                    <option value="moins_2">Moins de 2 ans</option>
                    <option value="2_5">2 à 5 ans</option>
                    <option value="5_10">5 à 10 ans</option>
                    <option value="plus_10">Plus de 10 ans</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Principales marques distribuées</label>
                  <input 
                    type="text"
                    name="marques_distribuees" 
                    placeholder="Marques principales"
                    value={form.marques_distribuees} 
                    onChange={onChange} 
                  />
                </div>
              </div>
            </div>

            {/* ACTIVITÉS PRINCIPALES */}
            <div className="vendor-form-section checkbox-group">
              <label>Activités principales</label>
              <div className="checkbox-items">
                {["Vente de matériel informatique", "Sécurité électronique / vidéosurveillance", "Intégration de solutions technologiques", "Télécommunications", "Distribution de produits technologiques"].map((act) => (
                  <label key={act} className="checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={form.activites.includes(act)} 
                      onChange={() => toggleArrayValue("activites", act)} 
                    />
                    <span>{act}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* CAPACITÉS */}
            <div className="vendor-form-section checkbox-group">
              <label>Capacités disponibles</label>
              <div className="checkbox-items">
                {[
                  { name: "equipe_commerciale", label: "Équipe commerciale" },
                  { name: "equipe_technique", label: "Équipe technique" },
                  { name: "showroom", label: "Showroom / point de vente" },
                  { name: "service_installation_maintenance", label: "Service installation/maintenance" }
                ].map((cap) => (
                  <label key={cap.name} className="checkbox-item">
                    <input 
                      type="checkbox" 
                      name={cap.name} 
                      checked={form[cap.name]} 
                      onChange={onChange} 
                    />
                    <span>{cap.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* DOCUMENTS */}
            <div className="vendor-form-section checkbox-group">
              <label>Documents disponibles</label>
              <div className="checkbox-items">
                {["Registre de commerce / RCCM", "Attestation fiscale", "Présentation de l'entreprise", "Références clients"].map((doc) => (
                  <label key={doc} className="checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={form.documents.includes(doc)} 
                      onChange={() => toggleArrayValue("documents", doc)} 
                    />
                    <span>{doc}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* MOTIVATION */}
            <div className="vendor-form-section">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Motivation pour devenir revendeur ISD AFRIK *</label>
                <textarea 
                  placeholder="Décrivez vos motivation et vos objectifs..."
                  name="motivation" 
                  value={form.motivation} 
                  onChange={onChange} 
                  required 
                  style={{ minHeight: '120px' }}
                />
              </div>
            </div>

            {/* SUBMIT */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
              <button 
                type="submit" 
                className="vendor-submit-btn"
                disabled={submitting}
              >
                {submitting ? "Envoi en cours..." : "Envoyer la demande"}
              </button>
              <Link to="/contact" style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#f8fafc',
                color: '#334155',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}>
                Besoin d'aide?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
