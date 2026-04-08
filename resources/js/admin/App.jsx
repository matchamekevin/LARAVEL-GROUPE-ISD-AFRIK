import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Settings from './pages/Settings';
import Formations from './pages/Formations';
import Messages from './pages/Messages';
import CatalogueAdmin from './pages/CatalogueAdmin';
import MarketingAdmin from './pages/MarketingAdmin';
import PromotionsAdmin from './pages/PromotionsAdmin';
import TestimonialsAdmin from './pages/TestimonialsAdmin';
import CollaboratorsAdmin from './pages/CollaboratorsAdmin';
import PartnersAdmin from './pages/PartnersAdmin';
import Login from './pages/Login';
import Loader from './components/Loader';

import { clearAdminToken, hasAdminToken, logout, me } from './api';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleSessionInvalidated = () => {
      setUser(null);
      setLoading(false);
      if (typeof window !== 'undefined' && window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    };

    window.addEventListener('admin-session-invalidated', handleSessionInvalidated);

    let mounted = true;
    if (!hasAdminToken()) {
      setUser(null);
      setLoading(false);
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
      .finally(() => { if (mounted) setLoading(false); });
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

  if (loading) return <Loader />;

  if (!user) {
    return (
      <BrowserRouter basename="/admin">
        <Routes>
          <Route path="/login" element={<Login onLogin={() => window.location.href = '/admin'} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter basename="/admin">
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#f8f9fa',
      }}>
        <aside style={{
          width: '280px',
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
              <li style={{marginBottom: '0.75rem'}}>
                <NavLink to="/" style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  color: isActive ? '#ffffff' : '#D1D5DB',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  transition: 'all 0.3s ease',
                  borderLeft: '3px solid ' + (isActive ? '#667eea' : 'transparent'),
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  background: isActive ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                })}>
                  <i className="fas fa-chart-line" style={{marginRight: '0.5rem'}}></i>Dashboard
                </NavLink>
              </li>
              <li style={{marginBottom: '0.75rem'}}>
                <NavLink to="/users" style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  color: isActive ? '#ffffff' : '#D1D5DB',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  transition: 'all 0.3s ease',
                  borderLeft: '3px solid ' + (isActive ? '#667eea' : 'transparent'),
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  background: isActive ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                })}>
                  <i className="fas fa-users" style={{marginRight: '0.5rem'}}></i>Utilisateurs
                </NavLink>
              </li>
              <li style={{marginBottom: '0.75rem'}}>
                <NavLink to="/products" style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  color: isActive ? '#ffffff' : '#D1D5DB',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  transition: 'all 0.3s ease',
                  borderLeft: '3px solid ' + (isActive ? '#667eea' : 'transparent'),
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  background: isActive ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                })}>
                  <i className="fas fa-box" style={{marginRight: '0.5rem'}}></i>Produits
                </NavLink>
              </li>
              <li style={{marginBottom: '0.75rem'}}>
                <NavLink to="/orders" style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  color: isActive ? '#ffffff' : '#D1D5DB',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  transition: 'all 0.3s ease',
                  borderLeft: '3px solid ' + (isActive ? '#667eea' : 'transparent'),
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  background: isActive ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                })}>
                  <i className="fas fa-shopping-cart" style={{marginRight: '0.5rem'}}></i>Commandes
                </NavLink>
              </li>
              <li style={{marginBottom: '0.75rem'}}>
                <NavLink to="/formations" style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  color: isActive ? '#ffffff' : '#D1D5DB',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  transition: 'all 0.3s ease',
                  borderLeft: '3px solid ' + (isActive ? '#667eea' : 'transparent'),
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  background: isActive ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                })}>
                  <i className="fas fa-graduation-cap" style={{marginRight: '0.5rem'}}></i>Formations
                </NavLink>
              </li>
              <li style={{marginBottom: '0.75rem'}}>
                <NavLink to="/messages" style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  color: isActive ? '#ffffff' : '#D1D5DB',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  transition: 'all 0.3s ease',
                  borderLeft: '3px solid ' + (isActive ? '#667eea' : 'transparent'),
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  background: isActive ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                })}>
                  <i className="fas fa-envelope" style={{marginRight: '0.5rem'}}></i>Messages
                </NavLink>
              </li>
              <li style={{marginBottom: '0.75rem'}}>
                <NavLink to="/catalogue" style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  color: isActive ? '#ffffff' : '#D1D5DB',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  transition: 'all 0.3s ease',
                  borderLeft: '3px solid ' + (isActive ? '#667eea' : 'transparent'),
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  background: isActive ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                })}>
                  <i className="fas fa-puzzle-piece" style={{marginRight: '0.5rem'}}></i>Catalogue
                </NavLink>
              </li>
              <li style={{marginBottom: '0.75rem'}}>
                <NavLink to="/promotions" style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  color: isActive ? '#ffffff' : '#D1D5DB',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  transition: 'all 0.3s ease',
                  borderLeft: '3px solid ' + (isActive ? '#667eea' : 'transparent'),
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  background: isActive ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                })}>
                  <i className="fas fa-images" style={{marginRight: '0.5rem'}}></i>Promotions
                </NavLink>
              </li>
              <li style={{marginBottom: '0.75rem'}}>
                <NavLink to="/marketing" style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  color: isActive ? '#ffffff' : '#D1D5DB',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  transition: 'all 0.3s ease',
                  borderLeft: '3px solid ' + (isActive ? '#667eea' : 'transparent'),
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  background: isActive ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                })}>
                  <i className="fas fa-bullhorn" style={{marginRight: '0.5rem'}}></i>Marketing Accueil
                </NavLink>
              </li>
              <li style={{marginBottom: '0.75rem'}}>
                <NavLink to="/testimonials" style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  color: isActive ? '#ffffff' : '#D1D5DB',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  transition: 'all 0.3s ease',
                  borderLeft: '3px solid ' + (isActive ? '#667eea' : 'transparent'),
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  background: isActive ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                })}>
                  <i className="fas fa-comments" style={{marginRight: '0.5rem'}}></i>Avis Clients
                </NavLink>
              </li>
              <li style={{marginBottom: '0.75rem'}}>
                <NavLink to="/collaborators" style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  color: isActive ? '#ffffff' : '#D1D5DB',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  transition: 'all 0.3s ease',
                  borderLeft: '3px solid ' + (isActive ? '#667eea' : 'transparent'),
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  background: isActive ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                })}>
                  <i className="fas fa-handshake" style={{marginRight: '0.5rem'}}></i>Collaborateurs
                </NavLink>
              </li>
              <li style={{marginBottom: '0.75rem'}}>
                <NavLink to="/partners" style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  color: isActive ? '#ffffff' : '#D1D5DB',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  transition: 'all 0.3s ease',
                  borderLeft: '3px solid ' + (isActive ? '#667eea' : 'transparent'),
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  background: isActive ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                })}>
                  <i className="fas fa-building" style={{marginRight: '0.5rem'}}></i>Partenaires
                </NavLink>
              </li>
              <li style={{marginBottom: '0.75rem'}}>
                <NavLink to="/settings" style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  color: isActive ? '#ffffff' : '#D1D5DB',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  transition: 'all 0.3s ease',
                  borderLeft: '3px solid ' + (isActive ? '#667eea' : 'transparent'),
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  background: isActive ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                })}>
                  <i className="fas fa-gear" style={{marginRight: '0.5rem'}}></i>Paramètres
                </NavLink>
              </li>
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
          overflowY: 'auto',
          background: '#f8f9fa',
        }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/products" element={<Products />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/formations" element={<Formations />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/catalogue" element={<CatalogueAdmin />} />
            <Route path="/ventes-assets" element={<Navigate to="/promotions" replace />} />
            <Route path="/promotions" element={<PromotionsAdmin />} />
            <Route path="/marketing" element={<MarketingAdmin />} />
            <Route path="/testimonials" element={<TestimonialsAdmin />} />
            <Route path="/collaborators" element={<CollaboratorsAdmin />} />
            <Route path="/partners" element={<PartnersAdmin />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
