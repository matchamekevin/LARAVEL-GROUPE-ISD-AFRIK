import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "../styles/home.css";
import { getCategorie } from "../services/ProduitService";
import ProduitCard from "../components/ProduitCard";

export default function GeovisionCategorie() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [categorie, setCategorie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCategorie(id)
      .then((res) => {
        setCategorie(res.data || null);
      })
      .catch(() => {
        setCategorie(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="home geovision-category-page">
      <section className="geovision-category-hero">
        <div className="geovision-category-inner">
          <button className="btn-secondary" onClick={() => navigate("/geovision")}>Retour Geovision</button>
          <h2>{categorie?.nom || "Categorie"}</h2>
          <p>{categorie?.description || "Catalogue de produits Geovision"}</p>
        </div>
      </section>

      <section className="geovision-category-products">
        {loading && (
          <div className="geovision-empty">
            <p>Chargement des produits...</p>
          </div>
        )}
        {!loading && (!categorie || (categorie.produits || []).length === 0) && (
          <div className="geovision-empty">
            <p>Aucun produit pour cette categorie.</p>
          </div>
        )}
        {!loading && categorie && (categorie.produits || []).length > 0 && (
          <div className="geovision-products-grid">
            {categorie.produits.map((p) => {
              const imageUrl = p.image_url || p.images?.[0]?.url || (p.images?.[0]?.path ? `/storage/${p.images[0].path}` : undefined);
              return <ProduitCard key={p.id_produit || p.id} produit={{ ...p, image_url: imageUrl }} from={location.state?.from} />;
            })}
          </div>
        )}
      </section>
    </div>
  );
}
