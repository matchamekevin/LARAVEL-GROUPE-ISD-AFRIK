import React, { useEffect, useMemo, useState } from 'react';
import { getPaiements, getImagesAdmin, deleteImageAdmin, updateOrderStatus, getOrders } from '../api';
import Loader from '../components/Loader';

export default function AssetsVentesAdmin() {
  const [paiements, setPaiements] = useState([]);
  const [orders, setOrders] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [pRes, iRes, oRes] = await Promise.all([getPaiements(), getImagesAdmin(), getOrders()]);
      setPaiements(Array.isArray(pRes.data) ? pRes.data : []);
      setImages(Array.isArray(iRes.data) ? iRes.data : []);
      setOrders(Array.isArray(oRes.data) ? oRes.data : []);
    } catch (err) {
      console.error(err);
      setPaiements([]);
      setImages([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const totalVentes = useMemo(() => paiements.reduce((sum, p) => sum + (Number(p.montant) || 0), 0), [paiements]);

  async function handleDeleteImage(id) {
    if (!confirm('Supprimer cette image ?')) return;
    await deleteImageAdmin(id);
    setImages((prev) => prev.filter((x) => (x.id_image || x.id) !== id));
  }

  async function handleStatus(orderId, statut) {
    try {
      await updateOrderStatus(orderId, statut);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, statut } : o)));
    } catch (err) {
      console.error(err);
      alert('Erreur mise à jour statut commande');
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', color: '#172243', marginBottom: '1rem' }}>Ventes, Paiements & Assets</h1>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Résumé ventes</h2>
        {loading ? <Loader /> : (
          <div>
            <p><strong>Total paiements:</strong> {paiements.length}</p>
            <p><strong>Montant cumulé:</strong> {totalVentes.toLocaleString()} FCFA</p>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ marginBottom: '0.75rem' }}>Commandes (statuts)</h2>
        {loading ? <Loader /> : (
          <table>
            <thead>
              <tr><th>ID</th><th>Client</th><th>Total</th><th>Statut</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.customer_name || '—'}</td>
                  <td>{o.total || '—'} FCFA</td>
                  <td>{o.statut || '—'}</td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-secondary" onClick={() => handleStatus(o.id, 'en_attente')}>En attente</button>
                    <button className="btn-secondary" onClick={() => handleStatus(o.id, 'payee')}>Payée</button>
                    <button className="btn-secondary" onClick={() => handleStatus(o.id, 'annulee')}>Annulée</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '0.75rem' }}>Images plateforme</h2>
        {loading ? <Loader /> : (
          <table>
            <thead>
              <tr><th>ID</th><th>URL</th><th>Type</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {images.map((img) => (
                <tr key={img.id_image || img.id}>
                  <td>{img.id_image || img.id}</td>
                  <td>{img.url || img.path || '—'}</td>
                  <td>{img.imageable_type || '—'}</td>
                  <td>
                    <button className="btn-secondary" onClick={() => handleDeleteImage(img.id_image || img.id)}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
