import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Settings from './pages/Settings';
import Formations from './pages/Formations';
import Messages from './pages/Messages';
import CatalogueAdmin from './pages/CatalogueAdmin';
import MarketingAdmin from './pages/MarketingAdmin';
import AssetsVentesAdmin from './pages/AssetsVentesAdmin';
import Login from './pages/Login';
import { useLocation, useNavigate } from 'react-router-dom';

function RedirectIfLogin() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === '/login') {
      navigate('/', { replace: true });
    }
  }, [location, navigate]);

  return null;
}
import { me } from './api';
import { logout } from './api';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    me()
      .then(res => { if (mounted) setUser(res.data); })
      .catch(() => { if (mounted) setUser(null); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) return <div style={{padding:24}}>Chargement...</div>;

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
        <RedirectIfLogin />
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
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              ISD AFRIK
            </h2>
            <p style={{
              fontSize: '0.8rem',
              color: '#9CA3AF',
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
              👤 Connecté
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
                <Link to="/" style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  color: '#D1D5DB',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  transition: 'all 0.3s ease',
                  borderLeft: '3px solid transparent',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                  e.currentTarget.style.borderLeftColor = '#667eea';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderLeftColor = 'transparent';
                  e.currentTarget.style.color = '#D1D5DB';
                }}>
                  📊 Dashboard
                </Link>
              </li>
              <li style={{marginBottom: '0.75rem'}}>
                <Link to="/users" style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  color: '#D1D5DB',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  transition: 'all 0.3s ease',
                  borderLeft: '3px solid transparent',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                  e.currentTarget.style.borderLeftColor = '#667eea';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderLeftColor = 'transparent';
                  e.currentTarget.style.color = '#D1D5DB';
                }}>
                  👥 Utilisateurs
                </Link>
              </li>
              <li style={{marginBottom: '0.75rem'}}>
                <Link to="/products" style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  color: '#D1D5DB',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  transition: 'all 0.3s ease',
                  borderLeft: '3px solid transparent',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                  e.currentTarget.style.borderLeftColor = '#667eea';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderLeftColor = 'transparent';
                  e.currentTarget.style.color = '#D1D5DB';
                }}>
                  📦 Produits
                </Link>
              </li>
              <li style={{marginBottom: '0.75rem'}}>
                <Link to="/orders" style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  color: '#D1D5DB',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  transition: 'all 0.3s ease',
                  borderLeft: '3px solid transparent',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                  e.currentTarget.style.borderLeftColor = '#667eea';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderLeftColor = 'transparent';
                  e.currentTarget.style.color = '#D1D5DB';
                }}>
                  🛒 Commandes
                </Link>
              </li>
              <li style={{marginBottom: '0.75rem'}}>
                <Link to="/formations" style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  color: '#D1D5DB',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  transition: 'all 0.3s ease',
                  borderLeft: '3px solid transparent',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                  e.currentTarget.style.borderLeftColor = '#667eea';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderLeftColor = 'transparent';
                  e.currentTarget.style.color = '#D1D5DB';
                }}>
                  🎓 Formations
                </Link>
              </li>
              <li style={{marginBottom: '0.75rem'}}>
                <Link to="/messages" style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  color: '#D1D5DB',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  transition: 'all 0.3s ease',
                  borderLeft: '3px solid transparent',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                  e.currentTarget.style.borderLeftColor = '#667eea';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderLeftColor = 'transparent';
                  e.currentTarget.style.color = '#D1D5DB';
                }}>
                  ✉️ Messages
                </Link>
              </li>
              <li style={{marginBottom: '0.75rem'}}>
                <Link to="/catalogue" style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  color: '#D1D5DB',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  transition: 'all 0.3s ease',
                  borderLeft: '3px solid transparent',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                  e.currentTarget.style.borderLeftColor = '#667eea';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderLeftColor = 'transparent';
                  e.currentTarget.style.color = '#D1D5DB';
                }}>
                  🧩 Catalogue
                </Link>
              </li>
              <li style={{marginBottom: '0.75rem'}}>
                <Link to="/ventes-assets" style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  color: '#D1D5DB',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  transition: 'all 0.3s ease',
                  borderLeft: '3px solid transparent',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                  e.currentTarget.style.borderLeftColor = '#667eea';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderLeftColor = 'transparent';
                  e.currentTarget.style.color = '#D1D5DB';
                }}>
                  💰 Ventes & Assets
                </Link>
              </li>
              <li style={{marginBottom: '0.75rem'}}>
                <Link to="/marketing" style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  color: '#D1D5DB',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  transition: 'all 0.3s ease',
                  borderLeft: '3px solid transparent',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                  e.currentTarget.style.borderLeftColor = '#667eea';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderLeftColor = 'transparent';
                  e.currentTarget.style.color = '#D1D5DB';
                }}>
                  📣 Marketing
                </Link>
              </li>
              <li style={{marginBottom: '0.75rem'}}>
                <Link to="/settings" style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  color: '#D1D5DB',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  transition: 'all 0.3s ease',
                  borderLeft: '3px solid transparent',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                  e.currentTarget.style.borderLeftColor = '#667eea';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderLeftColor = 'transparent';
                  e.currentTarget.style.color = '#D1D5DB';
                }}>
                  ⚙️ Paramètres
                </Link>
              </li>
            </ul>
          </nav>

          <div style={{
            marginTop: 'auto',
            paddingTop: '2rem',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}>
            <button 
              onClick={async ()=>{ await logout(); window.location.reload(); }}
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
              🚪 Se déconnecter
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
            <Route path="/ventes-assets" element={<AssetsVentesAdmin />} />
            <Route path="/marketing" element={<MarketingAdmin />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
