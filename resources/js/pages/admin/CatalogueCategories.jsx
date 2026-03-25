import React from "react";
import CategoryManager from "./catalog/CategoryManager";

export default function CatalogueCategories() {
  return (
    <CategoryManager
      segment="general"
      title="Catégories du catalogue général"
      description="Arborescence du catalogue non GeoVision, gérée indépendamment avec la même logique de CRUD."
    />
  );
}
