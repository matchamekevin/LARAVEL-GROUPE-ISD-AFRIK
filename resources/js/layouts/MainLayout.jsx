import React, { useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ToastContainer from "../components/ToastContainer";

function resolveApiBase() {
    if (typeof window !== "undefined") {
        const { protocol, hostname } = window.location;
        if (import.meta.env.VITE_API_BASE) {
            const envBase = import.meta.env.VITE_API_BASE.replace(/\/$/, "");
            const envLooksLocal = /localhost|127\.0\.0\.1/i.test(envBase);
            const hostIsLocal = ["localhost", "127.0.0.1"].includes(hostname);
            if (!envLooksLocal || hostIsLocal) return envBase;
        }
        if (["localhost", "127.0.0.1"].includes(hostname)) return `${protocol}//${hostname}:8000`;
        return window.location.origin;
    }

    return "";
}

function clearClientSession() {
    try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("pays");
    } catch (e) {
        // ignore if localStorage is unavailable
    }

    window.dispatchEvent(new Event("userUpdated"));
}

export default function MainLayout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const ignoredPaths = ["/login", "/register", "/forgot-password"];
        const apiBase = resolveApiBase();

        async function verifyClientSession() {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const res = await axios.get(`${apiBase}/api/auth/profile`, {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    params: {
                        portal: "client",
                    },
                });

                const profile = res.data?.user || res.data;
                if (!profile || profile.can_access_client === false || String(profile.statut || "").toLowerCase() !== "actif") {
                    throw new Error("client-session-revoked");
                }

                localStorage.setItem("user", JSON.stringify(profile));
            } catch (error) {
                clearClientSession();

                if (!ignoredPaths.includes(location.pathname)) {
                    navigate("/login", {
                        replace: true,
                        state: { error: "Votre accès client a été retiré. Veuillez vous reconnecter si nécessaire." },
                    });
                }
            }
        }

        verifyClientSession();
        const intervalId = window.setInterval(verifyClientSession, 10000);
        const syncHandler = () => verifyClientSession();
        window.addEventListener("userUpdated", syncHandler);

        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener("userUpdated", syncHandler);
        };
    }, [location.pathname, navigate]);

    return (
        <div className="site-shell min-h-screen flex flex-col font-[Corbel]">
            <Header />
            <ToastContainer />
            <main className="site-main flex-grow">{children}</main>
            <Footer />
        </div>
    );
}
