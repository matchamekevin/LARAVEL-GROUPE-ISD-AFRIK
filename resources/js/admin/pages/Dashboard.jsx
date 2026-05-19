import React, { useEffect, useMemo, useState } from 'react';
import { getDashboardSummary, warmAdminCaches } from '../api';
import { useLivePolling } from '../../hooks/useLivePolling';
import { toastError } from '../../utils/toast';

const CURRENCY = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

const NUMBER = new Intl.NumberFormat('fr-FR');

const EMPTY_SUMMARY = {
  users: 0,
  orders: 0,
  payments: 0,
  paidPayments: 0,
  revenue: 0,
  pendingOrders: 0,
  products: 0,
  formations: 0,
  messages: 0,
  revendeurDemandes: 0,
  devisPrestations: 0,
  marketingCardsCount: 0,
  homePromotionsCount: 0,
  testimonials: 0,
  collaborators: 0,
  partners: 0,
  recentActivity: [],
  topCustomers: [],
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);
      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          warmAdminCaches();
        }, 0);
      } else {
        warmAdminCaches();
      }

      try {
        const res = await getDashboardSummary();

        if (!mounted) return;

        const data = res?.data || {};
        setSummary({
          ...EMPTY_SUMMARY,
          ...data,
          recentActivity: Array.isArray(data.recentActivity) ? data.recentActivity : [],
        });
      } catch (err) {
        if (mounted) {
          toastError('Le tableau de bord n\'a pas pu être chargé. Les caches admin restent disponibles.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, [refreshToken]);

  const backgroundLoadDashboard = async () => {
    try {
      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          warmAdminCaches();
        }, 0);
      } else {
        warmAdminCaches();
      }

      const res = await getDashboardSummary();
      const data = res?.data || {};
      setSummary({
        ...EMPTY_SUMMARY,
        ...data,
        recentActivity: Array.isArray(data.recentActivity) ? data.recentActivity : [],
      });
    } catch (err) {
      // silent background refresh: keep previous summary and avoid showing error
    }
  };

  useLivePolling(
    () => backgroundLoadDashboard(),
    {
      intervalMs: 5000,
      enabled: true,
    }
  );

  const mergedRecentActivity = useMemo(() => {
    return Array.isArray(summary.recentActivity)
      ? summary.recentActivity.map((item) => ({
          ...item,
          date: item?.date ? new Date(item.date) : null,
        }))
      : [];
  }, [summary.recentActivity]);

  const kpis = useMemo(() => ([
    {
      key: 'revenue',
      label: 'Chiffre d\'affaires',
      value: CURRENCY.format(Number(summary.revenue || 0)),
      note: `${NUMBER.format(Number(summary.paidPayments || 0))} paiements validés`,
      icon: 'fa-sack-dollar',
      color: '#16a34a',
      glow: 'rgba(22,163,74,0.22)',
    },
    {
      key: 'users',
      label: 'Utilisateurs',
      value: NUMBER.format(Number(summary.users || 0)),
      note: 'Comptes actifs en base',
      icon: 'fa-users',
      color: '#2563eb',
      glow: 'rgba(37,99,235,0.22)',
    },
    {
      key: 'orders',
      label: 'Commandes',
      value: NUMBER.format(Number(summary.orders || 0)),
      note: `${NUMBER.format(Number(summary.pendingOrders || 0))} en attente`,
      icon: 'fa-cart-shopping',
      color: '#f97316',
      glow: 'rgba(249,115,22,0.24)',
    },
    {
      key: 'catalog',
      label: 'Catalogue',
      value: `${NUMBER.format(Number(summary.products || 0))} produits`,
      note: `${NUMBER.format(Number(summary.formations || 0))} formations`,
      icon: 'fa-cubes',
      color: '#7c3aed',
      glow: 'rgba(124,58,237,0.22)',
    },
    {
      key: 'crm',
      label: 'Leads & messages',
      value: `${NUMBER.format(Number(summary.messages || 0))} messages`,
      note: `${NUMBER.format(Number(summary.revendeurDemandes || 0))} revendeur · ${NUMBER.format(Number(summary.devisPrestations || 0))} devis`,
      icon: 'fa-inbox',
      color: '#0891b2',
      glow: 'rgba(8,145,178,0.22)',
    },
    {
      key: 'home-content',
      label: 'Contenu accueil',
      value: `${NUMBER.format(Number(summary.marketingCardsCount || 0) + Number(summary.homePromotionsCount || 0))} visuels`,
      note: `${NUMBER.format(Number(summary.testimonials || 0))} avis · ${NUMBER.format(Number(summary.collaborators || 0))} collab · ${NUMBER.format(Number(summary.partners || 0))} partenaires`,
      icon: 'fa-house',
      color: '#9333ea',
      glow: 'rgba(147,51,234,0.22)',
    },
  ]), [summary]);

  return (
    <div style={{ padding: '2rem', position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          inset: '0',
          background: 'radial-gradient(circle at 0% 0%, rgba(37,99,235,0.12), transparent 35%), radial-gradient(circle at 100% 100%, rgba(124,58,237,0.10), transparent 30%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ marginBottom: '1.75rem', position: 'relative', zIndex: 1 }}>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: '#0f172a',
            margin: '0 0 0.55rem 0',
            letterSpacing: '-0.02em',
          }}
        >
          Tableau de bord
        </h1>
        <p style={{ color: '#475569', fontSize: '0.97rem', margin: 0 }}>
          Vue pilotée par les données réelles de la base: ventes, utilisateurs, commandes et activité.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '1.25rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {kpis.map((kpi) => (
          <article
            key={kpi.key}
            style={{
              background: 'linear-gradient(160deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1rem',
              border: '1px solid rgba(148, 163, 184, 0.20)',
              padding: '1rem 1.1rem',
              boxShadow: `0 10px 24px ${kpi.glow}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
              <p style={{ margin: 0, color: '#475569', fontWeight: 600, fontSize: '0.9rem' }}>{kpi.label}</p>
              <span
                style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '0.65rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${kpi.color}20`,
                  color: kpi.color,
                }}
              >
                <i className={`fas ${kpi.icon}`} />
              </span>
            </div>
            <p style={{ margin: 0, color: '#0f172a', fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.45rem' }}>{kpi.value}</p>
            <p style={{ margin: '0.45rem 0 0', color: '#64748b', fontSize: '0.83rem' }}>{kpi.note}</p>
          </article>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '1.5rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Activité récente */}
        <section
          style={{
            background: '#ffffff',
            borderRadius: '1rem',
            border: '1px solid rgba(148, 163, 184, 0.22)',
            boxShadow: '0 22px 40px rgba(15, 23, 42, 0.08)',
            padding: '1.2rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
            <h2 style={{ fontSize: '1.08rem', margin: 0, color: '#0f172a', fontWeight: 700 }}>
              <i className="fas fa-wave-square" style={{ marginRight: '0.5rem', color: '#2563eb' }} />
              Activité récente
            </h2>
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{mergedRecentActivity.length} évènements</span>
          </div>

          {mergedRecentActivity.length === 0 && (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '1.8rem 1rem' }}>
              Aucune activité à afficher pour le moment.
            </div>
          )}
        </section>

        {/* Top 5 Clients */}
        <section
          style={{
            background: '#ffffff',
            borderRadius: '1rem',
            border: '1px solid rgba(148, 163, 184, 0.22)',
            boxShadow: '0 22px 40px rgba(15, 23, 42, 0.08)',
            padding: '1.2rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
            <h2 style={{ fontSize: '1.08rem', margin: 0, color: '#0f172a', fontWeight: 700 }}>
              <i className="fas fa-trophy" style={{ marginRight: '0.5rem', color: '#f59e0b' }} />
              Top 5 Clients les plus actifs
            </h2>
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Basé sur le volume d&apos;achat</span>
          </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 0.5rem', color: '#64748b', fontWeight: 600 }}>Client</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: '#64748b', fontWeight: 600, textAlign: 'center' }}>Achats</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>Total dépensé</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.topCustomers && summary.topCustomers.length > 0 ? (
                    summary.topCustomers.map((customer, idx) => (
                      <tr key={customer.id_utilisateur} style={{ borderBottom: idx === summary.topCustomers.length - 1 ? 'none' : '1px solid #f8fafc' }}>
                        <td style={{ padding: '0.85rem 0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                            <span style={{ 
                              width: '2.2rem', 
                              height: '2.2rem', 
                              borderRadius: '50%', 
                              background: '#f1f5f9', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              color: '#475569'
                            }}>
                              {customer.prenom?.charAt(0)}{customer.nom?.charAt(0)}
                            </span>
                            <div>
                              <p style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>{customer.prenom} {customer.nom}</p>
                              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>{customer.email}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 0.5rem', textAlign: 'center' }}>
                          <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 }}>
                            {customer.total_orders} cmd
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                          {CURRENCY.format(customer.total_spent)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        Aucune donnée d&apos;achat disponible.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
      </div>
    </div>
  );
}
