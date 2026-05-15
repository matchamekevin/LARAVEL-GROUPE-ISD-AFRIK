import React, { lazy, Suspense } from "react";
import axios from "axios";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import MainLayout from "./layouts/MainLayout";
import AutoRefreshProvider from "./providers/AutoRefreshProvider";
import Loader from "./components/Loader";
import ScrollToTop from "./components/ScrollToTop";
import { PAGE_ALIASES, PUBLIC_APP_ROUTES } from "./routes/publicRoutes";

import "../css/app.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./i18n";
import "./styles/global.css";
import "./styles/marketing-premium.css";
import "./styles/auth.css";
import "./styles/search-bar.css";
import "./styles/responsive.css";

// Compat: certaines dépendances attendent un global `process.env`.
// Vite expose les variables via `import.meta.env`; on crée un shim
// minimal pour éviter `ReferenceError: process is not defined` en dev.
if (typeof window !== 'undefined' && typeof window.process === 'undefined') {
    // eslint-disable-next-line no-undef
    window.process = { env: import.meta.env };
}

// Toujours envoyer les cookies avec axios (Sanctum, sessions)
axios.defaults.withCredentials = true;

// Dynamic page loader using Vite's import.meta.glob
const pagesMap = import.meta.glob('./pages/**/*.jsx');

const lazyComponentCache = {};

function getLazyComponent(name) {
    const resolvedName = PAGE_ALIASES[name] || name;
    if (lazyComponentCache[resolvedName]) {
        return lazyComponentCache[resolvedName];
    }

    const loader =
        pagesMap[`./pages/${resolvedName}.jsx`] ||
        pagesMap[`./pages/${resolvedName}/index.jsx`];

    if (!loader) {
        return null;
    }

    const Component = lazy(loader);
    lazyComponentCache[resolvedName] = Component;
    return Component;
}

function LazyPage({ name }) {
    const Component = getLazyComponent(name);
    if (!Component) {
        return <div style={{ padding: 20 }}>Page introuvable: {name}</div>;
    }
    return (
        <Component />
    );
}

function App() {
    return (
        <BrowserRouter>
            <Toaster position="top-right" reverseOrder={false} />
            <MainLayout>
                {/* Gestion unifiée du scroll: top sur navigation normale, restauration sur back/forward */}
                  <ScrollToTop />
                <Suspense fallback={<Loader variant="spinner" size="md" />}>
                    <Routes>
                        {PUBLIC_APP_ROUTES.map(({ path, page }) => (
                            <Route key={path} path={path} element={<LazyPage name={page} />} />
                        ))}
                    </Routes>
                </Suspense>
            </MainLayout>
        </BrowserRouter>
    );
}

// Montage défensif : vérifie que l'élément cible existe, sinon attend le DOMContentLoaded
function mountApp() {
    const container = document.getElementById("react-root");
    if (!container) {
        console.error("React root element '#react-root' not found. Waiting for DOMContentLoaded...");
        document.addEventListener(
            "DOMContentLoaded",
            () => {
                const el = document.getElementById("react-root");
                if (!el) {
                    console.error("React root element '#react-root' still not found after DOMContentLoaded.");
                    return;
                }
                ReactDOM.createRoot(el).render(
                    <AutoRefreshProvider>
                        <App />
                    </AutoRefreshProvider>
                );
            },
            { once: true }
        );
        return;
    }

    ReactDOM.createRoot(container).render(
        <AutoRefreshProvider>
            <App />
        </AutoRefreshProvider>
    );
}

mountApp();
