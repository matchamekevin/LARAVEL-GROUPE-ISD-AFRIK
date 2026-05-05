# LARAVEL-GROUPE-ISD-AFRIK

## Démarrage local

- Démarrer l'environnement local: `./start.sh`
- Voir l'état des services: `./start.sh status`
- Suivre les logs: `./start.sh logs`
- Arrêter les services: `./start.sh stop`

## Commandes utiles

- Nettoyage cache Laravel: `php artisan config:clear && php artisan cache:clear && php artisan config:cache`
- Tunnel ngrok (optionnel): `ngrok http 8000`

## Sécurité

- Ne stockez pas les secrets (API keys, mots de passe, tokens) dans le dépôt.
- Utilisez des variables d'environnement dans `.env` local et dans la plateforme de déploiement.


