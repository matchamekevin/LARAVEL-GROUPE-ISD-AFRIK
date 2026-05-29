import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Settings from './pages/Settings';
import Formations from './pages/Formations';
import Messages from './pages/Messages';
import FormMailRoutes from './pages/FormMailRoutes';
import CatalogueAdmin from './pages/CatalogueAdmin';
import MarketingAdmin from './pages/MarketingAdmin';
import PromotionsAdmin from './pages/PromotionsAdmin';
import TestimonialsAdmin from './pages/TestimonialsAdmin';
import CollaboratorsAdmin from './pages/CollaboratorsAdmin';
import PartnersAdmin from './pages/PartnersAdmin';
import GeovisionHomeAdmin from './pages/GeovisionHomeAdmin';
import IngenieriePageAdmin from './pages/IngenieriePageAdmin';
import ProjetsAdmin from './pages/ProjetsAdmin';
import Login from './pages/Login';
import ScrollToTop from '../components/ScrollToTop';
import { ADMIN_NAV_ITEMS } from './config/navigation';

import { clearAdminToken, hasAdminToken, logout, me } from './api';
import "../styles/responsive.css";

const navListItemStyle = { marginBottom: '0.75rem' };
const navIconStyle = { marginRight: '0.5rem' };

function navLinkStyle({ isActive }) {
  return {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    color: isActive ? '#ffffff' : '#D1D5DB',
    textDecoration: 'none',
    borderRadius: '0.5rem',
    transition: 'all 0.3s ease',
    borderLeft: `3px solid ${isActive ? '#667eea' : 'transparent'}`,
    fontSize: '0.95rem',
    fontWeight: 500,
    background: isActive ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
  };
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const el = document.querySelector(".init-loader");
    if (el) {
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 500);
    }
  }, []);

  useEffect(() => {
    const handleSessionInvalidated = () => {
      setUser(null);
      setAuthReady(true);
      if (typeof window !== 'undefined' && window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    };

    window.addEventListener('admin-session-invalidated', handleSessionInvalidated);

    let mounted = true;
    if (!hasAdminToken()) {
      setUser(null);
      setAuthReady(true);
      window.removeEventListener('admin-session-invalidated', handleSessionInvalidated);
      return () => {
        mounted = false;
      };
    }

    me()
      .then(res => {
        if (!mounted) return;
        const profile = res.data;
        if (
          !profile
          || profile.can_access_admin === false
          || profile.is_admin === false
          || String(profile.statut || '').toLowerCase() !== 'actif'
        ) {
          setUser(null);
          return;
        }
        setUser(profile);
      })
      .catch(() => { if (mounted) setUser(null); })
      .finally(() => { if (mounted) setAuthReady(true); });
    return () => {
      mounted = false;
      window.removeEventListener('admin-session-invalidated', handleSessionInvalidated);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(() => {
      me()
        .then((res) => {
          const profile = res.data;
          if (
            !profile
            || profile.can_access_admin === false
            || profile.is_admin === false
            || String(profile.statut || '').toLowerCase() !== 'actif'
          ) {
            throw new Error('admin-session-revoked');
          }
          setUser(profile);
        })
        .catch(() => {
          clearAdminToken();
          setUser(null);
          window.location.href = '/admin/login';
        });
    }, 10000);

    return () => clearInterval(intervalId);
  }, [user]);

  if (!authReady) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa' }}>
        <aside style={{ width: 280, background: 'linear-gradient(180deg,#172243,#0f1621)', padding: '2rem 1.5rem', flexShrink: 0 }}>
          <div style={{ height: 32, width: '70%', borderRadius: 10, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'init-shimmer 1.4s infinite' }} />
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'init-shimmer 1.4s infinite' }} />
                <div style={{ height: 18, width: `${50 + i * 5}%`, borderRadius: 10, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'init-shimmer 1.4s infinite' }} />
              </div>
            ))}
          </div>
        </aside>
        <main style={{ flex: 1, padding: 40, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ height: 32, width: '40%', borderRadius: 10, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'init-shimmer 1.4s infinite' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 20 }}>
            {[1,2].map(i => (
              <div key={i} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ height: 18, width: '60%', borderRadius: 10, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'init-shimmer 1.4s infinite' }} />
                <div style={{ height: 18, borderRadius: 10, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'init-shimmer 1.4s infinite' }} />
                <div style={{ height: 18, width: '50%', borderRadius: 10, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'init-shimmer 1.4s infinite' }} />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <BrowserRouter basename="/admin">
        <ScrollToTop />
        <Routes>
          <Route path="/login" element={<Login onLogin={() => window.location.href = '/admin'} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter basename="/admin">
      <ScrollToTop />
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#f8f9fa',
      }}>
        <aside style={{
          width: '280px',
          flexShrink: 0,
          background: 'linear-gradient(180deg, #172243 0%, #0f1621 100%)',
          color: '#ffffff',
          padding: '2rem 1.5rem',
          overflowY: 'auto',
          position: 'sticky',
          top: 0,
          height: '100vh',
          boxShadow: '4px 0 12px rgba(0,0,0,0.15)',
        }}>
          <div style={{
            marginBottom: '2rem',
            textAlign: 'center',
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              margin: '0 0 0.5rem 0',
              color: '#ffffff',
              WebkitTextFillColor: 'initial',
            }}>
              GROUPE ISD AFRIK
            </h2>
            <p style={{
              fontSize: '0.8rem',
              color: '#ffffff',
              margin: 0,
              fontStyle: 'italic',
            }}>
              Admin Dashboard
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '1rem',
            borderRadius: '0.75rem',
            marginBottom: '2rem',
            borderLeft: '3px solid #667eea',
          }}>
            <p style={{
              fontSize: '0.85rem',
              color: '#D1D5DB',
              margin: '0 0 0.5rem 0',
              fontWeight: 500,
            }}>
              <i className="fas fa-user" style={{marginRight: '0.3rem'}}></i>Connecté
            </p>
            <p style={{
              fontSize: '0.95rem',
              color: '#ffffff',
              margin: 0,
              fontWeight: 700,
              wordBreak: 'break-word',
            }}>
              {user?.name || user?.email}
            </p>
          </div>

	          <nav>
	            <ul style={{
	              listStyle: 'none',
	              margin: 0,
	              padding: 0,
	            }}>
                {ADMIN_NAV_ITEMS.map((item) => (
                  <li key={item.to} style={navListItemStyle}>
                    <NavLink to={item.to} style={navLinkStyle}>
                      <i className={item.icon} style={navIconStyle}></i>{item.label}
                    </NavLink>
                  </li>
                ))}
	            </ul>
	          </nav>

          <div style={{
            marginTop: 'auto',
            paddingTop: '2rem',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}>
            <button 
              onClick={async () => {
                try {
                  await logout();
                } catch (e) {
                  // On purge quand meme la session locale si l'API logout echoue.
                }
                clearAdminToken();
                window.location.href = '/admin/login';
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'transparent',
                color: '#D1D5DB',
                border: '2px solid #D1D5DB',
                borderRadius: '0.5rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                e.target.style.color = '#ffffff';
                e.target.style.borderColor = 'transparent';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#D1D5DB';
                e.target.style.borderColor = '#D1D5DB';
              }}
            >
              <i className="fas fa-sign-out-alt" style={{marginRight: '0.3rem'}}></i>Se déconnecter
            </button>
          </div>
        </aside>

        <main style={{
          flex: 1,
          minWidth: 0,
          overflowX: 'hidden',
          background: '#f8f9fa',
        }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/products" element={<Products />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/formations" element={<Formations />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/email-routing" element={<FormMailRoutes />} />
            <Route path="/catalogue" element={<Navigate to="/catalogue/familles" replace />} />
            <Route path="/catalogue/:section" element={<CatalogueAdmin />} />
            <Route path="/ventes-assets" element={<Navigate to="/promotions" replace />} />
            <Route path="/promotions" element={<PromotionsAdmin />} />
            <Route path="/marketing" element={<MarketingAdmin />} />
            <Route path="/testimonials" element={<TestimonialsAdmin />} />
            <Route path="/collaborators" element={<CollaboratorsAdmin />} />
            <Route path="/partners" element={<PartnersAdmin />} />
            <Route path="/home-geovision-sections" element={<GeovisionHomeAdmin />} />
            <Route path="/projets" element={<ProjetsAdmin />} />
            <Route path="/ingenierie-page" element={<IngenieriePageAdmin />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
