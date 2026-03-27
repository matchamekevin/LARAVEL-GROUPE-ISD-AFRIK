# 🚀 Quick Reference - Auto-Refresh System

## TL;DR
L'app se met à jour **automatiquement et invisiblement** à chaque changement.
- **Dev**: Via Vite HMR (déjà fonctionnel)
- **Prod**: Via polling manifest.json (30s) + Service Worker

## Fichiers Clés

```
Dans resources/js/:
├── hooks/useAutoRefresh.js       ← Polling logic (React hook)
├── utils/autoRefresh.js          ← SW registration
├── providers/AutoRefreshProvider.jsx ← Context wrapper
└── app.jsx                        ← Wrapped with provider

Dans public/:
├── sw.js                          ← Service Worker
└── manifest.json                  ← Version template

Dans app/Http/:
└── Controllers/ManifestController.php ← Backend versioning

Routes:
├── GET /manifest.json  → Serve versioned manifest
└── POST /api/admin/refresh-manifest → Force refresh (admin only)
```

## Configuration

### Changer l'intervalle de polling
Edit `resources/js/hooks/useAutoRefresh.js`:
```javascript
const POLLING_INTERVAL = 30000; // 30 secondes
```

### Désactiver temporairement
Edit `resources/js/utils/autoRefresh.js`:
```javascript
// Commenter la ligne:
// await navigator.serviceWorker.register('/sw.js');
```

## Tests Rapides

**Test manifest endpoint**:
```bash
curl http://localhost:8000/manifest.json | jq
# Doit retourner: { "version": "abc123...", "timestamp": 1234567890 }
```

**Test Service Worker**:
```
F12 → Application → Service Workers
# Doit montrer "active and running"
```

**Test polling**:
```
F12 → Network → filter "manifest.json"
# Attendre 30s → voir nouvelle requête
# Status: 304 (Not Modified) ou 200
```

## Debugging

**Console Logs** (F12 Console):
```
[AutoRefresh] App focused - checking for updates
[AutoRefresh] Version changed: abc123 -> def456
[ServiceWorker] Installing...
```

**Problèmes courants**:
| Symptôme | Cause | Solution |
|----------|-------|----------|
| `Manifest 404` | Route pas trouvée | Vérifier routes/web.php |
| `SW pas registered` | Import oublié | Vérifier imports dans app.jsx |
| Pas de polling | PROD check failed | Vérifier `import.meta.env.PROD` |
| Flicker au refresh | Normal | C'est window.location.reload() |

## Production Checklist

- [ ] `npm run build` success
- [ ] `/public/build/` contient les assets
- [ ] ManifestController exists
- [ ] Routes ajoutées dans web.php + api.php
- [ ] Service Worker `/sw.js` accessible
- [ ] Test: `curl /manifest.json` → 200 OK + version
- [ ] Test: F12 → Service Workers → active
- [ ] Tests: `php artisan test`

## Rollback d'urgence

```javascript
// 1. Désactiver polling
// → Commenter la ligne polling dans useAutoRefresh.js

// 2. Désactiver Service Worker
// → Commenter l'enregistrement dans autoRefresh.js

// 3. Clear client caches
// → F12 → Clear Storage → Clear all

// 4. Force hard refresh
// → Ctrl+Shift+R
```

## Fichiers de Référence

- **Technical Docs**: [docs/AUTO_REFRESH.md](docs/AUTO_REFRESH.md)
- **Deployment**: [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)
- **Full Report**: [docs/SESSION_COMPLETION_REPORT.md](docs/SESSION_COMPLETION_REPORT.md)
- **Tests**: `tests/Feature/AutoRefreshTest.php`

## Performance Impact

- **Polling**: 1 requête HTTP/30s (très léger, ETag cache)
- **Service Worker**: ~50KB total, transparent
- **Network**: Cache-first pour assets (très rapide)
- **API**: Network-first (données fraîches)

## Zones d'Intérêt

**Où ça se passe côté frontend**:
1. App mount → AutoRefreshProvider wraps App
2. Provider calls useAutoRefresh hook
3. Hook starts polling manifest.json every 30s
4. Version change detected → window.location.reload()

**Où ça se passe côté backend**:
1. GET /manifest.json → ManifestController@show()
2. Controller calcule version depuis build hash
3. Retourne JSON avec ETag header (pour polling efficiency)

**Service Worker caching**:
- `/api/*` routes → network-first (données fraîches)
- `*.css`, `*.js`, `*.woff` → cache-first (rapidité)
- Autres requests → network-only

---

**Questions?** Voir docs/ folder pour docs complètes.
