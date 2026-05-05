Réorganisation de la racine — 22 avril 2026

Objectif
- Garder la racine propre et centrée sur le code applicatif (Laravel) et les fichiers d'infrastructure.
- Éviter que les fichiers de diagnostics/export se recréent à la racine.

Structure retenue
- `app/`, `bootstrap/`, `config/`, `database/`, `public/`, `resources/`, `routes/`, `storage/`, `tests/`, `vendor/` : cœur Laravel.
- `scripts/` : scripts utilitaires/ops.
- `docker/`, `ansible/`, `dev/` : outillage de déploiement et local dev.
- `tools/ide/` : fichiers générés pour l'autocomplétion IDE.
- `data/` : exports, archives et diagnostics.

Changements appliqués
- Les scripts `scripts/verify_counts.sh` et `scripts/business_checks.sh` écrivent désormais dans `data/` au lieu de polluer la racine.
- Les credentials codés en dur ont été retirés des scripts et remplacés par variables d'environnement `PROD_CONN` et `LOCAL_CONN`.
- Le script `scripts/sync_local_general_to_prod.sh` utilise maintenant `LOCAL_DSN`/`PROD_DSN` via l'environnement et écrit ses exports dans `data/tmp`.
- Le token en dur de `dev/ngrok.yml` a été remplacé par une valeur placeholder.
- Le `README.md` a été nettoyé (plus de clé/tokens exposés).

Variables requises pour les scripts DB
- `PROD_CONN`
- `LOCAL_CONN`
- Optionnel: `OUT_DIR`

Exemple
```bash
export PROD_CONN='postgresql://user:pass@host:5432/db?sslmode=require'
export LOCAL_CONN='postgresql://user:pass@127.0.0.1:5432/db?sslmode=disable'
./scripts/verify_counts.sh
./scripts/business_checks.sh
```

Notes
- Les fichiers essentiels Laravel n'ont pas été déplacés.
- Les changements de chemins ont été faits pour stabiliser l'organisation de la racine dans le temps.
