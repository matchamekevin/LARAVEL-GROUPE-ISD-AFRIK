import React from "react";
import CategoryManager from "./catalog/CategoryManager";

export default function GeovisionCategories() {
  return (
    <CategoryManager
      segment="geovision"
      title="Catégories GeoVision"
      description="Familles et sous-catégories GeoVision administrées à part du catalogue général."
    />
  );
}
