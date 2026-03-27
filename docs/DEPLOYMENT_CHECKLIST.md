# 🚀 Checklist Déploiement Auto-Refresh

## Avant le déploiement

- [ ] Tous les changements sont committés et pushés
- [ ] Build est à jour: `npm run build`
- [ ] Pas d'erreurs TypeScript/ESLint: `npm run build` sans warnings
- [ ] Tests passent: `npm run test` (ou via CI/CD)

## Lors du déploiement

### Backend (Laravel)

- [ ] Migrer les changements: `php artisan migrate` (si applicable)
- [ ] Clear caches:
  ```bash
  php artisan cache:clear
  php artisan config:cache
  php artisan route:cache
  ```
- [ ] Vérifier que `ManifestController` est déclaré dans `app/Http/Controllers/`
- [ ] Routes ajoutées dans `routes/web.php` et `routes/api.php`
- [ ] Test endpoint: `curl http://your-domain/manifest.json`

### Frontend (Vite Build)

- [ ] Build assets: `npm run build`
- [ ] Vérifier que `public/build/` contient les fichiers compilés
- [ ] Check `public/build/.vite/manifest.json` existe (version tracking)
- [ ] Service Worker `public/sw.js` existe
- [ ] Manifest template `public/manifest.json` existe

### Configuration serveur/proxy

- [ ] Headers compressés pour `/manifest.json` (cache-control: no-cache)
- [ ] CORS accepte `/manifest.json` si frontend sur domaine différent
- [ ] Service Worker `public/sw.js` servi avec header correct: `Content-Type: application/javascript`

## Après le déploiement

### Tests manuels (DEV)

1. **Test local avec Vite Dev**
   ```bash
   npm run dev
   # Ouvrir http://localhost:5173
   # F12 -> Console, chercher [AutoRefresh] logs
   # Modifier un fichier JS/CSS -> doit hotreload
   ```

2. **Test local avec Build**
   ```bash
   npm run build
   php artisan serve
   # Ouvrir http://127.0.0.1:8000
   # F12 -> Application tab -> Service Workers
   # Vérifier que SW est registered
   ```

### Tests manuels (PROD)

3. **Test manifest endpoint**
   ```bash
   curl -I https://your-domain/manifest.json
   # Chercher: 
   # - Cache-Control: no-cache
   # - ETag: (version hash)
   ```

4. **Test Service Worker**
   ```
   F12 -> Application tab -> Service Workers
   - Vérifier "Registered" status
   - Check "active and running"
   - Vérifier scope = "/"
   ```

5. **Test polling mechanism**
   ```
   F12 -> Network tab -> filter by "manifest.json"
   - Attendre 30 secondes
   - Voir requêtes régulières vers /manifest.json
   - Status should be 200 or 304 (not modified)
   ```

6. **Test auto-refresh après déploiement**
   ```
   1. Garder l'app ouverte dans un onglet
   2. Déployer une nouvelle version
   3. Attendre 30 secondes (polling interval)
   4. App doit recharger automatiquement
   5. Pas de popup, pas d'interruption
   ```

7. **Test Service Worker caching**
   ```
   F12 -> Application -> Cache Storage
   - Vérifier caches "app-v1" ou similaire
   - Chercher assets CSS/JS cachées
   ```

### Monitoring en production

- [ ] Logger les erreurs de Service Worker
  ```javascript
  navigator.serviceWorker.addEventListener('error', (e) => {
    console.error('SW Error:', e);
    // Envoyer à error tracking (Sentry, etc)
  });
  ```

- [ ] Monitor health check endpoint (optionnel):
  ```bash
  # À ajouter si besoin plus d'un simple manifest check
  curl https://your-domain/api/health
  ```

## Rollback d'urgence

Si le système auto-refresh pose problème:

1. **Désactiver le polling** - Modifier `useAutoRefresh.js`:
   ```javascript
   // Commenter la fonction de polling
   // const checkForUpdates = () => { ... }
   ```

2. **Désactiver Service Worker** - Modifier `autoRefresh.js`:
   ```javascript
   // Commenter l'enregistrement SW
   // await navigator.serviceWorker.register(...)
   ```

3. **Nettoyer les caches** - F12 -> Application -> Clear Storage

4. **Force Hard Refresh** - Ctrl+Shift+R (Cmd+Shift+R sur Mac)

## Logs à surveiller

### Client logs (F12 Console)
```
[AutoRefresh] App focused - checking for updates
[AutoRefresh] Version changed: abc123 -> def456
[ServiceWorker] Installing...
[ServiceWorker] Precaching core assets
```

### Server logs (Laravel)
```
[AUTO_REFRESH] ManifestController@show - version: abc123
[AUTO_REFRESH] Admin requested refresh-manifest
```

### Error logs
```
[AutoRefresh] FAILED to fetch manifest
[ServiceWorker] Failed to cache resource: 404
```

## Troubleshooting rapide

| Problème | Solution |
|----------|----------|
| Manifest.json 404 | Vérifier route web.php + ManifestController exists |
| SW pas registered | Check DevTools, vérifier `/public/sw.js` accessible |
| Pas de polling | Check useAutoRefresh hook enabled, PROD env |
| Flicker au refresh | Normal, c'est window.location.reload() |
| Vieux assets affichés | Clear browser cache (Ctrl+Shift+Del) ou Cache Storage |
| Erreur CORS manifest | Vérifier headers serveur permettent GET /manifest.json |

---

**Durée test complet**: ~5-10 minutes
**Fréquence**: À chaque déploiement en production
**Criticité**: ⚠️ Haut (affecte UX globale)
