# Guide Vite HMR (Hot Module Replacement)

## Architecture générale

- **DEV (local ou distant)** : Vite server sur `localhost:5173` fournit HMR WebSocket.
- **PROD** : Assets pré-compilés via `npm run build` → `public/build/manifest.json` (pas de Vite, pas d'HMR).

---

## 1. Local Dev (DEV par défaut)

### Démarrage
```bash
npm run dev
```

**Résultat attendu :**
```
  VITE v7.3.1  ready in 1000 ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://10.x.x.x:5173/
```

`public/hot` est régénéré avec URL locale : `http://localhost:5173`

**Connexion HMR** : Le navigateur établit WebSocket vers `ws://localhost:5173/__vite_hmr`

---

## 2. Dev à distance via ngrok / serveur public

### Cas : APP_URL = `https://prolific-besottedly-lissette.ngrok-free.dev`

**Option 1 : Fallback local (défaut - **recommandé**)**  
Vite reste sur `localhost:5173`, le navigateur ignore APP_URL.
```
public/hot = http://localhost:5173
```
✅ **Fonctionne** si vous testez **depuis la même machine**

❌ **Ne fonctionne pas** si vous testez depuis un autre appareil

---

**Option 2 : Tunneliser Vite via ngrok**

1. Exposer le port 5173 en tunnel ngrok :
```bash
ngrok http 5173
```
→ Donne URL comme `https://1234-56-78-9-10.ngrok-free.dev`

2. Dans `.env` :
```env
VITE_USE_APP_URL_HMR=true
VITE_HMR_HOST=1234-56-78-9-10.ngrok-free.dev
VITE_HMR_PROTOCOL=wss
VITE_HMR_PORT=443
```

3. Redémarrer Vite :
```bash
npm run dev
```

`public/hot` sera régénéré avec la bonne URL.

✅ **Fonctionne** depuis **n'importe quel appareil** accédant via ngrok

---

## 3. Production

### Build
```bash
npm run build
```

Génère `public/build/` avec :
- `manifest.json` (index des assets)
- Bundles JS/CSS minifiés, hachés (`app-abc123.js`)

### Déploiement
1. **Assets statiques** servis depuis `public/build/` (CDN ou serveur local).
2. **Pas de Vite server** en production.
3. **Pas d'HMR** — refresh manuel ou CI/CD pour redéployer.

### Serveur (Laravel)
```bash
php artisan serve --host=0.0.0.0 --port=8000
```

Charge les assets via `@vite()` Blade directives (regarde `public/build/manifest.json`).

---

## 4. Tableau récapitulatif

| Environnement | Dev Server | HMR | public/hot | Notes |
|---|---|---|---|---|
| Local (npm run dev) | ✅ localhost:5173 | ✅ ws://localhost | http://localhost:5173 | Développement normal |
| Local avec APP_URL distant | ✅ localhost:5173 | ✅ ws://localhost | http://localhost:5173 | Fallback (tant qu'on teste local) |
| Distant via ngrok (VITE_USE_APP_URL_HMR=true) | ✅ localhost:5173 | ✅ wss://tunnel | https://tunnel.ngrok.dev | Faut tunneliser Vite aussi |
| Production | ❌ Aucun | ❌ Aucun | (ignoré) | Build statique, pas HMR |

---

## 5. Troubleshooting

### "Vite refusing to connect" en console
1. Vérifier `public/hot` existe et contient URL correcte.
2. Vérifier Vite server écoute sur le port/host listé.
3. Si distant, vérifier firewall / tunnel expose Vite.

### HMR en boucle / reconnect infini
→ Vérifier `vite.config.js` `hmr.protocol`, `hmr.host`, `hmr.port` ne créent pas mismatch.

### Changement `.env` non pris en compte immédiatement
Le watcher Vite ignore désormais `.env` pour éviter les redémarrages intempestifs du dev server.
Après modification de `.env`, redémarrer manuellement Vite :
```bash
npm run dev
```

### "Port 5173 already in use"
```bash
kill $(lsof -ti:5173) 2>/dev/null || true
npm run dev
```

---

## 6. Variables d'environnement

| Variable | Default | Notes |
|---|---|---|
| `VITE_DEV_HOST` | `0.0.0.0` | Host sur lequel écoute Vite |
| `VITE_DEV_PORT` | `5173` | Port Vite |
| `VITE_HMR_HOST` | `localhost` ou hostname APP_URL | Host du client WebSocket |
| `VITE_HMR_PROTOCOL` | `ws` ou `wss` si HTTPS | Protocole WebSocket |
| `VITE_HMR_PORT` | `5173` ou `443` si remote HTTPS | Port HMR côté client |
| `VITE_USE_APP_URL_HMR` | `false` | Si `true`, utiliser APP_URL pour HMR au lieu de localhost |
| `VITE_DEV_SERVER_URL` | Auto | URL complète du serveur dev (override auto) |

---

## 7. Recommandations

✅ **Pour dev** : Rester sur `localhost:5173`, refresh manual ou dev tool du navigateur.

✅ **Pour tests distants** : Tunneliser Vite via ngrok + configurer `VITE_HMR_*`.

✅ **Pour prod** : Aucune config HMR, juste serveur static + Laravel backend.

❌ **Éviter** : Mélanger APP_URL distant et Vite local sans tunnelisation (cause "connecting" infinit).
