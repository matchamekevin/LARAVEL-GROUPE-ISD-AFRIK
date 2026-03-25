import React, { useEffect, useMemo, useState } from 'react';
import {
  getFormations,
  getOrders,
  getPaiements,
  getProducts,
  getUsers,
  getContactMessages,
  getRevendeurDemandes,
  getHomeMarketingCardsAdmin,
  getHomeTestimonialsAdmin,
  getHomeCollaboratorsAdmin,
  getHomePartnersAdmin,
} from '../api';

const CURRENCY = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

const NUMBER = new Intl.NumberFormat('fr-FR');

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isPaidStatus(value) {
  const status = String(value || '').toLowerCase();
  return ['reussi', 'réussi', 'approved', 'payee', 'payée'].includes(status);
}

function eventDate(event) {
  return toDate(event.date_paiement || event.date_commande || event.created_at || event.updated_at);
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [products, setProducts] = useState([]);
  const [formations, setFormations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [revendeurDemandes, setRevendeurDemandes] = useState([]);
  const [homeCards, setHomeCards] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [partners, setPartners] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      const [usersRes, ordersRes, paymentsRes, productsRes, formationsRes, messagesRes, revendeurRes, cardsRes, testimonialsRes, collaboratorsRes, partnersRes] = await Promise.allSettled([
        getUsers(),
        getOrders(),
        getPaiements(),
        getProducts(),
        getFormations(),
        getContactMessages(),
        getRevendeurDemandes(),
        getHomeMarketingCardsAdmin(),
        getHomeTestimonialsAdmin(),
        getHomeCollaboratorsAdmin(),
        getHomePartnersAdmin(),
      ]);

      if (!mounted) return;

      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data || []);
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data || []);
      if (paymentsRes.status === 'fulfilled') setPayments(paymentsRes.value.data || []);
      if (productsRes.status === 'fulfilled') setProducts(productsRes.value.data || []);
      if (formationsRes.status === 'fulfilled') setFormations(formationsRes.value.data || []);
      if (messagesRes.status === 'fulfilled') setMessages(messagesRes.value.data || []);
      if (revendeurRes.status === 'fulfilled') setRevendeurDemandes(revendeurRes.value.data || []);
      if (cardsRes.status === 'fulfilled') setHomeCards(cardsRes.value.data || []);
      if (testimonialsRes.status === 'fulfilled') setTestimonials(testimonialsRes.value.data || []);
      if (collaboratorsRes.status === 'fulfilled') setCollaborators(collaboratorsRes.value.data || []);
      if (partnersRes.status === 'fulfilled') setPartners(partnersRes.value.data || []);

      const hasFailure = [usersRes, ordersRes, paymentsRes, productsRes, formationsRes, messagesRes, revendeurRes, cardsRes, testimonialsRes, collaboratorsRes, partnersRes].some((item) => item.status === 'rejected');
      if (hasFailure) {
        setError('Certaines métriques n\'ont pas pu être chargées. Les données affichées restent basées sur la base disponible.');
      }

      setLoading(false);
    }

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  const paidPayments = useMemo(
    () => payments.filter((p) => isPaidStatus(p.statut || p.statut_paiement)),
    [payments]
  );

  const revenue = useMemo(
    () => paidPayments.reduce((sum, p) => sum + Number(p.montant || 0), 0),
    [paidPayments]
  );

  const pendingOrders = useMemo(
    () => orders.filter((o) => String(o.statut || '').toLowerCase().includes('attente')).length,
    [orders]
  );

  const homePromotionsCount = useMemo(
    () => homeCards.filter((card) => ['home_promotion', 'promotion_page'].includes(String(card.section || ''))).length,
    [homeCards]
  );

  const marketingCardsCount = useMemo(
    () => homeCards.filter((card) => ['offer', 'featured_product'].includes(String(card.section || ''))).length,
    [homeCards]
  );

  const recentActivity = useMemo(() => {
    const orderEvents = orders.map((order) => ({
      id: `order-${order.id || order.id_commande}`,
      type: 'commande',
      title: `Commande #${order.id || order.id_commande || '-'}`,
      subtitle: `${order.customer_name || order.utilisateur?.email || 'Client'} • ${String(order.statut || 'statut inconnu').replace('_', ' ')}`,
      amount: Number(order.total || 0),
      date: eventDate(order),
      icon: 'fa-box',
      color: '#0ea5e9',
    }));

    const paymentEvents = payments.map((payment) => ({
      id: `payment-${payment.id || payment.id_paiement}`,
      type: 'paiement',
      title: payment.formation?.titre || `Paiement #${payment.id || payment.id_paiement || '-'}`,
      subtitle: `${payment.utilisateur?.email || 'Utilisateur'} • ${payment.statut || payment.statut_paiement || 'inconnu'}`,
      amount: Number(payment.montant || 0),
      date: eventDate(payment),
      icon: 'fa-credit-card',
      color: isPaidStatus(payment.statut || payment.statut_paiement) ? '#16a34a' : '#f59e0b',
    }));

    return [...orderEvents, ...paymentEvents]
      .filter((item) => item.date)
      .sort((a, b) => b.date - a.date)
      .slice(0, 8);
  }, [orders, payments]);

  const kpis = [
    {
      key: 'revenue',
      label: 'Chiffre d\'affaires',
      value: CURRENCY.format(revenue),
      note: `${NUMBER.format(paidPayments.length)} paiements validés`,
      icon: 'fa-sack-dollar',
      color: '#16a34a',
      glow: 'rgba(22,163,74,0.22)',
    },
    {
      key: 'users',
      label: 'Utilisateurs',
      value: NUMBER.format(users.length),
      note: 'Comptes actifs en base',
      icon: 'fa-users',
      color: '#2563eb',
      glow: 'rgba(37,99,235,0.22)',
    },
    {
      key: 'orders',
      label: 'Commandes',
      value: NUMBER.format(orders.length),
      note: `${NUMBER.format(pendingOrders)} en attente`,
      icon: 'fa-cart-shopping',
      color: '#f97316',
      glow: 'rgba(249,115,22,0.24)',
    },
    {
      key: 'catalog',
      label: 'Catalogue',
      value: `${NUMBER.format(products.length)} produits`,
      note: `${NUMBER.format(formations.length)} formations`,
      icon: 'fa-cubes',
      color: '#7c3aed',
      glow: 'rgba(124,58,237,0.22)',
    },
    {
      key: 'crm',
      label: 'Leads & messages',
      value: `${NUMBER.format(messages.length)} messages`,
      note: `${NUMBER.format(revendeurDemandes.length)} demandes revendeur`,
      icon: 'fa-inbox',
      color: '#0891b2',
      glow: 'rgba(8,145,178,0.22)',
    },
    {
      key: 'home-content',
      label: 'Contenu accueil',
      value: `${NUMBER.format(marketingCardsCount + homePromotionsCount)} visuels`,
      note: `${NUMBER.format(testimonials.length)} avis · ${NUMBER.format(collaborators.length)} collab · ${NUMBER.format(partners.length)} partenaires`,
      icon: 'fa-house',
      color: '#9333ea',
      glow: 'rgba(147,51,234,0.22)',
    },
  ];

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

      {error && (
        <div
          style={{
            marginBottom: '1rem',
            background: '#fff7ed',
            border: '1px solid #fdba74',
            color: '#9a3412',
            borderRadius: '0.8rem',
            padding: '0.8rem 1rem',
            fontSize: '0.9rem',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {error}
        </div>
      )}

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

      <section
        style={{
          background: '#ffffff',
          borderRadius: '1rem',
          border: '1px solid rgba(148, 163, 184, 0.22)',
          boxShadow: '0 22px 40px rgba(15, 23, 42, 0.08)',
          padding: '1.2rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
          <h2 style={{ fontSize: '1.08rem', margin: 0, color: '#0f172a', fontWeight: 700 }}>
            <i className="fas fa-wave-square" style={{ marginRight: '0.5rem', color: '#2563eb' }} />
            Activité récente
          </h2>
          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{loading ? 'Chargement...' : `${recentActivity.length} évènements`}</span>
        </div>

        {loading && (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '1.8rem 1rem' }}>
            Mise à jour du tableau de bord...
          </div>
        )}

        {!loading && recentActivity.length === 0 && (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '1.8rem 1rem' }}>
            Aucune activité à afficher pour le moment.
          </div>
        )}

        {!loading && recentActivity.length > 0 && (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {recentActivity.map((item) => (
              <article
                key={item.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: '0.8rem',
                  alignItems: 'center',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  padding: '0.72rem 0.8rem',
                }}
              >
                <span
                  style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '0.6rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${item.color}20`,
                    color: item.color,
                  }}
                >
                  <i className={`fas ${item.icon}`} />
                </span>

                <div>
                  <p style={{ margin: 0, fontSize: '0.92rem', color: '#0f172a', fontWeight: 600 }}>{item.title}</p>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>{item.subtitle}</p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, color: '#0f172a', fontWeight: 700, fontSize: '0.88rem' }}>
                    {item.amount > 0 ? CURRENCY.format(item.amount) : '—'}
                  </p>
                  <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.78rem' }}>
                    {item.date ? item.date.toLocaleDateString('fr-FR') : '-'}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
