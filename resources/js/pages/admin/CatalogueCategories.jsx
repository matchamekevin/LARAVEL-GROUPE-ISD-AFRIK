import React from "react";
import CategoryManager from "./catalog/CategoryManager";

export default function CatalogueCategories() {
  return (
    <CategoryManager
      segment="general"
      title="Categories du catalogue general"
      description="Arborescence categorie -> sous-categorie des produits, geree independamment du catalogue GeoVision."
    />
  );
}
