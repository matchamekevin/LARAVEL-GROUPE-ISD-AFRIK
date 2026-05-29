# Résumé des changements - Refactor HMR & SW + Corrections Build

## ✅ Frontend

### 1. **vite.config.js** (MAJEUR)
- ✅ Config dynamique HMR : détection APP_URL, auto-config hmr.host/protocol/port
- ✅ Fallback local sécurisé (localhost:5173 par défaut)
- ✅ Support ngrok tunneling via `VITE_USE_APP_URL_HMR=true` + `VITE_HMR_*`
- ✅ Dynamic `server.origin` pour compatibility avec laravel-vite-plugin

### 2. **resources/js/pages/Drones.jsx**
- ✅ Correction JSX cassé (balises fermées correctement)
- ✅ Icônes FontAwesome → Material Icons (cohérence avec design system)

### 3. **resources/js/utils/autoRefresh.js** (REFACTOR)
- ✅ Service Worker **désactivé par défaut** (flag `VITE_ENABLE_SERVICE_WORKER`)
- ✅ Guard `autoRefreshInitialized` (une seule init, prévient recréation)
- ✅ Suppression du "nettoyage" dev qui vidait caches à chaque refresh
- ✅ Injection manquante de null-check sur `registration.installing`

### 4. **resources/views/*.blade.php** (app, admin, layouts)
- ✅ Suppression des scripts qui désenregistraient SW à chaque load
- ✅ Cause probable du "refresh en boucle" rapide

---

## ✅ Backend

### 5. **phpunit.xml**
- ✅ Ajout `APP_KEY` de test (évite MissingAppKeyException)
- ✅ Ajout `VITE_ENABLE_SERVICE_WORKER=false` pour tests

### 6. **tests/Feature/AutoRefreshTest.php**
- ✅ Alignement avec feature flag SW
- ✅ Test skipped quand SW désactivé

### 7. **Dockerfile & Dockerfile.prod**
- ✅ Ajout `pdo_sqlite` + `libsqlite3-dev` (unblocking tests)

---

## 📋 État des tests

| Test | Status | Notes |
|---|---|---|
| `npm run build` | ✅ OK | Build prod sans erreur |
| `php artisan test tests/Feature/AutoRefreshTest.php` | ✅ 4/5 pass | 1 skipped (SW désactivé) |
| `composer test` (full suite) | ⚠️ 42 fail | Cause: PHP local n'a pas ext-sqlite (env, pas code) |

---

## 🚀 Production

- ✅ Assets pré-compilés via `npm run build` → `public/build/manifest.json`
- ✅ Service Worker désactivé en prod (via flag)
- ✅ Pas de dev server Vite, pas d'HMR
- ✅ Dockerfile builds avec PHP + `pdo_sqlite` (compat env test)

---

## 📄 Documentation

- ✅ `VITE_HMR_GUIDE.md` créé (dev local, remote ngrok, prod)

---

## Next Steps (optionnel)

1. Tester depuis navigateur (dev/prod)
2. Si besoin remote HMR : tunneliser Vite ngrok + `VITE_HMR_*`
3. Activer Service Worker en prod : `VITE_ENABLE_SERVICE_WORKER=true` + générer sw.js
