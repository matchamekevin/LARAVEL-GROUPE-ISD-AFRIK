import React, { useDeferredValue, useEffect, useState } from "react";
import api from "../../../axios";
import {
  buildCategoryPath,
  flattenCategoryTree,
  readGeovisionSpecifications,
  resolveGeovisionImage,
} from "../../../utils/geovision";

const EMPTY_TEXT = "";
const EMPTY_TECH_SPEC = { label: "", value: "" };

function buildEmptyForm(defaultBrand = "") {
  return {
    titre: "",
    reference: "",
    marque: defaultBrand,
    modele: "",
    prix: "",
    prix_promo: "",
    stock: "",
    stock_alerte: 2,
    statut: "disponible",
    id_pays: 1,
    id_categorie: "",
    description: "",
    description_courte: "",
    garantie: "",
    est_en_vedette: false,
    est_nouveau: true,
    en_promo: false,
    overview: "",
    series: "",
    source_url: "",
    image_urls: [EMPTY_TEXT],
    tags: [EMPTY_TEXT],
    features: [EMPTY_TEXT],
    platforms: [EMPTY_TEXT],
    use_cases: [EMPTY_TEXT],
    detail_notes: [EMPTY_TEXT],
    technical_specs: [{ ...EMPTY_TECH_SPEC }],
  };
}

function removeWithFallback(items, index, fallbackItem) {
  const next = items.filter((_, itemIndex) => itemIndex !== index);
  return next.length > 0 ? next : [fallbackItem];
}

function computeTaxonomy(categoryId, categoriesById) {
  const category = categoriesById[Number(categoryId)];

  if (!category) {
    return { family: "", category: "", subcategory: "" };
  }

  const chain = [];
  let current = category;
  let guard = 0;

  while (current && guard < 12) {
    chain.unshift(current);
    current = current.parent_id ? categoriesById[current.parent_id] : null;
    guard += 1;
  }

  return {
    family: chain[0]?.nom || "",
    category: chain[chain.length - 1]?.nom || chain[0]?.nom || "",
    subcategory: chain[chain.length - 1]?.nom || "",
  };
}

function toProductPayload(form, categoriesById, segment) {
  const taxonomy = computeTaxonomy(form.id_categorie, categoriesById);

  return {
    titre: form.titre.trim(),
    reference: form.reference.trim(),
    marque: form.marque.trim(),
    modele: form.modele.trim(),
    prix: Number(form.prix || 0),
    prix_promo: form.prix_promo ? Number(form.prix_promo) : null,
    stock: form.stock === "" ? null : Number(form.stock),
    stock_alerte: form.stock_alerte === "" ? null : Number(form.stock_alerte),
    statut: form.statut,
    id_pays: Number(form.id_pays || 1),
    id_categorie: Number(form.id_categorie),
    description: form.description.trim(),
    description_courte: form.description_courte.trim(),
    garantie: form.garantie.trim(),
    est_en_vedette: Boolean(form.est_en_vedette),
    est_nouveau: Boolean(form.est_nouveau),
    en_promo: Boolean(form.en_promo),
    segment,
    image_urls: form.image_urls.map((item) => item.trim()).filter(Boolean),
    specifications: {
      overview: form.overview.trim() || form.description_courte.trim() || form.description.trim(),
      tags: form.tags.map((item) => item.trim()).filter(Boolean),
      features: form.features.map((item) => item.trim()).filter(Boolean),
      platforms: form.platforms.map((item) => item.trim()).filter(Boolean),
      use_cases: form.use_cases.map((item) => item.trim()).filter(Boolean),
      detail_notes: form.detail_notes.map((item) => item.trim()).filter(Boolean),
      source_url: form.source_url.trim(),
      technical_specs: form.technical_specs
        .map((item) => ({ label: item.label.trim(), value: item.value.trim() }))
        .filter((item) => item.label || item.value),
      taxonomy: {
        family: taxonomy.family,
        category: taxonomy.category,
        subcategory: taxonomy.subcategory,
        series: form.series.trim() || form.modele.trim() || form.titre.trim(),
      },
    },
  };
}

