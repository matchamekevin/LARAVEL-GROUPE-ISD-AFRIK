import React, { useEffect, useState } from 'react';
import {
  createFormMailRoute,
  getFormMailRoutes,
  updateFormMailRoute,
} from '../api';
import { toastError, toastSuccess } from '../../utils/toast';
import { notifyMutation } from '../../utils/mutationBus';
import '../styles/admin-shared.css';
import '../styles/form-mail-routes.css';

function toRecipientsText(value) {
  return Array.isArray(value) ? value.join('\n') : '';
}

function parseRecipients(value) {
  const parts = String(value || '').split(/[\n,;\s]+/g);
  const seen = new Set();

  return parts
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => {
      if (!entry) return false;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry)) return false;
      if (seen.has(entry)) return false;
      seen.add(entry);
      return true;
    });
}

export default function FormMailRoutes() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState('');
  const [creating, setCreating] = useState(false);

  const [newRoute, setNewRoute] = useState({
    form_key: '',
    form_label: '',
    description: '',
    recipients_text: '',
    is_active: true,
  });

  const loadRoutes = async () => {
    try {
      const res = await getFormMailRoutes();
      const list = Array.isArray(res.data) ? res.data : [];
      setRoutes(list.map((item) => ({
        ...item,
        recipients_text: toRecipientsText(item.recipients),
      })));
    } catch (err) {
      console.error(err);
      toastError('Impossible de charger la configuration email.');
      setRoutes([]);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadRoutes().finally(() => setLoading(false));
  }, []);

  const updateRouteState = (formKey, key, value) => {
    setRoutes((prev) => prev.map((route) => (
      route.form_key === formKey ? { ...route, [key]: value } : route
    )));
  };

  const handleSave = async (route) => {
    const recipients = parseRecipients(route.recipients_text);
    if (recipients.length === 0) {
      toastError('Ajoute au moins une adresse email valide.');
      return;
    }

    setSavingKey(route.form_key);
    try {
      await updateFormMailRoute(route.form_key, {
        form_label: route.form_label,
        description: route.description || null,
        is_active: Boolean(route.is_active),
        recipients,
      });
      toastSuccess(`Configuration mise a jour pour ${route.form_label}.`);
      notifyMutation();
      await loadRoutes();
    } catch (err) {
      console.error(err);
      toastError(err?.response?.data?.message || 'Echec de la mise a jour.');
    } finally {
      setSavingKey('');
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    const formKey = String(newRoute.form_key || '').trim().toLowerCase();
    const formLabel = String(newRoute.form_label || '').trim();
    const recipients = parseRecipients(newRoute.recipients_text);

    if (!formKey || !/^[a-z0-9_-]+$/.test(formKey)) {
      toastError('La cle formulaire doit contenir uniquement a-z, 0-9, _ ou -.');
      return;
    }

    if (!formLabel) {
      toastError('Le libelle du formulaire est obligatoire.');
      return;
    }

    if (recipients.length === 0) {
      toastError('Ajoute au moins une adresse email valide.');
      return;
    }

    setCreating(true);
    try {
      await createFormMailRoute({
        form_key: formKey,
        form_label: formLabel,
        description: newRoute.description || null,
        is_active: Boolean(newRoute.is_active),
        recipients,
      });

      toastSuccess('Nouveau formulaire ajoute.');
      notifyMutation();
      setNewRoute({
        form_key: '',
        form_label: '',
        description: '',
        recipients_text: '',
        is_active: true,
      });
      await loadRoutes();
    } catch (err) {
      console.error(err);
      toastError(err?.response?.data?.message || 'Impossible d\'ajouter ce formulaire.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="admin-mail-routes-page">
      <header className="admin-mail-routes-hero">
        <div>
          <h1>Routage emails formulaires</h1>
          <p>
            Definis quel formulaire envoie ses messages vers quelles boites email.
          </p>
        </div>
      </header>

      <section className="admin-mail-routes-card">
        <div className="admin-mail-routes-card-head">
          <h2>Ajouter un nouveau formulaire</h2>
        </div>

        <form className="admin-mail-routes-form" onSubmit={handleCreate}>
          <div className="admin-form-grid">
            <label className="admin-form-field">
              <span>Cle formulaire</span>
              <input
                className="admin-form-input"
                type="text"
                placeholder="ex: support_ticket"
                value={newRoute.form_key}
                onChange={(event) => setNewRoute((prev) => ({ ...prev, form_key: event.target.value }))}
              />
            </label>

            <label className="admin-form-field">
              <span>Libelle</span>
              <input
                className="admin-form-input"
                type="text"
                placeholder="ex: Ticket support"
                value={newRoute.form_label}
                onChange={(event) => setNewRoute((prev) => ({ ...prev, form_label: event.target.value }))}
              />
            </label>

            <label className="admin-form-field admin-form-grid-full">
              <span>Description</span>
              <input
                className="admin-form-input"
                type="text"
                placeholder="Description courte du formulaire"
                value={newRoute.description}
                onChange={(event) => setNewRoute((prev) => ({ ...prev, description: event.target.value }))}
              />
            </label>

            <label className="admin-form-field admin-form-grid-full">
              <span>Emails destinataires (1 par ligne)</span>
              <textarea
                className="admin-form-textarea"
                rows={4}
                placeholder={'support.clients@groupeisdafrik.com\\npartenariats@groupeisdafrik.com'}
                value={newRoute.recipients_text}
                onChange={(event) => setNewRoute((prev) => ({ ...prev, recipients_text: event.target.value }))}
              />
            </label>

            <label className="admin-form-checkbox">
              <input
                type="checkbox"
                checked={Boolean(newRoute.is_active)}
                onChange={(event) => setNewRoute((prev) => ({ ...prev, is_active: event.target.checked }))}
              />
              <span>Formulaire actif</span>
            </label>
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="admin-btn admin-btn-primary" disabled={creating}>
              {creating ? 'Ajout...' : 'Ajouter formulaire'}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-mail-routes-card">
        <div className="admin-mail-routes-card-head">
          <h2>Formulaires existants</h2>
          <span>{routes.length}</span>
        </div>

        {routes.length === 0 ? (
          <div className="admin-mail-routes-empty">Aucune configuration email disponible.</div>
        ) : (
          <div className="admin-mail-routes-list">
            {routes.map((route) => (
              <article key={route.form_key} className="admin-mail-routes-item">
                <div className="admin-mail-routes-item-head">
                  <div>
                    <h3>{route.form_label || route.form_key}</h3>
                    <code>{route.form_key}</code>
                  </div>
                  <label className="admin-form-checkbox">
                    <input
                      type="checkbox"
                      checked={Boolean(route.is_active)}
                      onChange={(event) => updateRouteState(route.form_key, 'is_active', event.target.checked)}
                    />
                    <span>Actif</span>
                  </label>
                </div>

                <label className="admin-form-field">
                  <span>Libelle formulaire</span>
                  <input
                    className="admin-form-input"
                    type="text"
                    value={route.form_label || ''}
                    onChange={(event) => updateRouteState(route.form_key, 'form_label', event.target.value)}
                  />
                </label>

                <label className="admin-form-field">
                  <span>Description</span>
                  <input
                    className="admin-form-input"
                    type="text"
                    value={route.description || ''}
                    onChange={(event) => updateRouteState(route.form_key, 'description', event.target.value)}
                  />
                </label>

                <label className="admin-form-field">
                  <span>Emails destinataires (1 par ligne)</span>
                  <textarea
                    className="admin-form-textarea"
                    rows={4}
                    value={route.recipients_text}
                    onChange={(event) => updateRouteState(route.form_key, 'recipients_text', event.target.value)}
                  />
                </label>

                <div className="admin-form-actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    onClick={() => handleSave(route)}
                    disabled={savingKey === route.form_key}
                  >
                    {savingKey === route.form_key ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
