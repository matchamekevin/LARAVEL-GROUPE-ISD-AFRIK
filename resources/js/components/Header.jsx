import React, { useState, useEffect, useRef, memo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import CountrySelector from "./CountrySelector";
import LanguageSelector from "./LanguageSelector";
import { getCartCount, getFavoritesCount, subscribeStoreUpdates } from "../utils/shopStorage";
import "../styles/header.css";

// FontAwesome est importé via `@fortawesome/fontawesome-free` dans `resources/js/app.jsx`

function Header() {
  const { t } = useTranslation();

  const [country, setCountry] = useState("TG");
  const [lang, setLang] = useState(localStorage.getItem("lang") || "fr");
  const [isOpen, setIsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [userName, setUserName] = useState(null);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const accountRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  const countryMap = {
    "1": "TG",
    "2": "BJ",
    "3": "BF",
    "4": "CI",
    "5": "NE",
    "6": "OT",
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUserName(null);
    setCountry("TG");
    navigate("/");
  };

  useEffect(() => {
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
  }, [lang]);

  // FontAwesome chargé globalement; plus besoin d'injecter le CDN.

  useEffect(() => {
    const updateUser = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const u = JSON.parse(storedUser);
        setUserName(`${u.nom || ""} ${u.prenom || ""}`.trim() || u.name);
        setCountry(countryMap[u.id_pays] || "TG");
        setLang(u.langue || lang);
      }
    };
    updateUser();
  }, []);

  useEffect(() => {
    const refreshCounts = () => {
      setFavoritesCount(getFavoritesCount());
      setCartCount(getCartCount());
    };

    refreshCounts();
    const unsubscribe = subscribeStoreUpdates(refreshCounts);

    return unsubscribe;
  }, []);

  useEffect(() => {
    const close = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("menu-open");
    } else {
      document.body.classList.remove("menu-open");
    }

    return () => document.body.classList.remove("menu-open");
  }, [isOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 1024) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className="header">
      <div className="logo">
        <Link to="/">
          <img src="/images/logo.webp" alt="ISD AFRIK Logo" className="logo-img" />
        </Link>
      </div>

      <button className="hamburger" onClick={() => setIsOpen(!isOpen)}>
        <i className="fas fa-bars"></i>
      </button>

      <button
        type="button"
        className={`nav-overlay ${isOpen ? "open" : ""}`}
        aria-hidden={!isOpen}
        tabIndex={isOpen ? 0 : -1}
        onClick={() => setIsOpen(false)}
      />

      <nav className={`nav ${isOpen ? "open" : ""}`}>
        <div className="nav-mobile-top">
          <strong>Navigation</strong>
          <button type="button" className="nav-close" onClick={() => setIsOpen(false)} aria-label="Fermer le menu">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <Link to="/" className="nav-link" onClick={() => setIsOpen(false)}>
          <i className="fas fa-home nav-icon"></i> {t("nav.home")}
        </Link>
        <Link to="/ingenierie" className="nav-link" onClick={() => setIsOpen(false)}>
          <i className="fas fa-cogs nav-icon"></i> {t("nav.engineering")}
        </Link>
        <Link to="/solutions" className="nav-link" onClick={() => setIsOpen(false)}>
          <i className="fas fa-lightbulb nav-icon"></i> {t("nav.solutions")}
        </Link>
        <Link to="/formations" className="nav-link" onClick={() => setIsOpen(false)}>
          <i className="fas fa-graduation-cap nav-icon"></i> {t("nav.trainings")}
        </Link>
        <Link to="/produits" className="nav-link" onClick={() => setIsOpen(false)}>
          <i className="fas fa-box-open nav-icon"></i> {t("nav.products")}
        </Link>
        <Link to="/projets" className="nav-link" onClick={() => setIsOpen(false)}>
          <i className="fas fa-project-diagram nav-icon"></i> {t("nav.projects")}
        </Link>
        <Link to="/contact" className="nav-link" onClick={() => setIsOpen(false)}>
          <i className="fas fa-envelope nav-icon"></i> {t("nav.contact")}
        </Link>

        <div className="header-quick-actions">
          <Link
            to="/favoris"
            className="quick-icon-btn"
            onClick={() => setIsOpen(false)}
            title="Liste d'envies"
            aria-label="Liste d'envies"
          >
            <i className="fa-regular fa-heart"></i>
            {favoritesCount > 0 && <span className="quick-badge">{favoritesCount}</span>}
          </Link>

          <Link
            to="/panier"
            className="quick-icon-btn"
            onClick={() => setIsOpen(false)}
            title="Panier"
            aria-label="Panier"
          >
            <i className="fa-solid fa-cart-shopping"></i>
            {cartCount > 0 && <span className="quick-badge">{cartCount}</span>}
          </Link>
        </div>

        {!token ? (
          <Link to="/login" className="account-btn login-btn" onClick={() => setIsOpen(false)}>
            <i className="fas fa-sign-in-alt"></i>
            <span>{t("auth.login")}</span>
          </Link>
        ) : (
          <div className="account" ref={accountRef}>
            <div
              className="account-btn"
              onClick={(e) => {
                e.stopPropagation();
                setAccountOpen(!accountOpen);
              }}
            >
              <i className="fas fa-user-circle"></i>
              <span>{userName || t("auth.account")}</span>
              <i className={`fas fa-chevron-${accountOpen ? "up" : "down"}`}></i>
            </div>

            {accountOpen && (
              <ul className="account-menu">
                <li onClick={() => { setIsOpen(false); setAccountOpen(false); navigate("/profile"); }}>
                  <i className="fas fa-id-card"></i> {t("auth.profile")}
                </li>
                <li onClick={() => { setIsOpen(false); setAccountOpen(false); navigate("/mes-commandes"); }}>
                  <i className="fas fa-box"></i> {t("auth.orders")}
                </li>
                <li onClick={() => { setIsOpen(false); setAccountOpen(false); navigate("/mes-produits"); }}>
                  <i className="fas fa-flask"></i> {t("auth.myProducts")}
                </li>
                <li onClick={() => { setIsOpen(false); setAccountOpen(false); navigate("/mes-formations"); }}>
                  <i className="fas fa-chalkboard-teacher"></i> {t("auth.myTrainings")}
                </li>
                <li onClick={() => { setIsOpen(false); setAccountOpen(false); handleLogout(); }}>
                  <i className="fas fa-sign-out-alt"></i> {t("auth.logout")}
                </li>
              </ul>
            )}
          </div>
        )}

        <div className="mobile-selectors">
          <CountrySelector value={country} onChange={setCountry} />
          <LanguageSelector value={lang} onChange={setLang} />
        </div>
      </nav>

      <div className="selectors">
        <CountrySelector value={country} onChange={setCountry} />
        <LanguageSelector value={lang} onChange={setLang} />
      </div>
    </header>
  );
}

export default memo(Header);
