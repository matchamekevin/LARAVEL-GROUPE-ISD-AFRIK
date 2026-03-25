import React, { useState } from 'react';
import { login, verify2FA, resend2FA, setAdminToken } from '../api';

function normalizeAuthMessage(err, fallback) {
  const status = err?.response?.status;
  const raw = err?.response?.data?.message || err?.response?.data?.error || '';

  if (typeof raw === 'string') {
    if (raw.includes('These credentials do not match')) return 'Identifiants invalides';
    if (raw.includes('Ces identifiants ne correspondent pas')) return 'Identifiants invalides';
    if (raw.includes('Identifiants invalides')) return 'Identifiants invalides';
  }

  if (status === 401) return 'Identifiants invalides';
  return raw || err?.message || fallback;
}

export default function Login({ onLogin }){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requires2fa, setRequires2fa] = useState(false);
  const [userId, setUserId] = useState(null);
  const [code, setCode] = useState('');
  const [info, setInfo] = useState(null);

  async function handleSubmit(e){
    e.preventDefault();
    setLoading(true); setError(null);
    try{
      // Le backend attend `mot_de_passe` comme nom de champ
      const res = await login({ email, mot_de_passe: password, portal: 'admin' });
      const data = res.data || {};
      if (data.requires_2fa) {
        setRequires2fa(true);
        setUserId(data.user_id);
        setInfo('Code 2FA envoyé par e-mail.');
      } else {
        // connexion réussie sans 2FA
        if (data.token) setAdminToken(data.token);
        if (onLogin) onLogin();
      }
    }catch(err){
      setError(normalizeAuthMessage(err, 'Erreur de connexion'));
    }finally{ setLoading(false); }
  }

  async function handleVerify(e){
    e.preventDefault();
    setLoading(true); setError(null); setInfo(null);
    try{
      const res = await verify2FA({ user_id: userId, code, portal: 'admin' });
      const data = res.data || {};
      if (data.token) setAdminToken(data.token);
      if (onLogin) onLogin();
    }catch(err){
      setError(normalizeAuthMessage(err, 'Code invalide'));
    }finally{ setLoading(false); }
  }

  async function handleResend(){
    setLoading(true); setError(null); setInfo(null);
    try{
      const res = await resend2FA({ user_id: userId, portal: 'admin' });
      setInfo(res.data?.message || 'Nouveau code envoyé');
    }catch(err){
      setError(normalizeAuthMessage(err, 'Erreur en renvoi du code'));
    }finally{ setLoading(false); }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '1rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: '#ffffff',
        borderRadius: '0.75rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #172243 0%, #0f1621 100%)',
          padding: '2rem',
          color: '#ffffff',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.5px' }}>
            Admin Dashboard
          </h1>
          <p style={{ fontSize: '0.9rem', opacity: 0.9, margin: 0 }}>
            Accédez à votre compte
          </p>
        </div>

        <form onSubmit={requires2fa ? handleVerify : handleSubmit} style={{ padding: '2rem' }}>
          {!requires2fa ? (
            <>
              <div style={{marginBottom: 18}}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 600,
                  color: '#374151',
                  fontSize: '0.95rem',
                }}>
                  Email
                </label>
                <input 
                  type="email"
                  value={email} 
                  onChange={e=>setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    borderColor: error ? '#DC2626' : '#D1D5DB',
                  }}
                  onFocus={(e) => e.target.style.outline = 'none'}
                />
              </div>
              <div style={{marginBottom: 12}}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 600,
                  color: '#374151',
                  fontSize: '0.95rem',
                }}>
                  Mot de passe
                </label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e=>setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    borderColor: error ? '#DC2626' : '#D1D5DB',
                  }}
                  onFocus={(e) => e.target.style.outline = 'none'}
                />
              </div>
            </>
          ) : (
            <div style={{marginBottom: 12}}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 600,
                color: '#374151',
                fontSize: '0.95rem',
              }}>
                Code 2FA
              </label>
              <input 
                type="text"
                value={code} 
                onChange={e=>setCode(e.target.value)}
                placeholder="Entrez le code reçu par email"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                }}
                onFocus={(e) => e.target.style.outline = 'none'}
              />
            </div>
          )}

          {error && <div style={{
            color: '#DC2626',
            marginBottom: 12,
            padding: '0.75rem',
            background: '#FEE2E2',
            borderRadius: '0.5rem',
            fontSize: '0.9rem',
            fontWeight: 500,
          }}><i className="fas fa-exclamation-circle" style={{marginRight: '0.3rem'}}></i>{error}</div>}

          {info && <div style={{
            color: '#15803D',
            marginBottom: 12,
            padding: '0.75rem',
            background: '#DCFCE7',
            borderRadius: '0.5rem',
            fontSize: '0.9rem',
            fontWeight: 500,
          }}><i className="fas fa-check-circle" style={{marginRight: '0.3rem'}}></i>{info}</div>}

          {!requires2fa && (
            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #172243 0%, #0f1621 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(23, 34, 67, 0.3)',
                transform: loading ? 'translateY(0)' : 'translateY(0)',
              }}
              onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => !loading && (e.target.style.transform = 'translateY(0)')}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          )}

          {requires2fa && (
            <div style={{display:'flex',gap:8}}>
              <button 
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #172243 0%, #0f1621 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(23, 34, 67, 0.3)',
                }}
              >
                Vérifier
              </button>
              <button 
                type="button"
                onClick={handleResend}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'transparent',
                  color: '#172243',
                  border: '2px solid #172243',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                Renvoyer
              </button>
            </div>
          )}
        </form>

        <div style={{
          padding: '1rem 2rem',
          background: '#F3F4F6',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: '#6B7280',
        }}>
          <i className="fas fa-building" style={{marginRight: '0.3rem'}}></i>ISD AFRIK Admin © 2026
        </div>
      </div>
    </div>
  );
}
