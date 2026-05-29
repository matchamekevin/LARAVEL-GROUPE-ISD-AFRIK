# LARAVEL-GROUPE-ISD-AFRIK

Plateforme e-commerce Laravel + React (Vite).

## Prérequis

- PHP 8.2+
- Composer
- Node.js 20.19.0+
- PostgreSQL (avec l'extension PHP `pdo_pgsql`)
- Extensions PHP : `dom`, `simplexml`, `xml`, `xmlwriter`, `mbstring`, `curl`, `zip`

## Démarrage rapide

```bash
git clone <repo>
cd LARAVEL-GROUPE-ISD-AFRIK
cp .env.example .env     # configurer la base de données
./start.sh               # lance tout (Vite, Laravel, queue, Reverb)
```

## Démarrage manuel

```bash
# 1. Installer les dépendances
composer install
npm install

# 2. Initialiser la base
php artisan migrate

# 3. Démarrer les services (dans des terminaux séparés)
npm run dev              # Vite (port 5173)
php artisan serve        # Laravel (port 8000)
php artisan reverb:start # WebSocket (port 8080, optionnel)
php artisan queue:work   # Worker queue (si nécessaire)
```

## Commandes utiles

| Commande | Description |
|---|---|
| `./start.sh` | Démarre tous les services |
| `./start.sh stop` | Arrête tous les services |
| `./start.sh status` | Vérifie l'état des services |
| `./start.sh logs` | Suit les logs en temps réel |
| `php artisan migrate` | Exécute les migrations |
| `php artisan db:seed` | Insère les données de démo |
| `php artisan optimize:clear` | Vide tous les caches Laravel |
| `npm run build` | Compile le frontend pour la production |
| `ngrok http 8000` | Tunnel ngrok (optionnel) |

## Dépannage

### `could not find driver` (pdo_pgsql)

```bash
sudo apt install php-pgsql
# Redémarrer le serveur après installation
```

### Connexion WebSocket refusée (port 8080)

Le plus souvent **non bloquant** — le site fonctionne sans. Relancer avec :

```bash
php artisan reverb:start
```

## Sécurité

- Les secrets (clés API, mots de passe) sont dans `.env`, **jamais** dans le dépôt.
- En production, utiliser des variables d'environnement sécurisées.
