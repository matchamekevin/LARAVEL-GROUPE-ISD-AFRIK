import React from 'react';

export default function Dashboard(){
  const stats = [
    { label: 'Chiffre d\'affaires', value: '250,000 FCFA', icon: 'fa-money-bill', color: '#667eea' },
    { label: 'Utilisateurs', value: '1,342', icon: 'fa-users', color: '#764ba2' },
    { label: 'Commandes', value: '847', icon: 'fa-box', color: '#f093fb' },
  ];

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
          Tableau de bord
        </h1>
        <p style={{
          color: '#6B7280',
          fontSize: '0.95rem',
          margin: 0,
        }}>
          Bienvenue dans votre espace d'administration
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem',
      }}>
        {stats.map((stat, i) => (
          <div key={i} style={{
            background: '#ffffff',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            borderLeft: `5px solid ${stat.color}`,
            transition: 'all 0.3s ease',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
          }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: '0.5rem',
              color: stat.color,
            }}>
              <i className={`fas ${stat.icon}`}></i>
            </div>
            <p style={{
              color: '#6B7280',
              fontSize: '0.9rem',
              margin: '0 0 0.75rem 0',
              fontWeight: 500,
            }}>
              {stat.label}
            </p>
            <p style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#172243',
              margin: 0,
            }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <section style={{
        background: '#ffffff',
        borderRadius: '0.75rem',
        padding: '2rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: '#172243',
          marginBottom: '1rem',
          borderBottom: '2px solid #667eea',
          paddingBottom: '0.75rem',
        }}>
          <i className="fas fa-chart-line" style={{marginRight: '0.5rem'}}></i>Activité récente
        </h2>
        <div style={{
          color: '#6B7280',
          textAlign: 'center',
          padding: '2rem',
        }}>
          <p style={{ margin: '0 0 1rem 0' }}>
            Les graphiques et indicateurs s'afficheront ici.
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem', fontStyle: 'italic' }}>
            Accédez aux autres sections pour voir les données.
          </p>
        </div>
      </section>
    </div>
  );
}
