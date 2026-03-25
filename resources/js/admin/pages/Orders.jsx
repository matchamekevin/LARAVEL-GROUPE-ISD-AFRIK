import React, { useEffect, useState } from 'react';
import { getOrders, getOrder, updateOrderStatus, updateOrderDeliveryStatus } from '../api';
import Loader from '../components/Loader';
import '../styles/admin-shared.css';
import './orders.css';

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

  useEffect(() => {
    let mounted = true;
    getOrders()
      .then((res) => {
        if (mounted) setOrders(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (mounted) setOrders([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function handleView(id) {
    try {
      const res = await getOrder(id);
      setSelectedOrder(res.data);
    } catch (err) {
      console.error('Get order error', err);
      alert('Erreur recuperation commande');
    }
  }

  async function handleStatus(id, statut) {
    try {
      await updateOrderStatus(id, statut);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, statut } : o)));
      setSelectedOrder((prev) => (prev && prev.id === id ? { ...prev, statut } : prev));
    } catch (err) {
      console.error('Update order status error', err);
      alert('Erreur mise a jour statut commande');
    }
  }

  async function handleDeliveryStatus(id, statut) {
    setUpdatingDeliveryId(id);
    try {
      await updateOrderDeliveryStatus(id, statut);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, delivery_status: statut } : o)));
      setSelectedOrder((prev) => (prev && prev.id === id ? { ...prev, delivery_status: statut } : prev));
    } catch (err) {
      console.error('Update delivery status error', err);
      alert(err?.response?.data?.message || 'Erreur mise a jour statut livraison');
    } finally {
      setUpdatingDeliveryId(null);
    }
  }

  return (
    <div className="admin-orders-page">
      <div className="admin-orders-hero">
        <div className="admin-hero-content">
          <h1>Gestion des Commandes</h1>
          <p>Suivez toutes vos commandes en cours, confirmees et livrees.</p>
        </div>
        {!loading && orders.length > 0 && (
          <div className="admin-orders-kpis">
            <div className="admin-orders-stat">
              <span>Total</span>
              <strong>{orders.length}</strong>
            </div>
            <div className="admin-orders-stat">
              <span>En attente</span>
              <strong>{orders.filter((o) => o.statut === 'en_attente' || o.statut === 'en_cours').length}</strong>
            </div>
            <div className="admin-orders-stat">
              <span>Payees</span>
              <strong>{orders.filter((o) => o.statut === 'payee' || o.statut === 'completed').length}</strong>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <Loader text="Chargement des commandes..." />
      ) : orders.length === 0 ? (
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
                {orders.length} commande{orders.length > 1 ? 's' : ''}
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
        </>
      )}
    </div>
  );
}