function buildInitialForm(item, defaultBrand) {
  if (!item) {
    return buildEmptyForm(defaultBrand);
  }

  const specs = readGeovisionSpecifications(item);
  const imageUrls = item.image_urls?.length
    ? item.image_urls
    : item.images?.map((image) => image.url || image.path).filter(Boolean) || [];

  return {
    titre: item.titre || "",
    reference: item.reference || "",
    marque: item.marque || defaultBrand,
    modele: item.modele || "",
    prix: item.prix || "",
    prix_promo: item.prix_promo || "",
    stock: item.stock ?? "",
    stock_alerte: item.stock_alerte ?? 2,
    statut: item.statut || "disponible",
    id_pays: item.id_pays || 1,
    id_categorie: item.id_categorie ? String(item.id_categorie) : "",
    description: item.description || "",
    description_courte: item.description_courte || "",
    garantie: item.garantie || "",
    est_en_vedette: Boolean(item.est_en_vedette),
    est_nouveau: Boolean(item.est_nouveau),
    en_promo: Boolean(item.en_promo),
    overview: specs.overview || "",
    series: specs.taxonomy.series || item.modele || item.titre || "",
    source_url: specs.sourceUrl || "",
    image_urls: imageUrls.length > 0 ? imageUrls : [EMPTY_TEXT],
    tags: specs.tags.length > 0 ? specs.tags : [EMPTY_TEXT],
    features: specs.features.length > 0 ? specs.features : [EMPTY_TEXT],
    platforms: specs.platforms.length > 0 ? specs.platforms : [EMPTY_TEXT],
    use_cases: specs.useCases.length > 0 ? specs.useCases : [EMPTY_TEXT],
    detail_notes: specs.detailNotes.length > 0 ? specs.detailNotes : [EMPTY_TEXT],
    technical_specs: specs.technicalSpecs.length > 0 ? specs.technicalSpecs : [{ ...EMPTY_TECH_SPEC }],
  };
}

