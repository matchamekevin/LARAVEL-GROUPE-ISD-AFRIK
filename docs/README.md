# ISD_AFRIK Backend

Backend Laravel pour le site de l'entreprise ISD AFRIK.

## Description
API et panneau d'administration pour la boutique et les services ISD AFRIK.

## Prérequis
- PHP >= 8.1
- Composer
- Node.js & npm
- Base de données (Postgres ou MySQL)

## Installation (rapide)
1. Copier le fichier d'environnement et configurer :

```bash
cp .env.example .env
```

2. Installer les dépendances PHP :

```bash
composer install
php artisan key:generate
```

3. Installer les dépendances JS et builder les assets :

```bash
npm install
npm run build   # ou `npm run dev` pour le développement
```

4. Migrer la base et exécuter les seeders :

```bash
php artisan migrate
php artisan db:seed
```

5. Lancer le serveur local :

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

Accéder à la SPA : `http://127.0.0.1:8000/`

## Variables utiles
- `APP_URL` : URL de l'application
- `FRONTEND_URL` : URL du frontend (pour redirections)
- `SANCTUM_STATEFUL_DOMAINS` : domaines stateful pour Sanctum (localhost, ngrok)

## Notes
- Les assets sont gérés avec Vite.
- Pour debug CSRF/SANCTUM, vérifier : `SESSION_DOMAIN`, `SESSION_DRIVER`, `SANCTUM_STATEFUL_DOMAINS` dans `.env`.

## Contacter
Pour toute question, contacte l'équipe de développement.

