import React from "react";
import ProductManager from "./catalog/ProductManager";

export default function CatalogueProduits() {
  return (
    <ProductManager
      segment="general"
      title="Produits du catalogue général"
      description="Espace dédié aux produits standards du site, séparé des références GeoVision pour éviter tout mélange métier."
    />
  );
}