export default function ProductManager({
  segment,
  title,
  description,
  defaultBrand = "",
  allowSync = false,
}) {
  const [items, setItems] = useState([]);
  const [flatCategories, setFlatCategories] = useState([]);
  const [categoriesById, setCategoriesById] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(buildEmptyForm(defaultBrand));
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const selectableCategories = flatCategories.filter((category) => {
    if (segment === "geovision") {
      return Boolean(category.parent_id);
    }

    return true;
  });

  const taxonomyPreview = computeTaxonomy(form.id_categorie, categoriesById);

  async function loadCategories() {
    const response = await api.get("/admin/categories-produits", {
      params: {
        tree: 1,
        segment,
      },
    });

    const tree = Array.isArray(response.data?.data) ? response.data.data : (response.data || []);
    const flat = flattenCategoryTree(tree);
    const map = flat.reduce((accumulator, item) => {
      accumulator[item.id_categorie || item.id] = item;
      return accumulator;
    }, {});

    setFlatCategories(flat);
    setCategoriesById(map);
  }

  async function loadProducts() {
    setLoading(true);
    setMessage("");

    try {
      const response = await api.get("/admin/produits", {
        params: {
          segment,
          ...(categoryFilter ? { id_categorie: categoryFilter } : {}),
          ...(deferredSearch.trim() ? { q: deferredSearch.trim() } : {}),
        },
      });

      setItems(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Erreur de chargement des produits.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories().catch((error) => {
      setMessage(error.response?.data?.message || "Erreur de chargement des catégories.");
    });
  }, [segment]);

  useEffect(() => {
    loadProducts();
  }, [segment, categoryFilter, deferredSearch]);

  useEffect(() => {
    if (showForm) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    return () => document.body.classList.remove("modal-open");
  }, [showForm]);

  useEffect(() => {
    if (showForm && !editing && !form.id_categorie && selectableCategories.length > 0) {
      setForm((previous) => ({
        ...previous,
        id_categorie: String(selectableCategories[0].id_categorie || selectableCategories[0].id),
      }));
    }
  }, [showForm, editing, form.id_categorie, selectableCategories]);

  function openNew() {
    setEditing(null);
    setForm(buildEmptyForm(defaultBrand));
    setShowForm(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm(buildInitialForm(item, defaultBrand));
    setShowForm(true);
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const payload = toProductPayload(form, categoriesById, segment);

      if (editing) {
        await api.put(`/produits/${editing.id_produit || editing.id}`, payload);
        setMessage("Produit mis à jour.");
      } else {
        await api.post("/produits", payload);
        setMessage("Produit créé.");
      }

      setShowForm(false);
      await loadProducts();
    } catch (error) {
      setMessage(error.response?.data?.message || JSON.stringify(error.response?.data?.errors || "Erreur"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Supprimer "${item.titre}" ?`)) return;

    try {
      await api.delete(`/produits/${item.id_produit || item.id}`);
      setMessage("Produit supprimé.");
      await loadProducts();
    } catch (error) {
      setMessage(error.response?.data?.message || "Erreur de suppression.");
    }
  }

  async function handleSync() {
    if (!window.confirm("La synchronisation officielle GeoVision va remplacer le catalogue GeoVision actuel. Continuer ?")) {
      return;
    }

    setSyncing(true);
    setMessage("");

    try {
      const response = await api.post("/admin/geovision/sync", {
        replace: true,
        fetch_details: true,
      });

      const stats = response.data?.data || {};
      setMessage(`Catalogue GeoVision synchronisé: ${stats.families || 0} familles, ${stats.categories || 0} catégories, ${stats.products || 0} produits.`);
      setCategoryFilter("");
      await loadCategories();
      await loadProducts();
    } catch (error) {
      setMessage(error.response?.data?.message || "Synchronisation GeoVision impossible.");
    } finally {
      setSyncing(false);
    }
  }

  function updateListField(key, index, value) {
    const next = [...form[key]];
    next[index] = value;
    setForm({ ...form, [key]: next });
  }

  function updateTechnicalSpec(index, key, value) {
    const next = [...form.technical_specs];
    next[index] = { ...next[index], [key]: value };
    setForm({ ...form, technical_specs: next });
  }

  return (
    <div className="admin-page-stack">
      <section className="admin-card admin-page-hero">
        <div>
          <p className="admin-eyebrow">{segment === "geovision" ? "GeoVision" : "Catalogue général"}</p>
          <h2>{title}</h2>
          <p className="admin-muted">{description}</p>
        </div>
        <div className="admin-hero-metrics">
          <div className="admin-hero-metric">
            <strong>{items.length}</strong>
            <span>Produits chargés</span>
          </div>
          <div className="admin-hero-metric">
            <strong>{selectableCategories.length}</strong>
            <span>Catégories actives</span>
          </div>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-header admin-card-header--stack">
          <div>
            <h3>Liste des produits</h3>
            <p className="admin-muted">Recherche ciblée, édition structurée et segmentation séparée pour éviter les mélanges.</p>
          </div>
          <div className="admin-toolbar">
            <select className="admin-input admin-select-sm" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="">Toutes catégories</option>
              {selectableCategories.map((category) => {
                const categoryId = category.id_categorie || category.id;

                return (
                  <option key={categoryId} value={categoryId}>
                    {buildCategoryPath(category, categoriesById)}
                  </option>
                );
              })}
            </select>

            <input
              className="admin-input admin-search"
              placeholder="Rechercher un produit précis..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />

            {allowSync && (
              <button className="admin-btn admin-btn--secondary" onClick={handleSync} disabled={syncing}>
                {syncing ? "Synchronisation..." : "Sync officiel"}
              </button>
            )}

            <button className="admin-btn" onClick={openNew}>+ Nouveau produit</button>
          </div>
        </div>

        {message && <div className="admin-alert">{message}</div>}

        {loading ? (
          <div className="admin-muted">Chargement...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Catégorie</th>
                <th>Référence</th>
                <th>Prix</th>
                <th>Statut</th>
                <th>Source</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan="7" className="admin-muted">Aucun produit trouvé.</td>
                </tr>
              )}

              {items.map((item) => {
                const category = categoriesById[item.id_categorie] || item.categorie;
                const specs = readGeovisionSpecifications(item);

                return (
                  <tr key={item.id_produit || item.id}>
                    <td>
                      <div className="admin-product-row">
                        <img src={resolveGeovisionImage(item)} alt={item.titre} className="admin-thumb" />
                        <div>
                          <strong>{item.titre}</strong>
                          <div className="admin-muted">{item.marque || "—"}{item.modele ? ` · ${item.modele}` : ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="admin-muted">{buildCategoryPath(category, categoriesById) || "-"}</td>
                    <td>{item.reference || "-"}</td>
                    <td>{Number(item.prix || 0).toLocaleString("fr-FR")} FCFA</td>
                    <td>
                      <span className={`admin-badge ${item.statut === "disponible" || item.statut === "actif" ? "admin-badge--success" : "admin-badge--danger"}`}>
                        {item.statut}
                      </span>
                    </td>
                    <td>{specs.sourceUrl ? <span className="admin-badge">Officiel</span> : <span className="admin-muted">Manuel</span>}</td>
                    <td className="admin-actions-cell">
                      <button className="admin-btn-sm" onClick={() => openEdit(item)}>Modifier</button>
                      <button className="admin-btn-sm admin-btn--danger" onClick={() => handleDelete(item)}>Supprimer</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal admin-modal--xwide" onClick={(event) => event.stopPropagation()}>
            <h3>{editing ? "Modifier le produit" : "Nouveau produit"}</h3>

            <form className="admin-form" onSubmit={handleSave}>
              <div className="admin-form-section">
                <div className="admin-form-section__head">
                  <h4>Informations générales</h4>
                  <p className="admin-muted">Base commune du catalogue, visible dans les cartes et les fiches.</p>
                </div>

                <div className="admin-form-row">
                  <div>
                    <label>Titre *</label>
                    <input className="admin-input" required value={form.titre} onChange={(event) => setForm({ ...form, titre: event.target.value })} />
                  </div>
                  <div>
                    <label>Référence</label>
                    <input className="admin-input" value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div>
                    <label>Marque</label>
                    <input className="admin-input" value={form.marque} onChange={(event) => setForm({ ...form, marque: event.target.value })} />
                  </div>
                  <div>
                    <label>Modèle</label>
                    <input className="admin-input" value={form.modele} onChange={(event) => setForm({ ...form, modele: event.target.value })} />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div>
                    <label>Prix</label>
                    <input className="admin-input" type="number" min="0" value={form.prix} onChange={(event) => setForm({ ...form, prix: event.target.value })} />
                  </div>
                  <div>
                    <label>Prix promo</label>
                    <input className="admin-input" type="number" min="0" value={form.prix_promo} onChange={(event) => setForm({ ...form, prix_promo: event.target.value })} />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div>
                    <label>Stock</label>
                    <input className="admin-input" type="number" min="0" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} />
                  </div>
                  <div>
                    <label>Seuil alerte</label>
                    <input className="admin-input" type="number" min="0" value={form.stock_alerte} onChange={(event) => setForm({ ...form, stock_alerte: event.target.value })} />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div>
                    <label>Statut</label>
                    <select className="admin-input" value={form.statut} onChange={(event) => setForm({ ...form, statut: event.target.value })}>
                      <option value="disponible">Disponible</option>
                      <option value="actif">Actif</option>
                      <option value="indisponible">Indisponible</option>
                      <option value="rupture">Rupture</option>
                    </select>
                  </div>
                  <div>
                    <label>Garantie</label>
                    <input className="admin-input" value={form.garantie} onChange={(event) => setForm({ ...form, garantie: event.target.value })} />
                  </div>
                </div>

                <div>
                  <label>Description courte</label>
                  <textarea className="admin-input" rows="2" value={form.description_courte} onChange={(event) => setForm({ ...form, description_courte: event.target.value })} />
                </div>

                <div>
                  <label>Description détaillée</label>
                  <textarea className="admin-input" rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
                </div>
              </div>

              <div className="admin-form-section">
                <div className="admin-form-section__head">
                  <h4>Catégorie et taxonomie</h4>
                  <p className="admin-muted">La famille et la série sont pilotées par la catégorie choisie, sans champ JSON brut.</p>
                </div>

                <div className="admin-form-row">
                  <div>
                    <label>Catégorie *</label>
                    <select className="admin-input" required value={form.id_categorie} onChange={(event) => setForm({ ...form, id_categorie: event.target.value })}>
                      <option value="">-- Choisir une catégorie --</option>
                      {selectableCategories.map((category) => {
                        const categoryId = category.id_categorie || category.id;
                        return (
                          <option key={categoryId} value={categoryId}>
                            {buildCategoryPath(category, categoriesById)}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label>Série</label>
                    <input className="admin-input" value={form.series} onChange={(event) => setForm({ ...form, series: event.target.value })} />
                  </div>
                </div>

                <div>
                  <label>Source constructeur</label>
                  <input className="admin-input" placeholder="https://www.geovision.com.tw/..." value={form.source_url} onChange={(event) => setForm({ ...form, source_url: event.target.value })} />
                </div>

                <div>
                  <label>Overview fiche</label>
                  <textarea className="admin-input" rows="3" value={form.overview} onChange={(event) => setForm({ ...form, overview: event.target.value })} />
                </div>

                <div className="admin-taxonomy-preview">
                  <span><strong>Famille:</strong> {taxonomyPreview.family || "—"}</span>
                  <span><strong>Catégorie:</strong> {taxonomyPreview.category || "—"}</span>
                  <span><strong>Sous-type:</strong> {taxonomyPreview.subcategory || "—"}</span>
                </div>
              </div>

              <div className="admin-form-section">
                <div className="admin-form-section__head">
                  <h4>Images</h4>
                  <p className="admin-muted">URLs utilisées pour les cartes et la galerie du produit.</p>
                </div>

                <div className="admin-repeater">
                  {form.image_urls.map((imageUrl, index) => (
                    <div key={`image-${index}`} className="admin-repeater-row">
                      <input className="admin-input" value={imageUrl} onChange={(event) => updateListField("image_urls", index, event.target.value)} />
                      <button
                        type="button"
                        className="admin-btn-sm admin-btn--secondary"
                        onClick={() => setForm({ ...form, image_urls: removeWithFallback(form.image_urls, index, EMPTY_TEXT) })}
                      >
                        Retirer
                      </button>
                    </div>
                  ))}
                  <button type="button" className="admin-btn-sm" onClick={() => setForm({ ...form, image_urls: [...form.image_urls, EMPTY_TEXT] })}>
                    + Ajouter une image
                  </button>
                </div>
              </div>

              <div className="admin-form-section">
                <div className="admin-form-section__head">
                  <h4>Tags visibles</h4>
                  <p className="admin-muted">Chips courts de type 4MP, Fixed, AI, IP67, IK10, etc.</p>
                </div>

                <div className="admin-repeater">
                  {form.tags.map((tag, index) => (
                    <div key={`tag-${index}`} className="admin-repeater-row">
                      <input className="admin-input" placeholder="Ex: 4MP, AI, IK10..." value={tag} onChange={(event) => updateListField("tags", index, event.target.value)} />
                      <button
                        type="button"
                        className="admin-btn-sm admin-btn--secondary"
                        onClick={() => setForm({ ...form, tags: removeWithFallback(form.tags, index, EMPTY_TEXT) })}
                      >
                        Retirer
                      </button>
                    </div>
                  ))}
                  <button type="button" className="admin-btn-sm" onClick={() => setForm({ ...form, tags: [...form.tags, EMPTY_TEXT] })}>
                    + Ajouter un tag
                  </button>
                </div>
              </div>

              <div className="admin-form-section">
                <div className="admin-form-section__head">
                  <h4>Points clés</h4>
                  <p className="admin-muted">Fonctions détaillées de la fiche technique.</p>
                </div>

                <div className="admin-repeater">
                  {form.features.map((feature, index) => (
                    <div key={`feature-${index}`} className="admin-repeater-row">
                      <input className="admin-input" value={feature} onChange={(event) => updateListField("features", index, event.target.value)} />
                      <button
                        type="button"
                        className="admin-btn-sm admin-btn--secondary"
                        onClick={() => setForm({ ...form, features: removeWithFallback(form.features, index, EMPTY_TEXT) })}
                      >
                        Retirer
                      </button>
                    </div>
                  ))}
                  <button type="button" className="admin-btn-sm" onClick={() => setForm({ ...form, features: [...form.features, EMPTY_TEXT] })}>
                    + Ajouter un point clé
                  </button>
                </div>
              </div>

              <div className="admin-form-section">
                <div className="admin-form-section__head">
                  <h4>Plateformes / compatibilité</h4>
                  <p className="admin-muted">Systèmes, environnements ou lignes résumées visibles sur les références logicielles et appliances.</p>
                </div>

                <div className="admin-repeater">
                  {form.platforms.map((platform, index) => (
                    <div key={`platform-${index}`} className="admin-repeater-row">
                      <input className="admin-input" value={platform} onChange={(event) => updateListField("platforms", index, event.target.value)} />
                      <button
                        type="button"
                        className="admin-btn-sm admin-btn--secondary"
                        onClick={() => setForm({ ...form, platforms: removeWithFallback(form.platforms, index, EMPTY_TEXT) })}
                      >
                        Retirer
                      </button>
                    </div>
                  ))}
                  <button type="button" className="admin-btn-sm" onClick={() => setForm({ ...form, platforms: [...form.platforms, EMPTY_TEXT] })}>
                    + Ajouter une ligne
                  </button>
                </div>
              </div>

              <div className="admin-form-section">
                <div className="admin-form-section__head">
                  <h4>Cas d'usage</h4>
                  <p className="admin-muted">Usages recommandés affichés dans la fiche constructeur.</p>
                </div>

                <div className="admin-repeater">
                  {form.use_cases.map((item, index) => (
                    <div key={`use-case-${index}`} className="admin-repeater-row">
                      <input className="admin-input" value={item} onChange={(event) => updateListField("use_cases", index, event.target.value)} />
                      <button
                        type="button"
                        className="admin-btn-sm admin-btn--secondary"
                        onClick={() => setForm({ ...form, use_cases: removeWithFallback(form.use_cases, index, EMPTY_TEXT) })}
                      >
                        Retirer
                      </button>
                    </div>
                  ))}
                  <button type="button" className="admin-btn-sm" onClick={() => setForm({ ...form, use_cases: [...form.use_cases, EMPTY_TEXT] })}>
                    + Ajouter un cas d'usage
                  </button>
                </div>
              </div>

              <div className="admin-form-section">
                <div className="admin-form-section__head">
                  <h4>Détails complémentaires</h4>
                  <p className="admin-muted">Texte détaillé affiché dans la section "Plus de détails".</p>
                </div>

                <div className="admin-repeater">
                  {form.detail_notes.map((item, index) => (
                    <div key={`detail-note-${index}`} className="admin-repeater-row">
                      <input className="admin-input" value={item} onChange={(event) => updateListField("detail_notes", index, event.target.value)} />
                      <button
                        type="button"
                        className="admin-btn-sm admin-btn--secondary"
                        onClick={() => setForm({ ...form, detail_notes: removeWithFallback(form.detail_notes, index, EMPTY_TEXT) })}
                      >
                        Retirer
                      </button>
                    </div>
                  ))}
                  <button type="button" className="admin-btn-sm" onClick={() => setForm({ ...form, detail_notes: [...form.detail_notes, EMPTY_TEXT] })}>
                    + Ajouter un détail
                  </button>
                </div>
              </div>

              <div className="admin-form-section">
                <div className="admin-form-section__head">
                  <h4>Spécifications techniques</h4>
                  <p className="admin-muted">Paires label / valeur pour la fiche technique détaillée.</p>
                </div>

                <div className="admin-repeater">
                  {form.technical_specs.map((spec, index) => (
                    <div key={`spec-${index}`} className="admin-repeater-grid">
                      <input className="admin-input" placeholder="Label" value={spec.label} onChange={(event) => updateTechnicalSpec(index, "label", event.target.value)} />
                      <input className="admin-input" placeholder="Valeur" value={spec.value} onChange={(event) => updateTechnicalSpec(index, "value", event.target.value)} />
                      <button
                        type="button"
                        className="admin-btn-sm admin-btn--secondary"
                        onClick={() => setForm({ ...form, technical_specs: removeWithFallback(form.technical_specs, index, { ...EMPTY_TECH_SPEC }) })}
                      >
                        Retirer
                      </button>
                    </div>
                  ))}
                  <button type="button" className="admin-btn-sm" onClick={() => setForm({ ...form, technical_specs: [...form.technical_specs, { ...EMPTY_TECH_SPEC }] })}>
                    + Ajouter une spécification
                  </button>
                </div>
              </div>

              <div className="admin-checkbox-grid">
                <label className="admin-checkbox">
                  <input type="checkbox" checked={form.est_en_vedette} onChange={(event) => setForm({ ...form, est_en_vedette: event.target.checked })} />
                  Produit en vedette
                </label>
                <label className="admin-checkbox">
                  <input type="checkbox" checked={form.est_nouveau} onChange={(event) => setForm({ ...form, est_nouveau: event.target.checked })} />
                  Nouveau produit
                </label>
                <label className="admin-checkbox">
                  <input type="checkbox" checked={form.en_promo} onChange={(event) => setForm({ ...form, en_promo: event.target.checked })} />
                  Produit en promo
                </label>
              </div>

              <div className="admin-form-actions">
                <button className="admin-btn" type="submit" disabled={saving}>{saving ? "..." : (editing ? "Mettre à jour" : "Créer")}</button>
                <button className="admin-btn admin-btn--secondary" type="button" onClick={() => setShowForm(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
