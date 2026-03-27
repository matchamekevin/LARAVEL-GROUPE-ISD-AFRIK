# 🔄 Système d'Auto-Refresh Automatique

Ce système permet aux pages de se mettre à jour **automatiquement et invisiblement** à chaque modification sans interruption visible pour l'utilisateur.

## 📋 Architecture

### En DEV (Vite HMR)
- Vite HMR se charge automatiquement des hotreloads
- Configuré dans `vite.config.js`
- Les changements CSS/JS sont appliqués sans full refresh

### En PRODUCTION
Triple couche de détection des changements:

1. **Polling (30s)** - via `useAutoRefresh` hook
   - Vérifie `/manifest.json` toutes les 30 secondes
   - Detecte version changes via header ETag
   - Hard refresh invisible si nouvelle version détectée

2. **Service Worker** - `/public/sw.js`
   - Cache intelligent des assets statiques (CSS/JS/Fonts)
   - Network-first pour API calls (données fraîches)
   - Fonctionnement offline partiel
   - Background sync pour les requêtes en attente

3. **Focus/Online Events**
   - Check immédiat quand l'utilisateur revient à la fenêtre
   - Check quand la connexion internet revient

## 🔧 Fichiers Clés

```
resources/js/
├── hooks/
│   └── useAutoRefresh.js          # Hook React pour polling
├── utils/
│   └── autoRefresh.js              # Initialisation Service Worker
├── providers/
│   └── AutoRefreshProvider.jsx     # Provider React wrapper
└── app.jsx                          # Intégration du Provider

public/
├── sw.js                            # Service Worker
└── manifest.json                    # Manifest avec version (template)

app/Http/Controllers/
└── ManifestController.php           # Backend versioning

routes/
├── web.php                          # Route GET /manifest.json
└── api.php                          # Route POST /admin/refresh-manifest
```

## 🚀 Déploiement

### Au déploiement automatique
1. Les fichiers build sont écrits dans `public/build/`
2. Le hash du manifest Vite change automatiquement
3. Les clients détectent la version du manifest et rechargent

### Pour forcer un refresh (optionnel)
```bash
# Via API admin (en dev)
curl -X POST http://localhost:8000/api/admin/refresh-manifest \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## ⚙️ Configuration

### Polling Interval
Modifier dans `resources/js/hooks/useAutoRefresh.js` :
```javascript
pollingIntervalRef.current = setInterval(checkForUpdates, 30000); // 30 secondes
```

### Service Worker Scope
Modifier dans `resources/js/utils/autoRefresh.js` :
```javascript
await navigator.serviceWorker.register('/sw.js', {
  scope: '/',  // Ou '/app/' si nécessaire
});
```

### Cache Strategy
Modifier dans `public/sw.js` pour ajuster les stratégies de cache:
- `cacheFirst` - pour les assets (par défaut)
- `networkFirst` - pour l'API (par défaut)

## 📊 Monitoring

**Logs côté client** (console browser)
```
[AutoRefresh] App focused - checking for updates
[AutoRefresh] Mise à jour détectée: v1234567a -> v2345678b
[ServiceWorker] Installing...
[ServiceWorker] Precaching core assets
```

**Logs côté server** (logs Laravel)
```
ManifestController@show -> Manifest version: v1234567a
```

## 🔍 Dépannage

### Manifest.json retourne 404
- Vérifie que la route est correctement ajoutée dans `routes/web.php`
- Vérifie que `public/manifest.json` existe

### Service Worker ne s'enregistre pas
- En dev: c'est normal (Vite HMR géré)
- En prod: check `import.meta.env.PROD`
- Check les logs console: `[AutoRefresh] Service Worker registered`

### Flicker au refresh
- Le refresh est fait via `window.location.reload()` qui cache et applique smoothly
- Ajouter une transition CSS si besoin plus de smoothness

### Polling trop fréquent?
- Réduire la valeur `30000` ms dans `useAutoRefresh.js`

## 🔐 Sécurité

- Manifest.json publiquement accessible (nécessaire pour polling)
- Service Worker scope limité à `/`
- Refresh API endpoint protégé par middleware `isAdmin`
- Cache-Control headers prevent caching du manifest

## 📈 Performance

- **Polling**: 1 requête HTTP légère (ETag cache header)
- **Service Worker**: Transparent, utilise le cache navigateur
- **Assets**: Cache-first = chargement super rapide
- **API**: Network-first = données toujours fraîches
- **Zero impact UX**: Aucun flicker ou interruption

## 🎯 Cas d'Usage

✅ **Fonctionne pour:**
- CSS/SCSS changes
- JS/JSX changes (avec Vite HMR en dev)
- Backend data changes (via API polling)
- Service/features updates
- Bug fixes deployment

✅ **Transparent pour l'utilisateur:**
- Pas de modal "update available"
- Pas de freeze/interruption
- Pas de data loss
- Navigation continue pendant le refresh

---

**À propos**: Ce système est entièrement automatisé et n'envoie aucune notification ou interruption à l'utilisateur. Parfait pour SPA qui nécessite fraîcheur de données + déploiement transparent.
