# Déploiement sur Render (backend monolithique + assets)

Ce dépôt contient un `Dockerfile` et un `render.yaml` pour déployer le projet Laravel (backend + assets) sur Render sans modifier l'architecture existante.

Important : ce Dockerfile privilégie la simplicité — il build les assets (npm run build) et installe les dépendances Composer, puis lance `php artisan serve`. C'est suffisant pour un prototype / test gratuit. Pour production, préférez PHP-FPM + Nginx.

Étapes courtes
1. Poussez votre repo sur GitHub (branche `main`).
2. Ouvrez Render (https://render.com) et créez un nouveau service → `Web Service` en choisissant `Docker`.
3. Connectez votre repository GitHub et sélectionnez la branche `main`. Render lira `render.yaml` si présent.
4. Dans Render UI, créez aussi une base Postgres (New → Database → PostgreSQL) et connectez-la au service en ajoutant les variables d'environnement :
   - `DB_CONNECTION=pgsql`
   - `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` (depuis la DB créée)
   - `APP_KEY` (générez localement : `php artisan key:generate --show`)
   - `APP_URL=https://<votre-service>.onrender.com`
5. Déployez. Render build l'image Docker, exécute les étapes de build et lance le container. Le container exécute `php artisan serve` sur le port fourni.

Après le déploiement
- Exécutez les migrations (si non lancées automatiquement) via la console Render ou via un deploy hook :

```bash
php artisan migrate --force
php artisan storage:link
php artisan config:cache
```


Production-ready (Dockerfile.prod)
--------------------------------
J'ai ajouté `Dockerfile.prod`, `docker/nginx.conf` et `docker/supervisord.conf` pour une image plus proche d'une configuration production (PHP-FPM + Nginx). Le `render.yaml` a été mis à jour pour pointer vers `Dockerfile.prod`.

Variables d'environnement importantes pour la production
- `CORS_ALLOWED_ORIGINS` : liste séparée par des virgules des domaines autorisés (ex: `https://votre-frontend.vercel.app`). Si non défini, la valeur par défaut est `*` (pas recommandé).
- `VITE_API_URL` : URL publique de votre backend (utilisée par votre frontend si vous utilisez `import.meta.env.VITE_API_URL`).

Étapes pas-à-pas (production Docker)
1. Poussez la branche contenant `Dockerfile.prod` sur GitHub.
2. Dans Render, créez un Web Service (Docker) et pointez vers votre repo/branche. Le `render.yaml` facilite la configuration automatique.
3. Créez une base Postgres via Render Dashboard et copiez les credentials.
4. Ajoutez les variables d'environnement dans le service Render :
   - `APP_KEY` (générez localement: `php artisan key:generate --show`)
   - `APP_URL` = `https://<your-backend>.onrender.com`
   - `DB_CONNECTION=pgsql`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
   - `CORS_ALLOWED_ORIGINS=https://<your-frontend>.vercel.app`
   - `FILESYSTEM_DRIVER=s3` (optionnel) et variables S3 si utilisé
5. Deployez : Render build l'image, lance php-fpm + nginx via supervisord.
6. Ouvrez le shell Render ou activez un Deploy Hook pour exécuter :

```bash
composer install --no-dev --optimize-autoloader
php artisan key:generate --force
php artisan migrate --force
php artisan storage:link
php artisan config:cache
```

Configurer le frontend (Vercel)
------------------------------
1. Sur Vercel, créez un projet pointant sur le même repo (ou un repo séparé). Si vous laissez le frontend inside Laravel, vous pouvez déployer un build statique généré par Vite placé dans `public` (noter que dans notre Dockerfile.prod, `npm run build` est exécuté et les assets sont présents dans `public/build`).
2. Ajoutez la variable d'environnement `VITE_API_URL=https://<your-backend>.onrender.com` dans Vercel.
3. Déployez sur Vercel (ou utilisez le domaine fourni par Render si vous servez les assets depuis Laravel).

Besoin d'aide pour l'un des points ci-dessus ? Je peux :
- Ajuster `Dockerfile.prod` pour inclure S3 ou Redis si nécessaire.
- Tester localement la build Docker (si vous voulez que je lance `docker build` ici).
