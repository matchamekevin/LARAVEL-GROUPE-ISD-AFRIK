# Plan de sauvegarde et d'import des produits (production)

Date: 2026-04-09
Auteur: automatisation (préparation par Copilot)

Objectif
- Remplacer/importer la donnée "produits / catégories / images" pour la portion "general" (ou l'ensemble, selon choix), avec sauvegardes complètes et possibilité de rollback.

Pré-requis
- Accès SSH au serveur de production (ou interface d'administration du PaaS).
- Accès à la base PostgreSQL (host/port/db/user/password), ou à `DATABASE_URL`.
- Accès aux fichiers médias (chemin public/uploads, storage/app/public ou bucket S3 selon setup).
- Espace disque suffisant pour stocker sauvegardes locales et distantes.
- Tests préalables sur un staging identique quand possible.

Résumé des étapes
1. Préparation & vérifications
2. Mode maintenance (production)
3. Sauvegarde base de données (dump complet + export segment si besoin)
4. Sauvegarde médias (rsync / tar / s3 sync)
5. Export locaux (préparer CSV / SQL d'import)
6. Suppression segment cible en prod (optionnel, via transaction)
7. Import des catégories puis produits
8. Import des images et mise à jour des chemins
9. Vérifications et validations
10. Remise en ligne / nettoyage
11. Rollback si nécessaire

---

Détails et commandes (exemples)

IMPORTANT : remplacez les variables en MAJUSCULES par vos valeurs réelles avant d'exécuter.

1) Pré-checks (local)
- Confirmer la liste des fichiers médias locaux et comptages :

```bash
wc -l tmp/local_counts.csv
ls -la public/uploads | head
```

2) Mettre l'application en maintenance (production)
- Si vous avez SSH sur le serveur :

```bash
ssh USER@PROD
cd /path/to/app
php artisan down --message="Maintenance import produits"
```

- Si vous utilisez Render/Heroku/etc, utilisez l'interface pour exécuter `php artisan down` ou déployer un conteneur temporaire qui exécute la commande.

3) Sauvegarde base (dump complet PostgreSQL)
- Avec variables séparées :

```bash
export PGPASSWORD='PROD_DB_PASSWORD'
pg_dump -h PROD_DB_HOST -p PROD_DB_PORT -U PROD_DB_USER -F c -b -v -f /tmp/backup_prod_$(date +%Y%m%d%H%M).dump PROD_DB_NAME
# puis rapatrier le dump localement
scp USER@PROD:/tmp/backup_prod_*.dump ./backups/
```

- Si `DATABASE_URL` est disponible (format postgres://user:pass@host:port/db) :

```bash
pg_dump "$DATABASE_URL" -F c -b -v -f /tmp/backup_prod_$(date +%Y%m%d%H%M).dump
```

- Vérifier l'intégrité :

```bash
pg_restore -l /tmp/backup_prod_YYYYMMDD.dump | head
```

4) Sauvegarde médias (rsync ou tar)
- Rsync (remote -> local) :

```bash
# dry-run d'abord
rsync -avz --progress --dry-run USER@PROD:/var/www/html/public/uploads/ ./backups/uploads-YYYYMMDD/
# si OK, lancer sans --dry-run
rsync -avz --progress USER@PROD:/var/www/html/public/uploads/ ./backups/uploads-YYYYMMDD/
```

- Ou tar gz sur le serveur puis scp :

```bash
ssh USER@PROD "tar -C /var/www/html/public -czf /tmp/uploads_backup_$(date +%Y%m%d%H%M).tar.gz uploads"
scp USER@PROD:/tmp/uploads_backup_*.tar.gz ./backups/
```

- Si les médias sont dans S3/GCS : utiliser `aws s3 sync` ou `gsutil` pour exporter.

5) Export ciblé (optionnel) — dump des produits "general"
- Pour exporter uniquement un segment (ex: condition WHERE):

```bash
export PGPASSWORD='PROD_DB_PASSWORD'
psql -h PROD_DB_HOST -p PROD_DB_PORT -U PROD_DB_USER -d PROD_DB_NAME -c "\copy (SELECT * FROM produits WHERE <VOTRE_CONDITION>) TO '/tmp/produits_general_$(date +%Y%m%d).csv' CSV HEADER"
scp USER@PROD:/tmp/produits_general_*.csv ./backups/
```

- Ajustez `<VOTRE_CONDITION>` (ex: `id_segment='general'` ou `id_categorie IN (...)`).

6) (Optionnel) Suppression des enregistrements cibles en prod
- Exemple : basculer dans une transaction et supprimer :

```sql
BEGIN;
-- vérifier :
SELECT COUNT(*) FROM produits WHERE <VOTRE_CONDITION>;
-- supprimer seulement quand prêt :
DELETE FROM produits WHERE <VOTRE_CONDITION>;
-- VALIDER après vérifications
COMMIT;
-- ou ROLLBACK en cas de problème
```

