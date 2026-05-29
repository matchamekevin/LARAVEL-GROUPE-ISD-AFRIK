import api from "../axios";
import { countryCodeToId, getStoredCountry } from "../utils/country";

const SELECTED_COUNTRY_KEY = "isd_selected_country";

function hasExplicitCountry() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SELECTED_COUNTRY_KEY) !== null;
}

function withCountry(params = {}) {
  if (hasExplicitCountry() && params.id_pays === undefined) {
    return { ...params, id_pays: countryCodeToId(getStoredCountry()) };
  }
  return params;
}

// ── Liste avec filtres & pagination ──────────────────────
export const getProduits = (params = {}) =>
  api.get("/produits", { params: withCountry(params) });

// ── Détail par ID ─────────────────────────────────────────
export const getProduit = (id) =>
  api.get(`/produits/${id}`);

// ── Détail par slug ───────────────────────────────────────
export const getProduitBySlug = (slug) =>
  api.get(`/produits/slug/${slug}`);

// ── Recherche textuelle ───────────────────────────────────
export const searchProduits = (q) =>
  api.get(`/produits/recherche`, { params: withCountry({ q }) });

// ── Produits en vedette ───────────────────────────────────
export const getProduitsVedette = (params = {}) =>
  api.get("/produits/vedette", { params: withCountry(params) });

// ── Nouveaux produits ─────────────────────────────────────
export const getProduitsNouveaux = (params = {}) =>
  api.get("/produits/nouveaux", { params: withCountry(params) });

// ── Promotions ────────────────────────────────────────────
export const getProduitsPromo = (params = {}) =>
  api.get("/produits/promotions", { params: withCountry(params) });

// ── Liste des marques ─────────────────────────────────────
export const getMarques = (id_pays) =>
  api.get("/produits/marques", { params: { id_pays } });

// ── Catégories ────────────────────────────────────────────
export const getCategories = (params = {}) =>
  api.get("/categories-produits", { params: withCountry(params) });

export const getCategorie = (id, params = {}) =>
  api.get(`/categories-produits/${id}`, { params });

export const getCategorieBySlug = (slug, params = {}) =>
  api.get(`/categories-produits/slug/${slug}`, { params });
