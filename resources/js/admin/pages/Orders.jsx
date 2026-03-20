import React, { useEffect, useState } from 'react';
import { getOrders, getOrder, updateOrderStatus } from '../api';
import Loader from '../components/Loader';

export default function Orders(){
  const [orders,setOrders] = useState([]);
  const [loading,setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(()=>{
    let mounted = true;
    getOrders()
      .then(res=>{ if(mounted) setOrders(Array.isArray(res.data) ? res.data : []); })
      .catch(()=>{ if(mounted) setOrders([]); })
      .finally(()=>{ if(mounted) setLoading(false); });
    return ()=> mounted = false;
  },[]);

  async function handleView(id){
    try{
      const res = await getOrder(id);
      setSelectedOrder(res.data);
    }catch(err){
      console.error('Get order error', err);
      alert('Erreur récupération commande');
    }
  }

  async function handleStatus(id, statut){
    try{
      await updateOrderStatus(id, statut);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, statut } : o)));
    }catch(err){
      console.error('Update order status error', err);
      alert('Erreur mise à jour statut commande');
    }
  }

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
          Gestion des Commandes
        </h1>
        <p style={{
          color: '#6B7280',
          fontSize: '0.95rem',
          margin: 0,
        }}>
          Suivez toutes vos commandes en cours et confirmées
        </p>
      </div>

      {loading ? (
        <Loader text="Chargement des commandes..." />
      ) : orders.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '3rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          textAlign: 'center',
          color: '#6B7280',
        }}>
          <i className="fas fa-inbox" style={{fontSize: '3rem', marginBottom: '1rem', display: 'block', color: '#D1D5DB'}}></i>
          Aucune commande trouvée
        </div>
      ) : (
        <>
          <div style={{
            background: '#ffffff',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}>
              <thead>
                <tr style={{
                  background: '#F3F4F6',
                  borderBottom: '2px solid #E5E7EB',
                }}>
                  <th style={{
                    textAlign: 'left',
                    padding: '1rem',
                    fontWeight: 700,
                    color: '#172243',
                  }}>
                    ID
                  </th>
                  <th style={{
                    textAlign: 'left',
                    padding: '1rem',
                    fontWeight: 700,
                    color: '#172243',
                  }}>
                    Client
                  </th>
                  <th style={{
                    textAlign: 'left',
                    padding: '1rem',
                    fontWeight: 700,
                    color: '#172243',
                  }}>
                    Total
                  </th>
                  <th style={{
                    textAlign: 'left',
                    padding: '1rem',
                    fontWeight: 700,
                    color: '#172243',
                  }}>
                    Statut
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: '1rem',
                    fontWeight: 700,
                    color: '#172243',
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, idx) => (
                  <tr key={o.id} style={{
                    borderBottom: '1px solid #E5E7EB',
                    background: idx % 2 === 0 ? '#ffffff' : '#F9FAFB',
                    transition: 'background 0.2s ease',
                  }}>
                    <td style={{padding: '1rem', color: '#6B7280', fontSize: '0.9rem', fontWeight: 600}}>
                      #{o.id}
                    </td>
                    <td style={{padding: '1rem', color: '#172243', fontWeight: 500}}>
                      {o.customer_name || o.client || '—'}
                    </td>
                    <td style={{padding: '1rem', color: '#764ba2', fontWeight: 600, fontSize: '1.05rem'}}>
                      {o.total ?? o.montant ?? '—'} FCFA
                    </td>
                    <td style={{padding: '1rem', color: '#172243'}}>
                      {o.statut || '—'}
                    </td>
                    <td style={{padding: '1rem', textAlign: 'center'}}>
                      <div style={{display:'flex',gap:'0.4rem',justifyContent:'center',flexWrap:'wrap'}}>
                        <button 
                          onClick={()=>handleView(o.id)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <i className="fas fa-eye" style={{marginRight: '0.3rem'}}></i>Détails
                        </button>
                        <button className="btn-secondary" onClick={()=>handleStatus(o.id,'en_attente')}>En attente</button>
                        <button className="btn-secondary" onClick={()=>handleStatus(o.id,'payee')}>Payée</button>
                        <button className="btn-secondary" onClick={()=>handleStatus(o.id,'annulee')}>Annulée</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedOrder && (
            <div style={{
              marginTop: '2rem',
              background: '#ffffff',
              borderRadius: '0.75rem',
              padding: '2rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              borderLeft: '5px solid #667eea',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: '#172243',
                  margin: 0,
                }}>
                  Détails de la Commande #{selectedOrder.id}
                </h2>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  style={{
                    background: '#E5E7EB',
                    color: '#172243',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  <i className="fas fa-times" style={{marginRight: '0.3rem'}}></i>Fermer
                </button>
              </div>
              <pre style={{
                background: '#F3F4F6',
                padding: '1rem',
                borderRadius: '0.5rem',
                overflow: 'auto',
                fontSize: '0.85rem',
                color: '#172243',
              }}>
                {JSON.stringify(selectedOrder, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}