> Recommandation : préférez créer une table temporaire ou importer dans une table de staging, valider, puis remplacer par `INSERT INTO ... SELECT ...` et basculer avec `BEGIN/COMMIT`.

7) Import des catégories puis produits
- Import CSV (exemple générique) :

```bash
# transférer fichiers CSV sur le serveur /tmp
scp ./imports/categories.csv USER@PROD:/tmp/
scp ./imports/produits_general.csv USER@PROD:/tmp/

# sur le serveur
export PGPASSWORD='PROD_DB_PASSWORD'
psql -h PROD_DB_HOST -p PROD_DB_PORT -U PROD_DB_USER -d PROD_DB_NAME -c "\copy categories(col1,col2,...) FROM '/tmp/categories.csv' CSV HEADER"
psql -h PROD_DB_HOST -p PROD_DB_PORT -U PROD_DB_USER -d PROD_DB_NAME -c "\copy produits(colA,colB,...) FROM '/tmp/produits_general.csv' CSV HEADER"
```

- Si vous avez un dump `pg_restore` :

```bash
pg_restore --no-owner --role=PROD_DB_USER -h PROD_DB_HOST -p PROD_DB_PORT -U PROD_DB_USER -d PROD_DB_NAME /tmp/backup_import.dump
```

8) Import/Mise en place des images
- Copier les images dans `public/uploads/` (ou l'emplacement attendu) :

```bash
rsync -avz ./imports/uploads/ USER@PROD:/var/www/html/public/uploads/
# Vérifier permissions
ssh USER@PROD "chown -R www-data:www-data /var/www/html/public/uploads && chmod -R 755 /var/www/html/public/uploads"
```

- Si la base stocke des chemins relatifs, vérifier que les noms correspondent. Si besoin, exécuter un script SQL pour mettre à jour les chemins :

```sql
UPDATE produits SET image_path = 'uploads/' || filename WHERE reference = 'XXX';
```

9) Maintenance post-import (cache, files, queues)

```bash
ssh USER@PROD "cd /var/www/html && php artisan storage:link && php artisan config:clear && php artisan cache:clear && php artisan route:cache && php artisan view:clear && php artisan queue:restart"
```

10) Vérifications (checks)
- Comptages :

```bash
psql -h PROD_DB_HOST -U PROD_DB_USER -d PROD_DB_NAME -c "SELECT COUNT(*) FROM produits WHERE <VOTRE_CONDITION>;"
```

- Comparer avec `local_counts.csv` (nombre attendu).
- Spot-check 10 produits aléatoires : vérifier que l'API renvoie les données et que les images sont accessibles par URL.

11) Remise en ligne

```bash
ssh USER@PROD "cd /var/www/html && php artisan up"
```

12) Rollback (si nécessaire)
- Restaurer la sauvegarde complète :

```bash
# restaurer dump complet (restore remplace / nettoie les objets si --clean utilisé)
export PGPASSWORD='PROD_DB_PASSWORD'
pg_restore --clean --if-exists --no-owner -h PROD_DB_HOST -p PROD_DB_PORT -U PROD_DB_USER -d PROD_DB_NAME /path/to/backup_prod_YYYYMMDD.dump

# restaurer médias
rsync -avz ./backups/uploads-YYYYMMDD/ USER@PROD:/var/www/html/public/uploads/
```

13) Notes spécifiques PaaS (Render, etc.)
- Render offre des snapshots / backups gérés : privilégiez la création d'un snapshot via l'interface avant toute opération destructive.
- Pour les fichiers : si `PUBLIC` ou `STORAGE` est rendu via CDN ou bucket, préférez `aws s3 sync` plutôt que `rsync`.

14) Validation finale & monitoring
- Surveiller logs `storage/logs/laravel.log`, erreurs HTTP 500, et queue failures.
- Laisser surveillance 1-2 heures et exécuter contrôles QA.

Checklist rapide avant exécution
- [ ] Backups DB & médias créés et rapatriés localement
- [ ] Fichiers d'import prêts (CSV/attachments) et testés sur staging
- [ ] Commandes `--dry-run` validées (rsync)
- [ ] Maintenance mode activé
- [ ] Personne en production n'effectue d'opérations concurrentes

---

Besoin d'aide complémentaire
- Je peux générer des scripts bash exécutables (`scripts/backup_prod.sh`, `scripts/import_prod.sh`) basés sur ce plan (avec placeholders à remplir),
- ou préparer un playbook Ansible pour automatiser la procédure.

Si vous voulez, je génère maintenant les scripts bash prêts à exécuter (avec variables à remplir). Indiquez si l'hébergement utilise SSH classique ou un PaaS (Render/Heroku) pour adapter les commandes.
