import React, { useState } from 'react';

export default function Settings(){
  const [settings, setSettings] = useState({
    siteName: 'ISD AFRIK',
    email: 'admin@isdafrik.com',
    phone: '+221 77 000 0000',
    notification: true,
    darkMode: false,
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{
        marginBottom: '2rem',
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 800,
          color: '#172243',
          margin: '0 0 0.5rem 0',
        }}>
          <i className="fas fa-gear" style={{marginRight: '0.5rem'}}></i>Paramètres
        </h1>
        <p style={{
          color: '#6B7280',
          fontSize: '0.95rem',
          margin: 0,
        }}>
          Configurez los paramètres généraux de votre administration
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '1.5rem',
      }}>
        {/* Général */}
        <div style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          borderTop: '4px solid #667eea',
        }}>
          <h2 style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#172243',
            marginBottom: '1.5rem',
          }}>
            Informations Générales
          </h2>
          
          <div style={{marginBottom: '1rem'}}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 600,
              color: '#374151',
              fontSize: '0.9rem',
            }}>
              Nom du site
            </label>
            <input 
              type="text"
              value={settings.siteName}
              onChange={(e) => handleChange('siteName', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #D1D5DB',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#D1D5DB';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{marginBottom: '1rem'}}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 600,
              color: '#374151',
              fontSize: '0.9rem',
            }}>
              Email
            </label>
            <input 
              type="email"
              value={settings.email}
              onChange={(e) => handleChange('email', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #D1D5DB',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#D1D5DB';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{marginBottom: '1rem'}}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 600,
              color: '#374151',
              fontSize: '0.9rem',
            }}>
              Téléphone
            </label>
            <input 
              type="tel"
              value={settings.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #D1D5DB',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#D1D5DB';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* Préférences */}
        <div style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          borderTop: '4px solid #764ba2',
        }}>
          <h2 style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#172243',
            marginBottom: '1.5rem',
          }}>
            Préférences
          </h2>
          
          <div style={{marginBottom: '1.5rem'}}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <label style={{
                fontWeight: 600,
                color: '#374151',
                fontSize: '0.95rem',
              }}>
                <i className="fas fa-bell" style={{marginRight: '0.5rem'}}></i>Notifications
              </label>
              <input 
                type="checkbox"
                checked={settings.notification}
                onChange={(e) => handleChange('notification', e.target.checked)}
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  accentColor: '#667eea',
                }}
              />
            </div>
            <p style={{
              fontSize: '0.85rem',
              color: '#6B7280',
              margin: '0.5rem 0 0 0',
            }}>
              Recevez des notifications importantes
            </p>
          </div>

          <div style={{marginBottom: '0'}}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <label style={{
                fontWeight: 600,
                color: '#374151',
                fontSize: '0.95rem',
              }}>
                <i className="fas fa-moon" style={{marginRight: '0.5rem'}}></i>Mode sombre
              </label>
              <input 
                type="checkbox"
                checked={settings.darkMode}
                onChange={(e) => handleChange('darkMode', e.target.checked)}
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  accentColor: '#667eea',
                }}
              />
            </div>
            <p style={{
              fontSize: '0.85rem',
              color: '#6B7280',
              margin: '0.5rem 0 0 0',
            }}>
              Activer le mode sombre (à venir)
            </p>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '2rem',
        display: 'flex',
        gap: '1rem',
        justifyContent: 'flex-end',
      }}>
        {saved && (
          <div style={{
            color: '#15803D',
            padding: '0.75rem 1.5rem',
            background: '#DCFCE7',
            borderRadius: '0.5rem',
            fontWeight: 600,
            fontSize: '0.95rem',
          }}>
            <i className="fas fa-check" style={{marginRight: '0.3rem'}}></i>Paramètres enregistrés
          </div>
        )}
        <button 
          onClick={handleSave}
          style={{
            padding: '0.75rem 2rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
          }}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          <i className="fas fa-save" style={{marginRight: '0.3rem'}}></i>Enregistrer
        </button>
      </div>
    </div>
  );
}
