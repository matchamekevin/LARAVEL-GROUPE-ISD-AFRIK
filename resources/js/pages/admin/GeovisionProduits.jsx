import React from "react";
import ProductManager from "./catalog/ProductManager";

export default function GeovisionProduits() {
  return (
    <ProductManager
      segment="geovision"
      title="Produits GeoVision"
      description="Catalogue constructeur séparé, avec édition structurée et synchronisation officielle depuis les pages GeoVision."
      defaultBrand="GeoVision"
      allowSync
    />
  );
}
