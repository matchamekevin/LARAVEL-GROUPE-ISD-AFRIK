# Scripts d'import / backup

Fichiers créés:
- `scripts/backup_prod.sh` : sauvegarde base PostgreSQL et médias depuis le serveur de production.
- `scripts/import_prod.sh` : import des CSV (categories, produits) et des images vers la production.

Prérequis:
- Accès SSH au serveur de production et variables d'environnement sur le serveur (`DATABASE_URL` configurée).
- `pg_dump`, `psql`, `tar`, `scp`, `rsync` installés sur les machines locales et distantes selon les actions.
- Avoir créé un dossier `backups/` localement pour stocker les sauvegardes.

Utilisation basique:

```bash
# Sauvegarder (exemple)
PROD_SSH_USER=deploy PROD_HOST=prod.example.com PROD_APP_PATH=/var/www/html BACKUP_DIR=./backups ./scripts/backup_prod.sh

# Importer (exemple) — interactif (répondre 'yes' pour confirmer)
PROD_SSH_USER=deploy PROD_HOST=prod.example.com PROD_APP_PATH=/var/www/html IMPORT_DIR=./imports ./scripts/import_prod.sh
```

Sécurité & bonnes pratiques:
- Toujours exécuter `scripts/backup_prod.sh` avant toute opération destructive.
- Tester la procédure sur un environnement de staging identique.
- Ne partagez jamais vos credentials en clair; utilisez des secrets/variables d'environnement.
- Exécutez d'abord avec `DRY_RUN=1` pour voir les commandes sans les exécuter.

Note:
- Ces scripts sont des squelettes sûrs mais non exhaustifs; adaptez-les à votre environnement (chemins, roles, utilisateurs, S3, etc.).
