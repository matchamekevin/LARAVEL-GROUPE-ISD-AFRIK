import React, { useEffect, useState } from 'react';
import { getUsers, deleteUser } from '../api';

export default function Users(){
  const [users,setUsers] = useState([]);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    let mounted = true;
    getUsers()
      .then(res=>{ if(mounted) setUsers(Array.isArray(res.data) ? res.data : []); })
      .catch(()=>{ if(mounted) setUsers([]); })
      .finally(()=>{ if(mounted) setLoading(false); });
    return ()=> mounted = false;
  },[]);

  async function handleDelete(id){
    if(!confirm('Supprimer cet utilisateur ?')) return;
    try{
      await deleteUser(id);
      setUsers(users.filter(u=>u.id !== id));
    }catch(err){
      console.error('Delete user error', err);
      alert('Erreur suppression utilisateur');
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
          Gestion des Utilisateurs
        </h1>
        <p style={{
          color: '#6B7280',
          fontSize: '0.95rem',
          margin: 0,
        }}>
          Consultez et gérez vos utilisateurs
        </p>
      </div>

      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#6B7280',
        }}>
          ⏳ Chargement des utilisateurs...
        </div>
      ) : users.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '3rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          textAlign: 'center',
          color: '#6B7280',
        }}>
          👥 Aucun utilisateur trouvé
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
                  Nom
                </th>
                <th style={{
                  textAlign: 'left',
                  padding: '1rem',
                  fontWeight: 700,
                  color: '#172243',
                }}>
                  Email
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
              {users.map((u, idx) => (
                <tr key={u.id} style={{
                  borderBottom: '1px solid #E5E7EB',
                  background: idx % 2 === 0 ? '#ffffff' : '#F9FAFB',
                  transition: 'background 0.2s ease',
                }}>
                  <td style={{padding: '1rem', color: '#6B7280', fontSize: '0.9rem', fontWeight: 600}}>
                    #{u.id}
                  </td>
                  <td style={{padding: '1rem', color: '#172243', fontWeight: 500}}>
                    {u.name || u.nom || '—'}
                  </td>
                  <td style={{padding: '1rem', color: '#667eea', fontSize: '0.95rem'}}>
                    {u.email}
                  </td>
                  <td style={{padding: '1rem', textAlign: 'center'}}>
                    <button 
                      onClick={()=>handleDelete(u.id)}
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