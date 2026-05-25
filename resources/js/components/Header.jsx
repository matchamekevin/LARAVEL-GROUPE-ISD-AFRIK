import React, { useState, useEffect, useRef, memo, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import CountrySelector from "./CountrySelector";
import LanguageSelector from "./LanguageSelector";
import { getCartCount, getFavoritesCount, subscribeStoreUpdates } from "../utils/shopStorage";
import { getApiBase } from "../utils/apiBase";
import tokenService from "../services/tokenService";
import { getStoredCountry, setStoredCountry } from "../utils/country";
import "../styles/header.css";

// FontAwesome est importé via `@fortawesome/fontawesome-free` dans `resources/js/app.jsx`
// Account button: avatar/initials + name below + hover dropdown

function Header() {
  const { t } = useTranslation();

  const [country, setCountry] = useState(getStoredCountry());
  const [lang, setLang] = useState(localStorage.getItem("lang") || "fr");
  const [isOpen, setIsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [userName, setUserName] = useState(null);
  const [userData, setUserData] = useState(null);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const accountRef = useRef();
  const hoverTimeout = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const countryMap = {
    "2185de10-a169-43af-8513-5fa9a2117031": "TG",
  };

  const handleLogout = () => {
    tokenService.clearSession();
    window.dispatchEvent(new Event("userUpdated"));
    setUserName(null);
    setUserData(null);
    setCountry("TG");
    navigate("/");
  };

  const handleCountryChange = (code) => {
    setStoredCountry(code);
    setCountry(code);
  };

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setAccountOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoverTimeout.current = setTimeout(() => setAccountOpen(false), 150);
  }, []);

  useEffect(() => {
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
  }, [lang]);

  // FontAwesome chargé globalement; plus besoin d'injecter le CDN.

  useEffect(() => {
    const updateUser = () => {
      const storedToken = localStorage.getItem("token");
      setToken(storedToken);

      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        setUserName(null);
        setUserData(null);
        setCountry("TG");
        return;
      }

      try {
        const u = JSON.parse(storedUser);
        setUserData(u);
        setUserName(`${u.nom || ""} ${u.prenom || ""}`.trim() || u.name || null);
        setCountry(countryMap[u.id_pays] || "TG");
        if (u.langue) {
          setLang(u.langue);
        }
      } catch {
        setUserName(null);
        setUserData(null);
        setCountry("TG");
      }
    };

    updateUser();

    const handleUserUpdated = () => updateUser();
    const handleStorage = (e) => {
      if (!e || e.key === "token" || e.key === "user") {
        updateUser();
      }
    };

    window.addEventListener("userUpdated", handleUserUpdated);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("userUpdated", handleUserUpdated);
      window.removeEventListener("storage", handleStorage);
    };
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
        <span className="material-icons">menu</span>
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
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="nav-links">
          <Link to="/" className="nav-link" onClick={() => setIsOpen(false)}>
            <span className="material-icons nav-icon">home</span> {t("nav.home")}
          </Link>
          <Link to="/ingenierie" className="nav-link" onClick={() => setIsOpen(false)}>
            <span className="material-icons nav-icon">engineering</span> {t("nav.engineering")}
          </Link>
          <Link to="/solutions" className="nav-link" onClick={() => setIsOpen(false)}>
            <span className="material-icons nav-icon">lightbulb</span> {t("nav.solutions")}
          </Link>
          <Link to="/formations" className="nav-link" onClick={() => setIsOpen(false)}>
            <span className="material-icons nav-icon">school</span> {t("nav.trainings")}
          </Link>
          <Link to="/produits" className="nav-link" onClick={() => setIsOpen(false)}>
            <span className="material-icons nav-icon">inventory</span> {t("nav.products")}
          </Link>
          <Link to="/projets" className="nav-link" onClick={() => setIsOpen(false)}>
            <span className="material-icons nav-icon">account_tree</span> {t("nav.projects")}
          </Link>
          <Link to="/contact" className="nav-link" onClick={() => setIsOpen(false)}>
            <span className="material-icons nav-icon">mail</span> {t("nav.contact")}
          </Link>
        </div>

        <div className="nav-right">
          <div className="header-quick-actions">
            <Link
              to="/favoris"
              className="quick-icon-btn"
              onClick={() => setIsOpen(false)}
              title="Liste d'envies"
              aria-label="Liste d'envies"
            >
              <span className="material-icons">favorite_border</span>
              {favoritesCount > 0 && <span className="quick-badge">{favoritesCount}</span>}
            </Link>

            <Link
              to="/panier"
              className="quick-icon-btn"
              onClick={() => setIsOpen(false)}
              title="Panier"
              aria-label="Panier"
            >
              <span className="material-icons">shopping_cart</span>
              {cartCount > 0 && <span className="quick-badge">{cartCount}</span>}
            </Link>
          </div>

          {!token ? (
            <Link to="/login" className="account-btn login-btn" onClick={() => setIsOpen(false)}>
              <span className="material-icons" style={{fontSize:18,marginRight:6}}>login</span>
              <span>{t("auth.login")}</span>
            </Link>
          ) : (
            <div
              className="account"
              ref={accountRef}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div className="account-trigger">
                <div className="account-avatar">
                  {userData?.avatar ? (
                    <img
                      src={`${getApiBase()}/storage/${userData.avatar}`}
                      alt={userName}
                      className="account-avatar-img"
                    />
                  ) : (
                    <span className="account-avatar-initials">
                      {(userData?.prenom?.[0] || userData?.nom?.[0] || "?").toUpperCase()}
                      {(userData?.prenom?.[0] && userData?.nom?.[0] ? userData.nom[0].toUpperCase() : "")}
                    </span>
                  )}
                </div>
                {userName && <span className="account-name">{userName}</span>}
              </div>

              {accountOpen && (
                <ul className="account-menu">
                  <li className="account-menu-header">
                    <div className="account-menu-avatar">
                      {userData?.avatar ? (
                        <img src={`${getApiBase()}/storage/${userData.avatar}`} alt={userName} className="account-menu-avatar-img" />
                      ) : (
                        <span className="account-menu-avatar-initials">
                          {(userData?.prenom?.[0] || userData?.nom?.[0] || "?").toUpperCase()}
                          {(userData?.prenom?.[0] && userData?.nom?.[0] ? userData.nom[0].toUpperCase() : "")}
                        </span>
                      )}
                    </div>
                    <div className="account-menu-user-info">
                      <strong>{userName}</strong>
                      <span>{userData?.email || ""}</span>
                    </div>
                  </li>
                  <li onClick={() => { setIsOpen(false); setAccountOpen(false); navigate("/profile"); }}>
                    <span className="material-icons">person</span> {t("auth.profile")}
                  </li>
                  <li onClick={() => { setIsOpen(false); setAccountOpen(false); navigate("/mes-commandes"); }}>
                    <span className="material-icons">receipt_long</span> {t("auth.orders")}
                  </li>
                  <li onClick={() => { setIsOpen(false); setAccountOpen(false); navigate("/mes-produits"); }}>
                    <span className="material-icons">inventory</span> {t("auth.myProducts")}
                  </li>
                  <li onClick={() => { setIsOpen(false); setAccountOpen(false); navigate("/mes-formations"); }}>
                    <span className="material-icons">school</span> {t("auth.myTrainings")}
                  </li>
                  <li className="account-menu-divider"></li>
                  <li onClick={() => { setIsOpen(false); setAccountOpen(false); handleLogout(); }}>
                    <span className="material-icons">logout</span> {t("auth.logout")}
                  </li>
                </ul>
              )}
            </div>
          )}

          </div>
          <div className="nav-desktop-selectors">
            <CountrySelector value={country} onChange={handleCountryChange} />
            <LanguageSelector value={lang} onChange={setLang} />
          </div>
          <div className="mobile-selectors">
            <CountrySelector value={country} onChange={handleCountryChange} />
          <LanguageSelector value={lang} onChange={setLang} />
        </div>
      </nav>
    </header>
  );
}

export default memo(Header);
