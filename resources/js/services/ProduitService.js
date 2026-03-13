import api from "../axios";

// ── Liste avec filtres & pagination ──────────────────────
export const getProduits = (params = {}) =>
  api.get("/produits", { params });

// ── Détail par ID ─────────────────────────────────────────
export const getProduit = (id) =>
  api.get(`/produits/${id}`);

// ── Détail par slug ───────────────────────────────────────
export const getProduitBySlug = (slug) =>
  api.get(`/produits/slug/${slug}`);

// ── Recherche textuelle ───────────────────────────────────
export const searchProduits = (q) =>
  api.get(`/produits/recherche`, { params: { q } });

// ── Produits en vedette ───────────────────────────────────
export const getProduitsVedette = () =>
  api.get("/produits/vedette");

// ── Nouveaux produits ─────────────────────────────────────
export const getProduitsNouveaux = () =>
  api.get("/produits/nouveaux");

// ── Promotions ────────────────────────────────────────────
export const getProduitsPromo = () =>
  api.get("/produits/promotions");

// ── Liste des marques ─────────────────────────────────────
export const getMarques = (id_pays) =>
  api.get("/produits/marques", { params: { id_pays } });

// ── Catégories ────────────────────────────────────────────
export const getCategories = () =>
  api.get("/categories-produits");

export const getCategorie = (id) =>
  api.get(`/categories-produits/${id}`);