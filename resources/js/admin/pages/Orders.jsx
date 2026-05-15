import React, { useEffect, useState } from 'react';
import { getOrders, getOrder, updateOrderStatus, updateOrderDeliveryStatus } from '../api';
import { toastError, toastSuccess } from "../../utils/toast";
import { notifyMutation } from "../../utils/mutationBus";
import Loader from '../../components/Loader';
import { useLivePolling } from '../../hooks/useLivePolling';
import '../styles/admin-shared.css';
import '../styles/orders.css';

const DELIVERY_STATUSES = [
  'en_attente',
  'en_preparation',
  'expediee',
  'en_livraison',
  'livree',
  'echec',
  'retournee',
];

function formatAmount(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('fr-FR');
}

function sourceLabel(source) {
  if (source === 'geovision') return 'GeoVision';
  return 'Produits';
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingDeliveryId, setUpdatingDeliveryId] = useState(null);

  const ORDERS_PER_PAGE = 20;
  const EMPTY_PAGINATION = {
    total: 0,
    per_page: ORDERS_PER_PAGE,
    current_page: 1,
    last_page: 1,
    from: 0,
    to: 0,
  };

  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [page, setPage] = useState(1);
  const [refreshToken, setRefreshToken] = useState(0);
  const [stats, setStats] = useState({ total: 0, en_attente: 0, payee: 0 });


  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
      setLoading(true);

      try {
        const params = { page, per_page: ORDERS_PER_PAGE };
        const res = await getOrders(params);

        if (!mounted) return;

        const list = Array.isArray(res.data) ? res.data : [];
        const nextMeta = res.meta || EMPTY_PAGINATION;
        const nextStats = res.stats || {};

        if (nextMeta.last_page && page > nextMeta.last_page) {
          setPage(nextMeta.last_page);
          return;
        }

        setOrders(list);
        setPagination({
          total: Number(nextMeta.total || list.length || 0),
          per_page: Number(nextMeta.per_page || ORDERS_PER_PAGE),
          current_page: Number(nextMeta.current_page || page),
          last_page: Number(nextMeta.last_page || 1),
          from: Number(nextMeta.from || 0),
          to: Number(nextMeta.to || 0),
        });

        setStats({
          total: Number(nextStats.total || nextMeta.total || list.length || 0),
          en_attente: Number(nextStats.en_attente || 0),
          payee: Number(nextStats.payee || 0),
        });
      } catch (err) {
        if (!mounted) return;
        setOrders([]);
        setPagination(EMPTY_PAGINATION);
        setStats({ total: 0, en_attente: 0, payee: 0 });
        toastError('Impossible de charger les commandes pour le moment.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadOrders();

    return () => {
      mounted = false;
    };
  }, [page, refreshToken]);

  const backgroundLoadOrders = async () => {
    try {
      const params = { page, per_page: ORDERS_PER_PAGE };
      const res = await getOrders(params);

      const list = Array.isArray(res.data) ? res.data : [];
      const nextMeta = res.meta || EMPTY_PAGINATION;
      const nextStats = res.stats || {};

      if (nextMeta.last_page && page > nextMeta.last_page) {
        setPage(nextMeta.last_page);
        return;
      }

      setOrders(list);
      setPagination({
        total: Number(nextMeta.total || list.length || 0),
        per_page: Number(nextMeta.per_page || ORDERS_PER_PAGE),
        current_page: Number(nextMeta.current_page || page),
        last_page: Number(nextMeta.last_page || 1),
        from: Number(nextMeta.from || 0),
        to: Number(nextMeta.to || 0),
      });

      setStats({
        total: Number(nextStats.total || nextMeta.total || list.length || 0),
        en_attente: Number(nextStats.en_attente || 0),
        payee: Number(nextStats.payee || 0),
      });
    } catch (err) {
      // silent background refresh
    }
  };

  useLivePolling(
    () => backgroundLoadOrders(),
    {
      intervalMs: 3000,
      enabled: !loading && updatingDeliveryId === null,
    }
  );

  async function handleView(id) {
    try {
      const res = await getOrder(id);
      setSelectedOrder(res.data);
    } catch (err) {
      console.error('Get order error', err);
      toastError('Erreur recuperation commande');
    }
  }

  async function handleStatus(id, statut) {
    try {
      await updateOrderStatus(id, statut);
      toastSuccess('Statut commande mis a jour.');
      notifyMutation();
      setRefreshToken((t) => t + 1);
      if (selectedOrder && selectedOrder.id === id) {
        try {
          const res = await getOrder(id);
          setSelectedOrder(res.data);
        } catch (e) {
          // ignore
        }
      }
    } catch (err) {
      console.error('Update order status error', err);
      toastError('Erreur mise a jour statut commande');
    }
  }

  async function handleDeliveryStatus(id, statut) {
    setUpdatingDeliveryId(id);
    try {
      await updateOrderDeliveryStatus(id, statut);
      toastSuccess('Statut livraison mis a jour.');
      notifyMutation();
      setRefreshToken((t) => t + 1);
      if (selectedOrder && selectedOrder.id === id) {
        try {
          const res = await getOrder(id);
          setSelectedOrder(res.data);
        } catch (e) {
          // ignore
        }
      }
    } catch (err) {
      console.error('Update delivery status error', err);
      toastError(err?.response?.data?.message || 'Erreur mise a jour statut livraison');
    } finally {
      setUpdatingDeliveryId(null);
    }
  }

  return (
    <div className="admin-orders-page">
      <div className="admin-orders-hero">
        <div className="admin-hero-content">
          <h1 style={{ color: '#ffffff' }}>Gestion des Commandes</h1>
          <p>Suivez toutes vos commandes en cours, confirmees et livrees.</p>
        </div>
        {!loading && (pagination.total > 0 || orders.length > 0) && (
          <div className="admin-orders-kpis">
            <div className="admin-orders-stat">
              <span>Total</span>
              <strong>{stats.total || pagination.total || orders.length}</strong>
            </div>
            <div className="admin-orders-stat">
              <span>En attente</span>
              <strong>{typeof stats.en_attente === 'number' ? stats.en_attente : orders.filter((o) => o.statut === 'en_attente' || o.statut === 'en_cours').length}</strong>
            </div>
            <div className="admin-orders-stat">
              <span>Payees</span>
              <strong>{typeof stats.payee === 'number' ? stats.payee : orders.filter((o) => o.statut === 'payee' || o.statut === 'completed').length}</strong>
            </div>
          </div>
        )}
      </div>



      {loading ? (
        <Loader text="Chargement des commandes..." />
      ) : (pagination.total === 0 && orders.length === 0) ? (
        <div className="admin-orders-empty">
          <div className="admin-orders-empty-icon">Aucune commande</div>
          <h3>Aucune commande trouvee</h3>
          <p>Les commandes apparaitront ici lorsque des clients en placeront.</p>
        </div>
      ) : (
        <>
          <div className="admin-orders-list-card">
            <div className="admin-orders-list-card-header">
              <h2>Liste des Commandes</h2>
              <span style={{ fontSize: '0.875rem', color: '#6B7280', fontWeight: 500 }}>
                {pagination.total || orders.length} commande{(pagination.total || orders.length) > 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-orders-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Client</th>
                    <th>Articles</th>
                    <th>Total</th>
                    <th>Statut</th>
                    <th>Livraison</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td><span className="admin-order-id">#{o.id}</span></td>
                      <td>
                        <div className="admin-order-customer">
                          <span className="admin-order-customer-name">{o.customer_name || o.client || '-'}</span>
                          <span className="admin-order-customer-info">{o.customer_email || 'Email -'}</span>
                          <span className="admin-order-customer-info">{o.customer_phone || 'Tel. -'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="admin-order-items">
                          {Array.isArray(o.paid_items) && o.paid_items.length > 0 ? (
                            o.paid_items.map((item) => (
                              <div key={`${o.id}-${item.id_ligne || item.id_produit || item.titre}`} className="admin-order-item">
                                <div className="admin-order-item-title">{item.titre || 'Produit'}</div>
                                <div className="admin-order-item-meta">
                                  {sourceLabel(item.source)}{item.categorie ? ` · ${item.categorie}` : ''}
                                </div>
                                <div className="admin-order-item-quantity">
                                  Qte {item.quantite ?? 0}{' -> '}{formatAmount(item.prix_unitaire)} FCFA
                                </div>
                              </div>
                            ))
                          ) : (
                            <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>Aucun article</span>
                          )}
                        </div>
                      </td>
                      <td><span className="admin-order-total">{formatAmount(o.total ?? o.montant ?? 0)} FCFA</span></td>
                      <td>
                        <div className="admin-order-status">
                          <span className="admin-order-status-badge">{o.statut ? o.statut.replace(/_/g, ' ') : '-'}</span>
                          <span className="admin-order-payment-status">Paiement: {o.payment_summary?.status || 'non renseigne'}</span>
                          {o.payment_summary?.reference && (
                            <span className="admin-order-payment-status">Ref: {o.payment_summary.reference}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                          <strong style={{ textTransform: 'capitalize', fontSize: '0.875rem' }}>
                            {(o.delivery_status || 'non_planifiee').replace(/_/g, ' ')}
                          </strong>
                          <select
                            className="admin-order-delivery-select"
                            value={o.delivery_status || 'en_attente'}
                            onChange={(e) => handleDeliveryStatus(o.id, e.target.value)}
                            disabled={updatingDeliveryId === o.id}
                          >
                            {DELIVERY_STATUSES.map((status) => (
                              <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td>
                        <div className="admin-order-actions">
                          <button className="admin-order-action-btn view" onClick={() => handleView(o.id)}>Details</button>
                          <button className="admin-order-action-btn" onClick={() => handleStatus(o.id, 'en_attente')}>En attente</button>
                          <button className="admin-order-action-btn" onClick={() => handleStatus(o.id, 'payee')}>Payee</button>
                          <button className="admin-order-action-btn" onClick={() => handleStatus(o.id, 'annulee')}>Annulee</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedOrder && (
            <div className="admin-order-detail">
              <div className="admin-order-detail-header">
                <h2>Details de la Commande #{selectedOrder.id}</h2>
                <button className="admin-order-detail-close" onClick={() => setSelectedOrder(null)}>Fermer</button>
              </div>
              <div className="admin-order-detail-content">
                <pre className="admin-order-detail-json">{JSON.stringify(selectedOrder, null, 2)}</pre>
              </div>
            </div>
          )}

          {!loading && orders.length > 0 && (
            <div className="admin-orders-pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem 1.25rem 1.25rem' }}>
              <span className="admin-orders-list-card-count">
                Affichage {pagination.from || 0}-{pagination.to || 0} sur {pagination.total || 0}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="admin-order-action-btn suspend"
                  onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                  disabled={loading || pagination.current_page <= 1}
                >
                  Précédent
                </button>
                <span className="admin-orders-list-card-count">
                  Page {pagination.current_page} / {pagination.last_page}
                </span>
                <button
                  type="button"
                  className="admin-order-action-btn reactivate"
                  onClick={() => setPage((previous) => previous + 1)}
                  disabled={loading || pagination.current_page >= pagination.last_page}
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </>
      )}


    </div>
  );
}
