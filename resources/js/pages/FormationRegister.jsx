import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Loader from "../components/Loader";
import "../styles/FormationRegister.css";
import { getApiBase } from "../utils/apiBase";
import { toastError, toastSuccess, toastWarning } from "../utils/toast";

const FormationRegister = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formation, setFormation] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    responsable_nom: "",
    responsable_prenom: "",
    civilite: "",
    fonction: "",
    email: "",
    telephone: "",
    societe: "",
    adresse_societe: "",
    participants: [{ nom: "", prenom: "", fonction: "", contact: "", prix: "" }],
    facturation: "participant",
  });

  // Charger la formation
  useEffect(() => {
    const token = localStorage.getItem("token");
    const backendBase = getApiBase();
    axios
      .get(`${backendBase}/api/formations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setFormation(res.data))
      .catch(() => {
        setMessage("Erreur chargement formation ❌");
        toastError("Erreur chargement formation ❌");
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleParticipantChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...formData.participants];
    updated[index][name] = value;
    setFormData((prev) => ({ ...prev, participants: updated }));
  };

  const addParticipant = () => {
    setFormData((prev) => ({
      ...prev,
      participants: [
        ...prev.participants,
        { nom: "", prenom: "", fonction: "", contact: "", prix: "" },
      ],
    }));
  };

  const removeParticipant = (index) => {
    if (formData.participants.length > 1) {
      const updated = formData.participants.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, participants: updated }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ FIX DOUBLON — si déjà en cours, on bloque tout de suite
    if (loading) return;

    setLoading(true);
    setMessage("");

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    try {
      const backendBase = getApiBase();
      const res = await axios.post(
        `${backendBase}/api/formations/${id}/register`,
        { ...formData, id_utilisateur: user.id_utilisateur },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Inscription réussie:", res.data);

      navigate(`/formations/${id}/paiement`, {
        state: {
          inscription: res.data.inscription || null,
          paiement: res.data.paiement || null,
          formation: formation,
        },
      });
    } catch (err) {
      console.error("❌ Erreur:", err.response?.data || err.message);

      if (err.response?.status === 409) {
        toastWarning("Vous êtes déjà inscrit à cette formation !");
      } else {
        toastError(err.response?.data?.message || "Erreur lors de l'inscription");
      }

      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-bg-glow register-bg-glow--left" aria-hidden />
      <div className="register-bg-glow register-bg-glow--right" aria-hidden />
      <div className="register-shell">
        {formation ? (
          <>
            <header className="formation-header">
              <p className="formation-header-kicker">Formulaire officiel</p>
              <h1>Inscription a la formation</h1>
              <h2>{formation.titre}</h2>
              <div className="formation-header-chips">
                <span className="formation-header-chip">Etape 1/2: inscription</span>
                <span className="formation-header-chip">Paiement apres validation</span>
              </div>
            </header>

            <form onSubmit={handleSubmit} className="register-form">

            {/* Responsable */}
              <section className="form-section">
                <h2>
                  <span className="section-index">01</span>
                  <span>Responsable de l'inscription</span>
                </h2>
              <div className="form-grid">
                <input
                  type="text"
                  name="responsable_nom"
                  placeholder="Nom *"
                  required
                  onChange={handleChange}
                />
                <input
                  type="text"
                  name="responsable_prenom"
                  placeholder="Prénom *"
                  required
                  onChange={handleChange}
                />
                <select name="civilite" onChange={handleChange}>
                  <option value="">Civilité</option>
                  <option value="Monsieur">Monsieur</option>
                  <option value="Madame">Madame</option>
                  <option value="Mademoiselle">Mademoiselle</option>
                </select>
                <input
                  type="text"
                  name="fonction"
                  placeholder="Fonction"
                  onChange={handleChange}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email *"
                  required
                  onChange={handleChange}
                />
                <input
                  type="text"
                  name="telephone"
                  placeholder="Téléphone"
                  onChange={handleChange}
                />
                <input
                  type="text"
                  name="societe"
                  placeholder="Nom de société"
                  onChange={handleChange}
                />
                <input
                  type="text"
                  name="adresse_societe"
                  placeholder="Adresse de la société"
                  className="full-width"
                  onChange={handleChange}
                />
              </div>
              </section>

            {/* Participants */}
              <section className="form-section">
                <h2>
                  <span className="section-index">02</span>
                  <span>Participant(s)</span>
                </h2>
              {formData.participants.map((p, i) => (
                <div key={i} className="participant-block">
                  <div className="participant-header">
                    <h3>
                      <span className="participant-number-badge">{i + 1}</span>
                      Participant {i + 1}
                    </h3>
                    {formData.participants.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => removeParticipant(i)}
                      >
                        <i className="fas fa-times"></i> Retirer
                      </button>
                    )}
                  </div>
                  <div className="form-grid">
                    <input
                      type="text"
                      name="nom"
                      placeholder="Nom *"
                      required
                      value={p.nom}
                      onChange={(e) => handleParticipantChange(i, e)}
                    />
                    <input
                      type="text"
                      name="prenom"
                      placeholder="Prénom *"
                      required
                      value={p.prenom}
                      onChange={(e) => handleParticipantChange(i, e)}
                    />
                    <input
                      type="text"
                      name="fonction"
                      placeholder="Fonction"
                      value={p.fonction}
                      onChange={(e) => handleParticipantChange(i, e)}
                    />
                    <input
                      type="text"
                      name="contact"
                      placeholder="Contact"
                      value={p.contact}
                      onChange={(e) => handleParticipantChange(i, e)}
                    />
                    <input
                      type="number"
                      name="prix"
                      placeholder="Prix (optionnel)"
                      value={p.prix}
                      onChange={(e) => handleParticipantChange(i, e)}
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="btn-add-participant"
                onClick={addParticipant}
              >
                <i className="fas fa-plus"></i> Ajouter un participant
              </button>
              </section>

            {/* Facturation */}
              <section className="form-section">
                <h2>
                  <span className="section-index">03</span>
                  <span>Facturation</span>
                </h2>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="facturation"
                    value="participant"
                    checked={formData.facturation === "participant"}
                    onChange={handleChange}
                  />
                  <span>Au participant</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="facturation"
                    value="societe"
                    checked={formData.facturation === "societe"}
                    onChange={handleChange}
                  />
                  <span>À la société</span>
                </label>
              </div>
              </section>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>
                  Annuler
                </button>
                <button type="submit" className="btn-inscrire" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader variant="inline" size="sm" /> Traitement en cours...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check-circle"></i> Confirmer l'inscription
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          <p className="register-loading-text">{message || "Chargement en cours..."}</p>
        )}
      </div>
    </div>
  );
};

export default FormationRegister;