import React, { useEffect, useState } from 'react';
import { getProducts, createProduct, deleteProduct, updateProduct } from '../api';

export default function Products(){
  const [items,setItems] = useState([]);
  const [loading,setLoading] = useState(true);
  const [newProduct, setNewProduct] = useState({ title: '', price: '' });
  const [saving, setSaving] = useState(false);

  useEffect(()=>{
    let mounted = true;
    getProducts()
      .then(res=>{ if(mounted) setItems(Array.isArray(res.data) ? res.data : []); })
      .catch(()=>{ if(mounted) setItems([]); })
      .finally(()=>{ if(mounted) setLoading(false); });
    return ()=> mounted = false;
  },[]);

  async function handleCreate(e){
    e.preventDefault();
    setSaving(true);
    try{
      await createProduct(newProduct);
      const res = await getProducts();
      setItems(res.data || []);
      setNewProduct({ title: '', price: '' });
    }catch(err){
      console.error('Create product error', err);
      alert(err?.response?.data?.message || 'Erreur création');
    }finally{ setSaving(false); }
  }

  async function handleDelete(id){
    if(!confirm('Supprimer ce produit ?')) return;
    try{
      await deleteProduct(id);
      setItems(items.filter(i=>i.id !== id));
    }catch(err){
      console.error('Delete error', err);
      alert('Erreur suppression');
    }
  }

  async function handleStartEdit(item){
    setItems(items.map(i => i.id === item.id ? { ...i, _editing: true, _editTitle: i.title || i.name || '', _editPrice: i.price ?? i.prix ?? '' } : i));
  }

  function handleCancelEdit(id){
    setItems(items.map(i => i.id === id ? { ...i, _editing: false } : i));
  }

  async function handleSaveEdit(id){
    const item = items.find(i=>i.id===id);
    if(!item) return;
    try{
      await updateProduct(id, { title: item._editTitle, price: item._editPrice });
      const res = await getProducts();
      setItems(res.data || []);
    }catch(err){
      console.error('Update error', err);
      alert('Erreur mise à jour');
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: '#172243',
            margin: '0 0 0.5rem 0',
          }}>
            Gestion des Produits
          </h1>
          <p style={{
            color: '#6B7280',
            fontSize: '0.95rem',
            margin: 0,
          }}>
            Créez, modifiez et supprimez vos produits
          </p>
        </div>
      </div>

      <div style={{
        background: '#ffffff',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        marginBottom: '2rem',
      }}>
        <h2 style={{
          fontSize: '1.1rem',
          fontWeight: 700,
          color: '#172243',
          marginBottom: '1rem',
          borderBottom: '2px solid #667eea',
          paddingBottom: '0.75rem',
        }}>
          ➕ Ajouter un nouveau produit
        </h2>
        <form onSubmit={handleCreate} style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr auto',
          gap: '1rem',
          alignItems: 'end',
        }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 600,
              color: '#374151',
              fontSize: '0.9rem',
            }}>
              Titre
            </label>
            <input 
              placeholder="Ex: Produit Premium..." 
              value={newProduct.title} 
              onChange={e=>setNewProduct({...newProduct,title:e.target.value})}
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
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 600,
              color: '#374151',
              fontSize: '0.9rem',
            }}>
              Prix (FCFA)
            </label>
            <input 
              placeholder="Ex: 15000" 
              value={newProduct.price} 
              onChange={e=>setNewProduct({...newProduct,price:e.target.value})}
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
          <button 
            type="submit" 
            disabled={saving}
            style={{
              padding: '0.75rem 1.5rem',
              background: saving ? '#9CA3AF' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            }}
            onMouseEnter={(e) => !saving && (e.target.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => !loading && (e.target.style.transform = 'translateY(0)')}
          >
            {saving ? 'Ajout en cours...' : 'Ajouter'}
          </button>
        </form>
      </div>

      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#6B7280',
        }}>
          ⏳ Chargement des produits...
        </div>
      ) : items.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '3rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          textAlign: 'center',
          color: '#6B7280',
        }}>
          📭 Aucun produit. Créez-en un !
        </div>
      ) : (
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
                  Titre
                </th>
                <th style={{
                  textAlign: 'left',
                  padding: '1rem',
                  fontWeight: 700,
                  color: '#172243',
                }}>
                  Prix
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
              {items.map((p, idx) => (
                <tr key={p.id} style={{
                  borderBottom: '1px solid #E5E7EB',
                  background: idx % 2 === 0 ? '#ffffff' : '#F9FAFB',
                  transition: 'background 0.2s ease',
                }}>
                  <td style={{padding: '1rem', color: '#6B7280', fontSize: '0.9rem', fontWeight: 600}}>
                    #{p.id}
                  </td>
                  <td style={{padding: '1rem'}}>
                    {p._editing ? (
                      <input 
                        value={p._editTitle} 
                        onChange={e=>setItems(items.map(i=> i.id===p.id ? {...i,_editTitle:e.target.value} : i))}
                        style={{
                          width: '100%',
                          maxWidth: '300px',
                          padding: '0.5rem',
                          border: '2px solid #667eea',
                          borderRadius: '0.5rem',
                          fontSize: '0.9rem',
                        }}
                      />
                    ) : (
                      <span style={{color: '#172243', fontWeight: 500}}>
                        {p.title || p.name || '—'}
                      </span>
                    )}
                  </td>
                  <td style={{padding: '1rem'}}>
                    {p._editing ? (
                      <input 
                        value={p._editPrice} 
                        onChange={e=>setItems(items.map(i=> i.id===p.id ? {...i,_editPrice:e.target.value} : i))}
                        style={{
                          width: '100%',
                          maxWidth: '150px',
                          padding: '0.5rem',
                          border: '2px solid #667eea',
                          borderRadius: '0.5rem',
                          fontSize: '0.9rem',
                        }}
                      />
                    ) : (
                      <span style={{color: '#764ba2', fontWeight: 600, fontSize: '1.05rem'}}>
                        {p.price ?? p.prix ?? '—'} FCFA
                      </span>
                    )}
                  </td>
                  <td style={{padding: '1rem', textAlign: 'center'}}>
                    {p._editing ? (
                      <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'center'}}>
                        <button 
                          onClick={()=>handleSaveEdit(p.id)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                          }}
                        >
                          ✓ Enregistrer
                        </button>
                        <button 
                          onClick={()=>handleCancelEdit(p.id)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'transparent',
                            color: '#DC2626',
                            border: '1px solid #DC2626',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                          }}
                        >
                          ✕ Annuler
                        </button>
                      </div>
                    ) : (
                      <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'center'}}>
                        <button 
                          onClick={()=>handleStartEdit(p)}
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
                          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                        >
                          ✎ Éditer
                        </button>
                        <button 
                          onClick={()=>handleDelete(p.id)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            transition: 'all 0.3s ease',
                          }}
                          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                        >
                          🗑 Supprimer
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
