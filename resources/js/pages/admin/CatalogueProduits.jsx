import React from "react";
import ProductManager from "./catalog/ProductManager";

export default function CatalogueProduits() {
  return (
    <ProductManager
      segment="general"
      title="Produits du catalogue general"
      description="Gestion des produits par categorie -> sous-categorie -> modele, separee des references GeoVision."
    />
  );
}
