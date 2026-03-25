import React from "react";
import { Navigate } from "react-router-dom";

export default function Produits() {
  return <Navigate to="/admin/catalogue/produits" replace />;
}
