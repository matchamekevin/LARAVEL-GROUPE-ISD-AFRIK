import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { tokenService } from "../services/tokenService";
import { apiClient } from "../api/axiosConfig";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ToastContainer from "../components/ToastContainer";

export default function MainLayout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const retryCountRef = useRef(0);
    const MAX_RETRIES = 3;
    const VERIFY_INTERVAL = 60000; // 60 secondes (le header gère aussi les sessions)

    useEffect(() => {
        const ignoredPaths = ["/login", "/register", "/forgot-password", "/verify-otp"];
        let intervalId = null;

        async function verifyClientSession() {
            if (document.visibilityState === 'hidden') return;
            const token = tokenService.getToken();
            
            if (!token) {
                return;
            }

            try {
                const res = await apiClient.get('/api/auth/profile', {
                    params: { portal: 'client' },
                });

                const profile = res.data?.user || res.data;

                // ✅ Vérifications correctes (pas strictement false)
                if (!profile) {
                    throw new Error('Profile empty');
                }

                const hasClientAccess = profile.can_access_client !== false && String(profile.statut || '').toLowerCase() === 'actif';

                if (!hasClientAccess) {
                    console.warn('[MainLayout] ⚠️ Accès client révoqué');
                    throw new Error('client-access-revoked');
                }

                // ✅ Mise à jour des données
                tokenService.setUser(profile);
                retryCountRef.current = 0; // Reset retry counter

            } catch (error) {
                const status = error.response?.status;
                const isAuthError = status === 401 || status === 403;

                console.error('[MainLayout] ❌ Erreur vérification:', {
                    status,
                    message: error.response?.data?.message,
                    retryCount: retryCountRef.current,
                });

                // Erreurs d'authentification = déconnexion immédiate
                if (isAuthError) {
                    console.warn('[MainLayout] 🔐 Erreur auth - Déconnexion');
                    tokenService.clearSession();

                    if (!ignoredPaths.includes(location.pathname)) {
                        navigate('/login', {
                            replace: true,
                            state: {
                                from: `${location.pathname}${location.search || ""}`,
                                error: 'Votre session a expiré. Veuillez vous reconnecter.',
                            },
                        });
                    }
                    return;
                }

                // Autres erreurs = retry jusqu'à MAX_RETRIES
                retryCountRef.current++;
                if (retryCountRef.current >= MAX_RETRIES) {
                    console.error(`[MainLayout] ❌ Échec après ${MAX_RETRIES} tentatives - Déconnexion`);
                    tokenService.clearSession();

                    if (!ignoredPaths.includes(location.pathname)) {
                        navigate('/login', {
                            replace: true,
                            state: {
                                from: `${location.pathname}${location.search || ""}`,
                                error: 'Connexion perdue. Veuillez vous reconnecter.',
                            },
                        });
                    }
                }
            }
        }

        // Vérifier au montage sur onglet visible, puis périodiquement
        if (document.visibilityState !== 'hidden') verifyClientSession();
        intervalId = window.setInterval(verifyClientSession, VERIFY_INTERVAL);

        // Listener pour les événements de token
        const handleTokenExpired = () => {
            tokenService.clearSession();
            navigate('/login', {
                replace: true,
                state: {
                    from: `${location.pathname}${location.search || ""}`,
                    error: 'Votre token a expiré.',
                },
            });
        };

        const handleAccessDenied = () => {
            tokenService.clearSession();
            navigate('/login', {
                replace: true,
                state: {
                    from: `${location.pathname}${location.search || ""}`,
                    error: 'Accès refusé.',
                },
            });
        };

        window.addEventListener('token-expired', handleTokenExpired);
        window.addEventListener('access-denied', handleAccessDenied);

        return () => {
            if (intervalId) window.clearInterval(intervalId);
            window.removeEventListener('token-expired', handleTokenExpired);
            window.removeEventListener('access-denied', handleAccessDenied);
        };
    }, [location.pathname, location.search, navigate]);

    return (
        <div className="site-shell min-h-screen flex flex-col font-[Corbel]">
            <Header />
            <ToastContainer />
            <main className="site-main flex-grow">{children}</main>
            <Footer />
        </div>
    );
}
