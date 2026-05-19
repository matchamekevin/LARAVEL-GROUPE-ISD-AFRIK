import React, { useEffect, useMemo, useState } from 'react';
import { me, updateMyProfile, changeMyPassword } from '../api';
import { toastError, toastSuccess, toastInfo } from '../../utils/toast';
import { notifyMutation } from '../../utils/mutationBus';
import '../styles/admin-shared.css';
import '../styles/settings.css';

const INITIAL_PROFILE = {
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
};

const INITIAL_PASSWORD = {
  current_password: '',
  new_password: '',
  new_password_confirmation: '',
};

export default function Settings() {
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [password, setPassword] = useState(INITIAL_PASSWORD);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');



  const fullNamePreview = useMemo(
    () => [profile.prenom, profile.nom].filter(Boolean).join(' ').trim(),
    [profile.prenom, profile.nom]
  );

  useEffect(() => {
    let mounted = true;

    me()
      .then((res) => {
        if (!mounted) return;
        const data = res?.data || {};
        setProfile({
          nom: data.nom || '',
          prenom: data.prenom || '',
          email: data.email || '',
          telephone: data.telephone || '',
        });
      })
      .catch(() => {
        if (!mounted) return;
        setProfile(INITIAL_PROFILE);
        toastError('Impossible de charger le profil.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleProfileChange = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setProfileMessage('');
  };

  const handlePasswordChange = (key, value) => {
    setPassword((prev) => ({ ...prev, [key]: value }));
    setPasswordMessage('');
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMessage('');
    try {
      await updateMyProfile({
        nom: profile.nom,
        prenom: profile.prenom,
        email: profile.email,
        telephone: profile.telephone,
      });
      toastSuccess('Profil mis a jour avec succes.');
      notifyMutation();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Erreur lors de la mise a jour du profil.';
      toastError(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async () => {
    if (!password.current_password || !password.new_password || !password.new_password_confirmation) {
      toastError('Veuillez remplir tous les champs de mot de passe.');
      return;
    }

    if (password.new_password !== password.new_password_confirmation) {
      toastError('La confirmation du mot de passe ne correspond pas.');
      return;
    }

    setSavingPassword(true);
    setPasswordMessage('');
    try {
      await changeMyPassword(password);
      toastSuccess('Mot de passe modifie avec succes.');
      notifyMutation();
      setPassword(INITIAL_PASSWORD);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Erreur lors du changement de mot de passe.';
      toastError(msg);
    } finally {
      setSavingPassword(false);
    }
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
        <p style={{ color: '#6B7280', fontSize: '0.95rem', margin: 0 }}>
          Gere ton profil connecte et ton mot de passe en base de donnees.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '1.5rem',
      }}>
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
            Profil du compte
          </h2>

          {null}

          <div style={{ marginBottom: '1rem', color: '#374151', fontSize: '0.9rem' }}>
            <strong>Nom complet:</strong> {fullNamePreview || 'Non renseigne'}
          </div>
          
          <div style={{marginBottom: '1rem'}}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 600,
              color: '#374151',
              fontSize: '0.9rem',
            }}>
              Nom
            </label>
            <input 
              type="text"
              value={profile.nom}
              onChange={(e) => handleProfileChange('nom', e.target.value)}
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
              Prenom
            </label>
            <input
              type="text"
              value={profile.prenom}
              onChange={(e) => handleProfileChange('prenom', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #D1D5DB',
                borderRadius: '0.5rem',
                fontSize: '1rem',
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
              value={profile.email}
              onChange={(e) => handleProfileChange('email', e.target.value)}
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
              value={profile.telephone}
              onChange={(e) => handleProfileChange('telephone', e.target.value)}
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div style={{ flex: 1 }}>

            </div>
            <button
              onClick={handleSaveProfile}
              disabled={loading || savingProfile}
              style={{
                padding: '0.75rem 1.25rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: loading || savingProfile ? 'not-allowed' : 'pointer',
                opacity: loading || savingProfile ? 0.7 : 1,
              }}
            >
              {savingProfile ? 'Enregistrement...' : 'Enregistrer profil'}
            </button>
          </div>
        </div>

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
            Changer le mot de passe
          </h2>
          
          <div style={{marginBottom: '1rem'}}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>
              Mot de passe actuel
            </label>
            <input
              type="password"
              value={password.current_password}
              onChange={(e) => handlePasswordChange('current_password', e.target.value)}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '1rem' }}
            />
          </div>

          <div style={{marginBottom: '1rem'}}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={password.new_password}
              onChange={(e) => handlePasswordChange('new_password', e.target.value)}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '1rem' }}
            />
          </div>

          <div style={{marginBottom: '1rem'}}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              value={password.new_password_confirmation}
              onChange={(e) => handlePasswordChange('new_password_confirmation', e.target.value)}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '1rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div style={{ flex: 1 }}>

            </div>
            <button
              onClick={handleSavePassword}
              disabled={savingPassword}
              style={{
                padding: '0.75rem 1.25rem',
                background: 'linear-gradient(135deg, #172243 0%, #0f1621 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: savingPassword ? 'not-allowed' : 'pointer',
                opacity: savingPassword ? 0.7 : 1,
              }}
            >
              {savingPassword ? 'Mise a jour...' : 'Changer le mot de passe'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
