import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/home.css";
import { geovisionProducts, geovisionTypes } from "../data/geovisionCatalog";

export default function GeovisionCatalogue() {
  const navigate = useNavigate();
  const { typeId } = useParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedType, setSelectedType] = useState(() => {
    return typeId ? decodeURIComponent(typeId) : "Caméra IP";
  });
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedResolution, setSelectedResolution] = useState("");
  const [selectedLens, setSelectedLens] = useState("");
  const [selectedEnvironment, setSelectedEnvironment] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize products
  useEffect(() => {
    setProducts(geovisionProducts || []);
  }, []);

  // Update selectedType when typeId changes
  useEffect(() => {
    if (typeId) {
      setSelectedType(decodeURIComponent(typeId));
      setSelectedCategory("");
    }
  }, [typeId]);

  // Group products by type
  const groupedProducts = React.useMemo(() => {
    const groups = {};
    products.forEach((p) => {
      const typeKey = p.type || "Autre";
      if (!groups[typeKey]) {
        groups[typeKey] = [];
      }
      groups[typeKey].push(p);
    });
    return groups;
  }, [products]);

  // Get available categories for selected type
  const availableCategories = React.useMemo(() => {
    const typeProducts = groupedProducts[selectedType] || [];
    const categories = [...new Set(typeProducts.map((p) => p.category || ""))].filter(Boolean);
    return categories;
  }, [selectedType, groupedProducts]);

  // Get available resolutions
  const availableResolutions = React.useMemo(() => {
    return ["2MP", "4MP", "5MP", "8MP", "12MP", "Above 8MP"];
  }, []);

  // Get available lens types
  const availableLens = React.useMemo(() => {
    return ["Fixed", "Varifocal", "Motorized"];
  }, []);

  // Get available environments
  const availableEnvironments = React.useMemo(() => {
    return ["Arctic", "Indoor", "IP66 or Above"];
  }, []);

  // Apply filters
  useEffect(() => {
    let result = products;

    // Filter by type
    if (selectedType) {
      result = result.filter((p) => p.type === selectedType);
    }

    // Filter by category
    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) => {
        const nom = (p.nom || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        return nom.includes(query) || desc.includes(query);
      });
    }

    setFilteredProducts(result);
  }, [products, selectedType, selectedCategory, selectedResolution, selectedLens, selectedEnvironment, searchQuery]);

  // Handle category change
  const handleTypeChange = (value) => {
    setSelectedType(value);
    setSelectedCategory("");
  };

  return (
    <main className="main" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Banner avec filtres */}
      <div className="bannerWrapper wow fadeIn focuspoint" style={{ position: "relative", marginTop: "120px", marginBottom: "40px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <form className="proSelect clearfix hidden-xs" id="proSearch" style={{ padding: "16px 12px", maxWidth: "720px", margin: "0 auto" }}>
          <div className="titleh2" style={{ fontSize: "28px", fontWeight: "700", marginBottom: "20px", color: "#333" }}>Filtrer les produits</div>
          <div className="form-group select clearfix" style={{ display: "flex", gap: "15px", flexWrap: "wrap", marginBottom: "15px" }}>
            <select
              className="form-control select gradient w45"
              name="type"
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value)}
              style={{
                flex: "1 1 calc(50% - 10px)",
                minWidth: "160px",
                padding: "10px 12px",
                borderRadius: "6px",
                border: "1px solid #ddd",
                backgroundColor: "#fff",
              }}
            >
              <option value="">Tous les types</option>
              {geovisionTypes.map((t) => (
                <option key={t.id || t.title} value={t.title}>
                  {t.title}
                </option>
              ))}
            </select>
            <select
              className="form-control select gradient w45 categoryItem"
              name="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                flex: "1 1 calc(50% - 10px)",
                minWidth: "160px",
                padding: "10px 12px",
                borderRadius: "6px",
                border: "1px solid #ddd",
                backgroundColor: "#fff",
              }}
            >
              <option value="">Toutes les catégories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group select clearfix" id="moreDetail1" style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
            <select
              className="form-control gradient w30"
              name="res"
              value={selectedResolution}
              onChange={(e) => setSelectedResolution(e.target.value)}
              style={{
                flex: "1 1 calc(33% - 12px)",
                minWidth: "130px",
                padding: "10px 12px",
                borderRadius: "6px",
                border: "1px solid #ddd",
                backgroundColor: "#fff",
              }}
            >
              <option value="">Résolution</option>
              {availableResolutions.map((res) => (
                <option key={res} value={res}>
                  {res}
                </option>
              ))}
            </select>
            <select
              className="form-control gradient w30"
              name="lens"
              value={selectedLens}
              onChange={(e) => setSelectedLens(e.target.value)}
              style={{
                flex: "1 1 calc(33% - 12px)",
                minWidth: "130px",
                padding: "10px 12px",
                borderRadius: "6px",
                border: "1px solid #ddd",
                backgroundColor: "#fff",
              }}
            >
              <option value="">Type d'objectif</option>
              {availableLens.map((lens) => (
                <option key={lens} value={lens}>
                  {lens}
                </option>
              ))}
            </select>
            <select
              className="form-control gradient w30"
              name="environment"
              value={selectedEnvironment}
              onChange={(e) => setSelectedEnvironment(e.target.value)}
              style={{
                flex: "1 1 calc(33% - 12px)",
                minWidth: "130px",
                padding: "10px 12px",
                borderRadius: "6px",
                border: "1px solid #ddd",
                backgroundColor: "#fff",
              }}
            >
              <option value="">Environnement</option>
              {availableEnvironments.map((env) => (
                <option key={env} value={env}>
                  {env}
                </option>
              ))}
            </select>
          </div>
        </form>
      </div>

      {/* Barre de recherche */}
      <div style={{ padding: "30px 20px", textAlign: "center", backgroundColor: "#ffffff", borderBottom: "1px solid #e0e0e0", marginBottom: "40px" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", border: "2px solid #ddd", borderRadius: "30px", backgroundColor: "#fff", padding: "0 15px", transition: "all 0.3s" }}>
            <svg style={{ width: "20px", height: "20px", color: "#999", marginRight: "10px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: "12px 10px",
                fontSize: "14px",
                border: "none",
                outline: "none",
                backgroundColor: "transparent",
              }}
            />
          </div>
        </div>
      </div>

      {/* Liste des produits par catégorie */}
      <div id="productList" style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 20px 40px" }}>
        {filteredProducts.length === 0 ? (
          <div style={{ padding: "80px 20px", textAlign: "center", color: "#999" }}>
            <svg style={{ width: "80px", height: "80px", margin: "0 auto 20px", opacity: "0.3" }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <h3 style={{ fontSize: "22px", fontWeight: "600", marginBottom: "10px" }}>Aucun produit trouvé</h3>
            <p style={{ fontSize: "14px" }}>Essayez de modifier vos filtres ou votre recherche.</p>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
              <h2 style={{ fontSize: "32px", fontWeight: "700", color: "#333", margin: "0 0 10px 0" }}>
                {selectedType || "Tous les produits"}
              </h2>
              <p style={{ fontSize: "14px", color: "#999", margin: "0" }}>
                {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} disponible{filteredProducts.length > 1 ? 's' : ''}
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "25px", marginBottom: "40px" }}>
              {filteredProducts.map((p) => (
                <article
                  key={p.id}
                  style={{
                    border: "1px solid #e8e8e8",
                    borderRadius: "12px",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    backgroundColor: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-8px)";
                    e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)";
                    e.currentTarget.style.borderColor = "#ff9800";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
                    e.currentTarget.style.borderColor = "#e8e8e8";
                  }}
                  onClick={() => navigate(`/geovision/produit/${p.id}`)}
                >
                  <div style={{ width: "100%", height: "180px", backgroundColor: "#f5f5f5", overflow: "hidden", position: "relative" }}>
                    <img
                      src={p.image || "/images/geovision/cam1.png"}
                      alt={p.nom}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.src = "/images/geovision/cam1.png";
                      }}
                    />
                    <div style={{ position: "absolute", top: "10px", right: "10px", backgroundColor: "#ff9800", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "600" }}>
                      {p.type.split(' ').slice(0, 2).join(' ')}
                    </div>
                  </div>
                  <div style={{ padding: "18px" }}>
                    <h3 style={{ margin: "0 0 10px 0", fontSize: "15px", fontWeight: "700", color: "#333", lineHeight: "1.4" }}>
                      {p.nom}
                    </h3>
                    <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#666", minHeight: "36px", lineHeight: "1.5" }}>
                      {p.description}
                    </p>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
                      {p.specs && p.specs.slice(0, 3).map((spec, idx) => (
                        <span
                          key={idx}
                          style={{
                            backgroundColor: "#f0f0f0",
                            color: "#ff9800",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "600",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {typeof spec === 'string' ? spec : (spec?.label || 'Feature')}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/geovision/produit/${p.id}`);
                      }}
                      style={{
                        marginTop: "12px",
                        width: "100%",
                        padding: "10px",
                        backgroundColor: "#ff9800",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "600",
                        transition: "all 0.3s",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#e68900";
                        e.target.style.transform = "scale(1.02)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#ff9800";
                        e.target.style.transform = "scale(1)";
                      }}
                    >
                      Voir détails →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bouton retour centré */}
      <div style={{ padding: "40px 20px", textAlign: "center", backgroundColor: "#fff", borderTop: "1px solid #e0e0e0" }}>
        <button
          onClick={() => navigate("/geovision")}
          style={{
            padding: "12px 40px",
            backgroundColor: "#333",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
            transition: "all 0.3s",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#ff9800";
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 8px 16px rgba(255, 152, 0, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#333";
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "none";
          }}
        >
          ← Retour au catalogue Geovision
        </button>
      </div>
    </main>
  );
}
